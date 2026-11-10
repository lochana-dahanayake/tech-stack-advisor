import { describe, expect, it } from "vitest";
import { findIntegrityProblems, kb, type KnowledgeBase, type Option, type Rule } from "@/modules/knowledge-base";

const opt = (id: string) => kb.options.find((o) => o.id === id)!;
const withOption = (o: Option): KnowledgeBase => ({ ...kb, options: kb.options.map((x) => (x.id === o.id ? o : x)) });
const addOption = (o: Option): KnowledgeBase => ({ ...kb, options: [...kb.options, o] });
const addRule = (r: Partial<Rule> & Pick<Rule, "id" | "when">): KnowledgeBase => ({
  ...kb,
  rules: [
    ...kb.rules,
    {
      name: "t",
      explanation: "t",
      sources: [{ kind: "design", note: "t", reviewed: true }],
      effects: [{ type: "note", text: "t" }],
      ...r,
    },
  ],
});
const problems = (k: KnowledgeBase) => findIntegrityProblems(k).join("\n");

describe("integrity checks catch broken data", () => {
  it("flags a keep-type effect whose target isn't a type of that part", () => {
    const bad: KnowledgeBase = {
      ...kb,
      rules: kb.rules.map((r) =>
        r.id === "B2"
          ? { ...r, effects: [...r.effects, { type: "keep-type" as const, part: "backend", target: "nestjs" }] }
          : r,
      ),
    };
    expect(problems(bad)).toMatch(/rule B2: keep-type needs a type of part backend/);
    expect(problems(kb)).toBe("");
  });

  it("flags a GK-only 5 or 1 and a mislabelled unsourced score", () => {
    const pg = opt("postgresql");
    const gk = [{ kind: "general" as const, reviewed: false }];
    expect(
      problems(
        withOption({
          ...pg,
          scores: {
            ...pg.scores,
            ecosystem: { ...pg.scores.ecosystem!, value: 5, unsourced: undefined, proposed: undefined, sources: gk },
          },
        }),
      ),
    ).toMatch(/postgresql.ecosystem: a score of 5 needs a book or ref source/);
    expect(
      problems(
        withOption({
          ...pg,
          scores: {
            ...pg.scores,
            ecosystem: {
              ...pg.scores.ecosystem!,
              value: 3,
              unsourced: true,
              proposed: 5,
              sources: [{ kind: "ref", ref: "eol", quality: "P" }],
            },
          },
        }),
      ),
    ).toMatch(/marked unsourced but has a book\/ref source/);
  });

  it("flags missing or extra scores, bad types, licences and duplicates", () => {
    const pg = opt("postgresql");
    const noCost = Object.fromEntries(Object.entries(pg.scores).filter(([c]) => c !== "cost"));
    expect(problems(withOption({ ...pg, scores: noCost }))).toMatch(/postgresql: scores .* but needs/);
    expect(problems(withOption({ ...pg, types: ["minimal"] }))).toMatch(/minimal is not a type of database/);
    expect(problems(withOption({ ...pg, types: ["database-none"] }))).toMatch(/none types have no products/);
    expect(problems(withOption({ ...pg, types: [] }))).toMatch(/needs at least one type/);
    expect(problems(withOption({ ...pg, licence: undefined }))).toMatch(/licence missing/);
    expect(problems(withOption({ ...pg, none: true }))).toMatch(/only types can be none/);
    expect(problems(withOption({ ...pg, coverageExempt: { reason: "x", sources: pg.licence!.sources } }))).toMatch(
      /only types can be coverage-exempt/,
    );
    expect(problems(addOption(pg))).toMatch(/duplicate option id postgresql/);
    expect(problems(addOption({ ...opt("database-none"), id: "database-none-2" }))).toMatch(/more than one none type/);
    expect(problems(addOption({ ...pg, id: "x", part: "nope" }))).toMatch(/unknown part nope/);
    const rel = opt("relational");
    expect(problems(withOption({ ...rel, types: ["graph"] }))).toMatch(/a type can't list types/);
    expect(problems(withOption({ ...opt("database-none"), scores: rel.scores }))).toMatch(/none types have no scores/);
  });

  it("flags rule problems", () => {
    expect(problems(addRule({ id: "N90", when: { eq: ["q.nope", "x"] } }))).toMatch(/unknown question nope/);
    expect(problems(addRule({ id: "N91", when: { eq: ["q.app-kind", "x"] } }))).toMatch(/app-kind has no option x/);
    expect(problems(addRule({ id: "N92", when: { has: ["q.app-kind", "web-app"] } }))).toMatch(
      /'has' needs a multi-select/,
    );
    expect(problems(addRule({ id: "N93", when: { eq: ["q.data-flags", "money"] } }))).toMatch(
      /use 'has' for multi-select/,
    );
    expect(problems(addRule({ id: "N94", when: { eq: ["skill.cobol", "strong"] } }))).toMatch(/unknown language cobol/);
    expect(problems(addRule({ id: "N95", when: { eq: ["skill.go", "expert"] } }))).toMatch(/bad skill level/);
    expect(problems(addRule({ id: "N96", when: { gte: ["weight.nope", "high"] } }))).toMatch(/unknown criterion nope/);
    expect(problems(addRule({ id: "N9S", when: { in: ["style", ["layered", "mud"]] } }))).toMatch(/unknown style mud/);
    expect(problems(addRule({ id: "N97", when: { gte: ["q.app-kind", "high"] } }))).toMatch(
      /'gte' only compares weight levels/,
    );
    expect(
      problems(
        addRule({
          id: "N98",
          when: { gte: ["weight.maturity", "high"] },
          effects: [{ type: "floor", criterion: "cost", level: "high" }],
        }),
      ),
    ).toMatch(/can't depend on weights/);
    expect(problems(addRule({ id: "N99", when: { eq: ["nope.x", "y"] } }))).toMatch(/unknown path/);
    expect(
      problems(
        addRule({
          id: "N89",
          when: { not: { any: [{ eq: ["style", "x"] }] } },
          effects: [{ type: "modify", target: "nope", points: 5 }],
        }),
      ),
    ).toMatch(/unknown target nope/);
    expect(
      problems(
        addRule({
          id: "N88",
          when: { eq: ["style", "x"] },
          effects: [{ type: "floor", criterion: "nope", level: "high" }],
        }),
      ),
    ).toMatch(/unknown criterion nope/);
    expect(
      problems(addRule({ id: "N87", when: { eq: ["style", "x"] }, effects: [{ type: "not-needed", part: "nope" }] })),
    ).toMatch(/unknown part nope/);
    expect(
      problems(addRule({ id: "N86", when: { eq: ["style", "x"] }, otherwise: [{ type: "note", text: "x" }] })),
    ).toMatch(/otherwise needs an explanation/);
    expect(problems(addRule({ id: "D0", when: { eq: ["style", "x"] } }))).toMatch(/duplicate rule id D0/);
  });

  it("flags compatibility and part problems", () => {
    const c = kb.compatibility[0]!;
    expect(problems({ ...kb, compatibility: [{ ...c, option: "nope" }] })).toMatch(/unknown option nope/);
    expect(problems({ ...kb, compatibility: [{ ...c, anyOf: ["cobol"] }] })).toMatch(/unknown language cobol/);
    expect(problems({ ...kb, compatibility: [{ ...c, part: "database", anyOf: ["nope"] }] })).toMatch(
      /unknown option nope/,
    );
    expect(
      problems({
        ...kb,
        parts: kb.parts.map((p) => (p.id === "database" ? { ...p, typeCriteria: ["productivity"] } : p)),
      }),
    ).toMatch(/type criterion productivity doesn't apply/);
    expect(
      problems({ ...kb, criteria: [...kb.criteria, { ...kb.criteria[0]!, id: "x", appliesTo: ["nope"] }] }),
    ).toMatch(/unknown part nope/);
    expect(
      problems({ ...kb, criteria: [...kb.criteria, { ...kb.criteria[0]!, id: "y", typeOnlyFor: ["zzz"] }] }),
    ).toMatch(/type-only part zzz isn't in appliesTo/);
    const vercel = kb.options.find((o) => o.id === "vercel")!;
    expect(problems(withOption({ ...vercel, freeTier: undefined }))).toMatch(/need freeTier/);
    const pen = kb.compatibility.find((c) => c.kind === "penalty")!;
    expect(problems({ ...kb, compatibility: [{ ...pen, points: undefined }] })).toMatch(/penalty needs points/);
    expect(problems({ ...kb, compatibility: [{ ...pen, fact: "nope" }] })).toMatch(/release-status fact/);
    const req = kb.compatibility.find((c) => c.kind === "requires")!;
    expect(problems({ ...kb, compatibility: [{ ...req, points: -5 }] })).toMatch(/only penalties/);
  });
});

describe("integrity: parts, languages and skills", () => {
  it("flags part paths in floor rules, bad part states, typed language products and bad skill data", () => {
    expect(problems(addRule({ id: "N80", when: { eq: ["part.nope", "needed"] } }))).toMatch(/unknown part nope/);
    expect(problems(addRule({ id: "N81", when: { eq: ["part.backend", "maybe"] } }))).toMatch(/needed or not-needed/);
    expect(
      problems(
        addRule({
          id: "N82",
          when: { eq: ["part.backend", "needed"] },
          effects: [{ type: "floor", criterion: "cost", level: "high" }],
        }),
      ),
    ).toMatch(/can't depend on other parts/);
    expect(problems(withOption({ ...opt("go"), types: ["minimal"] }))).toMatch(/language has no type level/);
    const t4 = kb.skills.find((s) => s.id === "T4")!;
    const t5 = kb.skills.find((s) => s.id === "T5")!;
    expect(
      problems({
        ...kb,
        skills: [...kb.skills, { ...t4, id: "T90", when: { ...t4.when, deadline: ["someday"] } as typeof t4.when }],
      }),
    ).toMatch(/deadline has no option someday/);
    expect(
      problems({ ...kb, skills: [...kb.skills, { ...t5, id: "T91", floor: { criterion: "nope", level: "high" } }] }),
    ).toMatch(/unknown criterion nope/);
  });
});

describe("integrity: references (methodology page)", () => {
  it("every cited book or ref has a reference entry of the right kind, and every entry is cited", () => {
    expect(findIntegrityProblems(kb).filter((x) => /reference/.test(x))).toEqual([]);
    const k = structuredClone(kb);
    k.rules[0]!.sources = [{ kind: "ref", ref: "nope", quality: "P" }];
    k.references.push({ id: "lonely", kind: "docs", citation: "Never cited" });
    k.rules[1]!.sources = [{ kind: "book", ref: "so-survey" }];
    const problems = findIntegrityProblems(k).join("\n");
    expect(problems).toMatch(/unknown reference ref:nope/);
    expect(problems).toMatch(/reference lonely is never cited/);
    expect(problems).toMatch(/book:so-survey doesn't match the reference's kind survey/);
  });
});

describe("integrity: question labels (Phase 3 form)", () => {
  const withQuestion = (id: string, change: Partial<KnowledgeBase["questions"][number]>): KnowledgeBase => ({
    ...kb,
    questions: kb.questions.map((q) => (q.id === id ? { ...q, ...change } : q)),
  });

  it("every option of every question has a plain-language label", () => {
    for (const q of kb.questions) expect(Object.keys(q.labels).sort(), q.id).toEqual([...q.options].sort());
  });

  it("flags a missing label, a label for no option, and a hint for no option", () => {
    const appKind = kb.questions.find((q) => q.id === "app-kind")!;
    const rest = Object.fromEntries(Object.entries(appKind.labels).filter(([o]) => o !== "portfolio"));
    expect(problems(withQuestion("app-kind", { labels: rest }))).toMatch(/app-kind: no label for portfolio/);
    expect(problems(withQuestion("app-kind", { labels: { ...appKind.labels, blog: "Blog" } }))).toMatch(
      /app-kind: label for unknown option blog/,
    );
    expect(problems(withQuestion("app-kind", { hints: { blog: "A blog" } }))).toMatch(
      /app-kind: hint for unknown option blog/,
    );
  });
});
