import { describe, expect, it } from "vitest";
import { isOpenSourceAllowed, kb, type KnowledgeBase, type Rule } from "@/modules/knowledge-base";
import { baseScore, evaluateCondition, score, validateInput } from "@/modules/scoring";
import { golden } from "./golden";

const withRules = (rules: Rule[]): KnowledgeBase => ({ ...kb, rules: [...kb.rules, ...rules] });
const rule = (r: Partial<Rule> & Pick<Rule, "id" | "when" | "effects">): Rule => ({
  name: r.id,
  explanation: `${r.id} fired`,
  sources: [{ kind: "design", note: "test", reviewed: true }],
  ...r,
});

describe("conditions", () => {
  const ctx = {
    answers: { "data-flags": ["money"], "app-kind": "web-app" },
    skills: { python: "strong" },
    style: "layered",
  };
  it("supports eq, in, has, all, any, not", () => {
    expect(evaluateCondition({ eq: ["q.app-kind", "web-app"] }, ctx)).toBe(true);
    expect(evaluateCondition({ eq: ["q.deadline", "not-sure"] }, ctx)).toBe(true); // unset = not-sure
    expect(evaluateCondition({ in: ["skill.python", ["some", "strong"]] }, ctx)).toBe(true);
    expect(evaluateCondition({ in: ["q.data-flags", ["money"]] }, ctx)).toBe(false); // `in` needs a single value
    expect(evaluateCondition({ has: ["q.data-flags", "money"] }, ctx)).toBe(true);
    expect(evaluateCondition({ has: ["q.app-kind", "web-app"] }, ctx)).toBe(false); // `has` needs a list
    expect(evaluateCondition({ eq: ["skill.go", "none"] }, ctx)).toBe(true); // unset = none
    expect(evaluateCondition({ eq: ["style", "layered"] }, ctx)).toBe(true);
    expect(evaluateCondition({ all: [{ eq: ["style", "layered"] }, { not: { eq: ["style", "x"] } }] }, ctx)).toBe(true);
    expect(evaluateCondition({ any: [{ eq: ["style", "x"] }, { eq: ["style", "y"] }] }, ctx)).toBe(false);
  });
  it("compares weight levels with gte, only once weights are known", () => {
    expect(() => evaluateCondition({ gte: ["weight.maturity", "high"] }, ctx)).toThrow(/before weights/);
    const w = { ...ctx, weights: { maturity: "high" as const } };
    expect(evaluateCondition({ gte: ["weight.maturity", "high"] }, w)).toBe(true);
    expect(evaluateCondition({ gte: ["weight.maturity", "critical"] }, w)).toBe(false);
  });
});

describe("input validation", () => {
  it.each([
    [{ weights: { nope: "high" as const } }, /unknown criterion/],
    [{ answers: { nope: "x" } }, /unknown question/],
    [{ answers: { "app-kind": "x" } }, /no option/],
    [{ answers: { "app-kind": ["web-app"] } }, /expects single/],
    [{ answers: { "data-flags": "money" } }, /expects multi/],
    [{ skills: { cobol: "strong" as const } }, /unknown language/],
    [{ knownFrameworks: ["relational"] }, /unknown framework/],
    [{ style: "big-ball-of-mud" }, /unknown architecture style/],
  ])("rejects %j", (input, error) => {
    expect(() => validateInput(input, kb)).toThrow(error);
  });
});

describe("score", () => {
  it("uses 50 when every applicable weight is zero", () => {
    const relational = kb.options.find((o) => o.id === "relational")!;
    expect(baseScore(relational, ["learning-curve"], { "learning-curve": 0 })).toBe(50);
    expect(() => baseScore(relational, ["cost"], { cost: 1 })).toThrow(/no score/);
  });

  it("records an input conflict when a floor overrides an explicit lower level", () => {
    const r = score({ answers: { "real-time": "yes" }, weights: { "real-time": "low" } }, kb);
    expect(r.effectiveWeights["real-time"]).toBe("high");
    expect(r.inputConflicts).toEqual([{ criterion: "real-time", chosen: "low", used: "high", ruleId: "S5" }]);
    expect(score({ answers: { "real-time": "yes" } }, kb).inputConflicts).toEqual([]);
  });

  it("applies otherwise branches, notes and exclusions", () => {
    const r = score({ answers: { "data-shape": "documents", "app-kind": "api-only" } }, kb);
    expect(r.firedRules.find((f) => f.id === "D7")?.branch).toBe("otherwise");
    expect(r.notes).toContain("PostgreSQL's JSONB can store documents too.");
    expect(r.parts.backend!.types.map((t) => t.id)).not.toContain("fullstack");
    expect(r.parts.backend!.excluded).toEqual(["fullstack", "frontend-server"]);
  });

  it("excludes a product directly and runs weight-dependent rules after floors", () => {
    const k = withRules([
      rule({
        id: "K90",
        when: { gte: ["weight.maturity", "high"] },
        effects: [{ type: "exclude", target: "express" }],
      }),
    ]);
    const r = score({ answers: { lifespan: "5-plus-years" } }, k); // S8 raises maturity to high first
    expect(r.parts.backend!.excluded).toContain("express");
    expect(r.parts.backend!.products.map((p) => p.id)).not.toContain("express");
    expect(score({}, k).parts.backend!.excluded).not.toContain("express");
  });

  it("adds skill points through the product's language and for known frameworks, within the skill cap", () => {
    const r = score({ skills: { python: "strong" }, knownFrameworks: ["django"] }, kb);
    const django = r.parts.backend!.products.find((p) => p.id === "django")!;
    expect(django.skill).toBe(20);
    const k = { ...kb, skills: kb.skills.map((s) => ({ ...s, productPoints: 40 })) };
    expect(
      score({ skills: { python: "strong" }, knownFrameworks: ["django"] }, k).parts.backend!.products.find(
        (p) => p.id === "django",
      )!.skill,
    ).toBe(25);
  });

  it("charges products outside the chosen type the type gap (cand)", () => {
    const r = score({ answers: { "data-shape": "documents" } }, kb);
    const db = r.parts.database!;
    const top = db.types[0]!.final;
    const pg = db.products.find((p) => p.id === "postgresql")!;
    const relational = db.types.find((t) => t.id === "relational")!.final;
    expect(pg.cand).toBeCloseTo(pg.final - (top - relational));
  });

  it("reports no close call when the runner-up is 5 or more points behind", () => {
    const r = score({ answers: { "data-shape": "documents", "data-flags": ["fields-vary"] } }, kb);
    expect(r.parts.database!.closeCall).toBeUndefined();
  });
});

describe("language part, team skills and stack assembly", () => {
  it("scores languages as one-level products and adds T1/T2 language points", () => {
    const r = score({ skills: { go: "strong", php: "some" } }, kb);
    const lang = r.parts.language!;
    expect(lang.chosenType).toBeUndefined();
    expect(lang.products.find((p) => p.id === "go")!.skill).toBe(20);
    expect(lang.products.find((p) => p.id === "php")!.skill).toBe(10);
  });

  it("T4: a tight deadline costs languages nobody knows, if the team knows another", () => {
    const r = score({ answers: { deadline: "tight" }, skills: { python: "some" } }, kb);
    expect(r.parts.language!.products.find((p) => p.id === "go")!.skill).toBe(-10);
    expect(
      score({ answers: { deadline: "tight" } }, kb).parts.language!.products.find((p) => p.id === "go")!.skill,
    ).toBe(0);
  });

  it("T5: goal 'learn' halves skill effects and raises learning-curve to at least medium", () => {
    const r = score({ skills: { java: "strong" }, goal: "learn" }, kb);
    expect(r.parts.language!.products.find((p) => p.id === "java")!.skill).toBe(10);
    expect(r.effectiveWeights["learning-curve"]).toBe("medium");
    expect(r.parts.backend!.products.find((p) => p.id === "spring-boot")!.skill).toBe(5);
  });

  it("T6: a strongly known language never loses to one nobody knows, in the list and the stack", () => {
    const r = score({ skills: { php: "strong", python: "some" }, weights: { performance: "critical" } }, kb);
    const ids = r.parts.language!.products.map((p) => p.id);
    for (const unknown of ["typescript-node", "java", "csharp", "go"])
      expect(ids.indexOf("php")).toBeLessThan(ids.indexOf(unknown));
    expect(["php", "python"]).toContain(r.stack.picks.language);
    // With goal "learn" the hard rule is off.
    const learn = score({ skills: { php: "strong" }, weights: { performance: "critical" }, goal: "learn" }, kb);
    expect(learn.parts.language!.products[0]!.id).not.toBe("php");
  });

  it("T6 doesn't apply when a rule excludes the strong language", () => {
    const k = withRules([
      rule({ id: "K91", when: { eq: ["style", "peer-to-peer"] }, effects: [{ type: "exclude", target: "php" }] }),
    ]);
    const r = score({ skills: { php: "strong" }, style: "peer-to-peer" }, k);
    expect(r.parts.language!.products.map((p) => p.id)).not.toContain("php");
    expect(r.stack.picks.language).toBeDefined();
  });

  it("S9: no backend, no server language", () => {
    const r = score({ answers: { "app-kind": "portfolio", "data-shape": "none" } }, kb);
    expect(r.parts.language!.needed).toBe(false);
    expect(r.parts.language!.notNeededBy).toBe("S9");
    // Only the frontend is left: static pages, no server (S12 removes the approaches that need one).
    expect(Object.keys(r.stack.picks)).toEqual(["frontend", "hosting"]);
    expect(r.parts.frontend!.types.map((x) => x.id)).not.toContain("ssr");
    expect(r.parts.frontend!.types.map((x) => x.id)).not.toContain("server-templates");
  });

  describe("hosting rules and relations (Part 5)", () => {
    const host = (input: Parameters<typeof score>[0], k: KnowledgeBase = kb) => score(input, k);
    const ids = (r: ReturnType<typeof score>, part = "hosting") => r.parts[part]!.products.map((p) => p.id);

    it("K1: commercial + free only excludes Vercel; K1b: a commercial app excludes GitHub Pages", () => {
      expect(ids(host({ answers: { commercial: "yes", budget: "free-only" } }))).not.toContain("vercel");
      expect(ids(host({ answers: { commercial: "yes", "app-kind": "e-commerce" } }))).not.toContain("github-pages");
      const site = host({ answers: { commercial: "yes", "app-kind": "content-site", "data-shape": "none" } });
      expect(site.notes.join(" ")).toMatch(/GitHub Pages isn't meant for running an online business/);
    });

    it("K2: a commercial project with a budget gets the Vercel Pro note", () => {
      expect(host({ answers: { commercial: "yes", budget: "small-paid" } }).notes.join(" ")).toMatch(/Pro plan/);
    });

    it("K3: must self-host leaves only the VPS", () => {
      const r = host({ answers: { "hosting-rule": "self-host" } });
      expect(ids(r)).toEqual(["vps-server"]);
      expect(r.parts.hosting!.chosenType).toBe("vps");
      expect(r.stack.picks.hosting).toBe("vps-server");
    });

    it("K4: a required cloud is the only hosting option", () => {
      for (const cloud of ["aws", "azure", "gcp"]) {
        const r = host({ answers: { "hosting-rule": cloud } });
        expect(ids(r)).toEqual([cloud]);
        expect(r.stack.picks.hosting).toBe(cloud);
      }
    });

    it("K5: free only excludes Railway, Fly.io and the VPS", () => {
      const left = ids(host({ answers: { budget: "free-only" } }));
      for (const x of ["railway", "fly-io", "vps-server"]) expect(left).not.toContain(x);
    });

    it("K6: open source only excludes MongoDB (SSPL) but keeps SQLite (public domain)", () => {
      const r = host({ answers: { "open-source-only": "yes", "data-shape": "documents" } });
      expect(ids(r, "database")).not.toContain("mongodb");
      expect(ids(r, "database")).toContain("sqlite");
      expect(r.notes.join(" ")).toMatch(/JSONB/);
      // Every product that isn't open source (and isn't public domain or a service) is in K6's list.
      const k6 = kb.rules.find((x) => x.id === "K6")!;
      const excluded = k6.effects.flatMap((e) => (e.type === "exclude" ? [e.target] : []));
      const notOpen = kb.options.filter((o) => o.level === "product" && !isOpenSourceAllowed(o)).map((o) => o.id);
      expect(excluded.sort()).toEqual(notOpen.sort());
    });

    it("K7: real-time costs Netlify 15 points; Vercel only gets the pub/sub note", () => {
      const base = host({});
      const live = host({ answers: { "real-time": "yes" } });
      const rulesOf = (r: typeof base, id: string) => r.parts.hosting!.products.find((p) => p.id === id)?.rules ?? 0;
      expect(rulesOf(live, "netlify") - rulesOf(base, "netlify")).toBe(-15);
      expect(rulesOf(live, "vercel")).toBe(rulesOf(base, "vercel"));
      const relations = kb.compatibility.filter((c) => c.id === "C-vercel-realtime");
      expect(relations).toHaveLength(1);
    });

    it("K8: a stack with a backend never uses static hosting", () => {
      const r = host({ answers: { "app-kind": "web-app" } });
      expect(r.parts.hosting!.types.map((x) => x.id)).not.toContain("static-hosting");
      expect(r.stack.picks.hosting).not.toBe("github-pages");
    });

    it("K9: Java on Vercel pays the beta penalty (-5, or -10 with maturity High), off once the fact says GA", () => {
      const k: KnowledgeBase = {
        ...kb,
        rules: [
          ...kb.rules,
          rule({
            id: "K95",
            when: { eq: ["style", "peer-to-peer"] },
            effects: [
              "github-pages",
              "netlify",
              "cloudflare",
              "render",
              "railway",
              "fly-io",
              "aws",
              "azure",
              "gcp",
              "vps-server",
            ].map((t) => ({ type: "exclude" as const, target: t })),
          }),
        ],
      };
      const java = {
        style: "peer-to-peer",
        skills: { java: "strong" as const },
        answers: { "app-kind": "api-only" as const },
      };
      const r = host(java, k);
      expect(r.stack.picks.hosting).toBe("vercel");
      expect(r.stack.picks.language).toBe("java");
      expect(r.stack.relationNotes).toContainEqual(expect.objectContaining({ id: "C-vercel-container", points: -5 }));
      const mature = host({ ...java, weights: { maturity: "high" } }, k);
      expect(mature.stack.relationNotes).toContainEqual(
        expect.objectContaining({ id: "C-vercel-container", points: -10 }),
      );
      const ga: KnowledgeBase = {
        ...k,
        options: k.options.map((o) =>
          o.id === "vercel"
            ? { ...o, facts: o.facts.map((f) => (f.id === "container-runtime" ? { ...f, status: "ga" as const } : f)) }
            : o,
        ),
      };
      expect(host(java, ga).stack.relationNotes.map((n) => n.id)).not.toContain("C-vercel-container");
      expect(host(java, ga).stack.score).toBeGreaterThan(r.stack.score);
    });

    it("K10: SQLite never shares a stack with a function platform; on a single server it gets a note", () => {
      const r = host({ answers: { "data-flags": ["single-user"], budget: "free-only" } });
      if (r.stack.picks.database === "sqlite")
        expect(["netlify", "vercel", "cloudflare", "render"]).not.toContain(r.stack.picks.hosting);
      const paid = host({ answers: { "data-flags": ["single-user"], "hosting-rule": "aws" } });
      expect(paid.stack.picks.database).toBe("sqlite");
      expect(paid.stack.relationNotes.map((n) => n.id)).toContain("C-sqlite-single-server");
    });

    it("a conflict that moves a pick is named as the reason", () => {
      const r = host({ skills: { java: "strong" }, answers: { "app-kind": "api-only" } });
      for (const a of r.stack.adjusted) expect(a.relation).not.toBe("");
      expect(["netlify", "cloudflare"]).not.toContain(r.stack.picks.hosting);
    });
  });

  it("frontend: an API or a mobile backend has no web frontend (S2)", () => {
    for (const kind of ["api-only", "mobile-backend"]) {
      const r = score({ answers: { "app-kind": kind } }, kb);
      expect(r.parts.frontend!.needed).toBe(false);
      expect(r.parts.frontend!.notNeededBy).toBe("S2");
    }
  });

  it("frontend: seo, interactivity and cost score approaches only, never products", () => {
    const r = score({ weights: { seo: "critical", interactivity: "critical", cost: "critical" } }, kb);
    const plain = score({}, kb);
    for (const p of r.parts.frontend!.products)
      expect(p.base).toBeCloseTo(plain.parts.frontend!.products.find((x) => x.id === p.id)!.base);
    expect(r.parts.frontend!.types[0]!.base).not.toBeCloseTo(plain.parts.frontend!.types[0]!.base);
  });

  it("a requirement on a part that isn't in the stack fails (pages from the backend need a backend)", () => {
    const k: KnowledgeBase = {
      ...kb,
      rules: [
        ...kb.rules.filter((r) => r.id !== "S12"), // S12 would already remove this approach
        rule({
          id: "K93",
          when: { eq: ["style", "peer-to-peer"] },
          effects: [{ type: "not-needed", part: "backend" }],
        }),
        rule({
          id: "K94",
          when: { eq: ["style", "peer-to-peer"] },
          effects: ["static", "spa", "ssr"].map((t) => ({ type: "exclude" as const, target: t })),
        }),
      ],
    };
    const r = score({ style: "peer-to-peer" }, k);
    expect(r.parts.frontend!.products.map((p) => p.id)).toEqual(["backend-templates"]);
    expect(r.stack.conflict).toMatch(/No combination/);
  });

  it("frontend-server needs a meta-framework with a server; content sites lose hydrating frameworks (S16)", () => {
    const g5 = score(
      {
        answers: { "app-kind": "web-app", deadline: "very-tight", "team-size": "2-5", "data-shape": "linked" },
        skills: { "typescript-node": "some" },
      },
      kb,
    );
    expect(g5.stack.picks.backend).toBe("frontend-server");
    expect(["nextjs", "nuxt", "sveltekit", "astro"]).toContain(g5.stack.picks.frontend);
    const site = score({ answers: { "app-kind": "portfolio", "data-shape": "none" } }, kb);
    const app = score({ answers: { "app-kind": "web-app", "data-shape": "none" } }, kb);
    const rulesOf = (r: typeof site, id: string) => r.parts.frontend!.products.find((p) => p.id === id)!.rules;
    expect(rulesOf(site, "nextjs")).toBe(-10);
    expect(rulesOf(app, "nextjs")).toBe(0);
  });

  it("assembles a stack that satisfies every requires relation and says which picks moved", () => {
    const r = score({ skills: { "typescript-node": "strong" } }, kb);
    const backend = r.stack.picks.backend!;
    const runsOn = kb.compatibility.find((c) => c.option === backend)!.anyOf;
    expect(runsOn).toContain(r.stack.picks.language);
    for (const a of r.stack.adjusted) expect(r.parts[a.partId]!.products[0]!.id).toBe(a.best);
  });

  it("settles a tie at the top of a part by the stack rule and reports it as a tie, not an adjusted pick", () => {
    // Neutral input: Java and C# have the same language score (calibration log §13).
    const r = score({ weights: { maturity: "high" } }, kb);
    const [first, second] = r.parts.language!.products;
    expect(first!.final).toBe(second!.final);
    const tie = r.stack.ties.find((t) => t.partId === "language")!;
    expect(tie.options).toEqual(expect.arrayContaining([first!.id, second!.id]));
    expect(tie.options).toContain(r.stack.picks.language);
    expect(tie.reason).toBe("stack score");
    expect(r.stack.adjusted.map((a) => a.partId)).not.toContain("language");
  });

  it("falls back to KB order when tied options also tie on the stack score", () => {
    const k: KnowledgeBase = {
      ...kb,
      options: kb.options.map((o) =>
        o.part === "language" ? { ...o, scores: { ...kb.options.find((x) => x.id === "go")!.scores } } : o,
      ),
      compatibility: kb.compatibility.map((c) => (c.part === "language" ? { ...c, anyOf: ["java", "csharp"] } : c)),
    };
    const r = score({ weights: { maturity: "high" } }, k);
    const tie = r.stack.ties.find((t) => t.partId === "language")!;
    expect(tie.reason).toBe("KB order");
    const order = k.options.map((o) => o.id);
    expect(r.stack.picks.language).toBe(["java", "csharp"].sort((a, b) => order.indexOf(a) - order.indexOf(b))[0]);
  });

  it("shows the best stack with a part's own #1 as a close call when the pick beats it by less than 5 points", () => {
    // G8 input: Go is the language #1, but ASP.NET Core + C# wins the stack (calibration log §13, session 7).
    const input = {
      answers: { "app-kind": "api-only", "data-shape": "linked", traffic: "large", "team-size": "6-15" },
      weights: { performance: "critical" },
      skills: { go: "some" },
    } as const;
    const r = score(input, kb);
    const moved = r.stack.adjusted.find((a) => a.partId === "language")!;
    const close = r.stack.closeCalls.find((c) => c.partId === "language")!;
    expect(close.best).toBe(moved.best);
    expect(close.picks.language).toBe(moved.best);
    expect(close.gap).toBeCloseTo(r.stack.score - close.score, 9);
    expect(close.gap).toBeGreaterThan(0);
    expect(close.gap).toBeLessThan(kb.meta.closeCallPoints);
    const runsOn = kb.compatibility.find((c) => c.option === close.picks.backend)!.anyOf;
    expect(runsOn).toContain(close.picks.language);

    // Same input with the threshold at 1 point: no close call, the pick alone.
    const strict = score(input, { ...kb, meta: { ...kb.meta, closeCallPoints: 1 } });
    expect(strict.stack.closeCalls).toEqual([]);
  });

  it("T7: with goal 'Use what we know', a stack close call keeps a language the team knows; 'learn' shows any", () => {
    // G9 input: Python some; the best stack with ASP.NET Core (the backend #1) needs C#, which nobody knows.
    const input = golden.find((g) => g.id === "G9")!.input;
    const ship = score(input, kb);
    expect(ship.stack.adjusted.map((a) => a.partId)).toContain("backend");
    expect(ship.stack.closeCalls).toEqual([]);

    // Without T7 in the KB the unknown-language close call comes back (how older calibration tables reproduce).
    const withoutT7 = { ...kb, skills: kb.skills.filter((s) => !("knownCloseCalls" in s.when)) };
    expect(score(input, withoutT7).stack.closeCalls.map((c) => c.picks.language)).toContain("csharp");

    // Goal "learn": T7 is off, so a close call with a language nobody knows is shown (G3, TS strong: ASP.NET Core + C#).
    const g3 = golden.find((g) => g.id === "G3")!.input;
    expect(score(g3, kb).stack.closeCalls).toEqual([]);
    const learn = score({ ...g3, goal: "learn" }, kb).stack.closeCalls.map((c) => c.picks.language);
    expect(learn).toContain("csharp");
  });

  it("reports a conflict instead of failing when no combination fits", () => {
    const k: KnowledgeBase = {
      ...kb,
      compatibility: kb.compatibility.map((c) => ({ ...c, anyOf: ["php"] })),
      rules: [
        ...kb.rules,
        rule({ id: "K92", when: { eq: ["style", "peer-to-peer"] }, effects: [{ type: "exclude", target: "php" }] }),
      ],
    };
    const r = score({ style: "peer-to-peer" }, k);
    expect(r.stack.conflict).toMatch(/No combination/);
    expect(Object.keys(r.stack.picks).sort()).toEqual(["backend", "database", "frontend", "hosting", "language"]);
  });

  it("evaluates part paths only after pass 1", () => {
    expect(() => evaluateCondition({ eq: ["part.backend", "needed"] }, { answers: {}, skills: {} })).toThrow(
      /before parts/,
    );
    expect(evaluateCondition({ eq: ["part.backend", "needed"] }, { answers: {}, skills: {}, partState: {} })).toBe(
      true,
    );
  });
});
