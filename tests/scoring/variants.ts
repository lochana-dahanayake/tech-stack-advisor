import type { KnowledgeBase } from "@/modules/knowledge-base";
import type { UserInput } from "@/modules/scoring";
import type { Scenario } from "./golden";

/**
 * KB variants that reproduce earlier calibration runs (KNOWLEDGE_BASE_DRAFT §5 and §10). Each is the current KB
 * with the documented differences undone, so every number in the calibration log comes from a command in the repo.
 */
export const variants: Record<
  string,
  { description: string; apply: (kb: KnowledgeBase) => KnowledgeBase; inputs?: (s: Scenario) => UserInput }
> = {
  current: { description: "The KB as committed", apply: (kb) => kb },
  session13: {
    description:
      "current, with the session-14 owner decision undone (Q32: Java's and C#'s GK-only ecosystem back at 4): the KB of session 13",
    apply: (kb) => setValues(kb, { java: { ecosystem: { value: 4 } }, csharp: { ecosystem: { value: 4 } } }),
  },
  draft: {
    description: "Unsourced scores at their proposed (draft) values: the KB as drafted in PR #5 (session 3)",
    apply: (kb) => withProposedValues(variants.session6!.apply(kb)),
  },
  session2: {
    description: "draft, plus D3 document −10 (not −30) and no D9: the database KB of session 2 (2026-10-23)",
    apply: (kb) => {
      const k = withProposedValues(variants.session6!.apply(kb));
      return {
        ...k,
        rules: k.rules
          .filter((r) => r.id !== "D9")
          .map((r) =>
            r.id === "D3"
              ? {
                  ...r,
                  effects: r.effects.map((e) =>
                    e.type === "modify" && e.target === "document" ? { ...e, points: -10 } : e,
                  ),
                }
              : r,
          ),
      };
    },
  },
  session9: {
    description: "session13 without the hosting part (Part 5, session 10): the KB of session 9",
    apply: (kb) => withoutHosting(variants.session13!.apply(kb)),
  },
  session8: {
    description: "session9 without the frontend part (Part 4, session 9): the KB of session 8",
    apply: (kb) => withoutFrontend(withoutHosting(variants.session13!.apply(kb))),
  },
  session7: {
    description:
      "session8, with the session-8 changes undone (D9 back to 'commercial multi-user app'; no T7, so close calls may use a language nobody knows): the KB of session 7",
    apply: (base) => {
      const kb = withoutFrontend(withoutHosting(variants.session13!.apply(base)));
      return {
        ...kb,
        skills: kb.skills.filter((s) => !("knownCloseCalls" in s.when)),
        rules: kb.rules.map((r) =>
          r.id === "D9"
            ? {
                ...r,
                when: {
                  all: [
                    { eq: ["q.commercial", "yes"] },
                    { in: ["q.app-kind", ["e-commerce", "web-app", "mobile-backend", "api-only"]] },
                    { not: { has: ["q.data-flags", "single-user"] } },
                  ],
                },
              }
            : r,
        ),
      };
    },
  },
  session6: {
    description:
      "session7, with the session-7 primary numbers undone (Gin performance 5, FastAPI performance 3 and community 4, Django performance 2, Fastify community unsourced 3): the KB of session 6",
    apply: (kb) =>
      setValues(variants.session7!.apply(kb), {
        gin: { performance: { value: 5 } },
        fastapi: { performance: { value: 3 }, community: { value: 4 } },
        django: { performance: { value: 2 } },
        fastify: { community: { value: 3, unsourced: true, proposed: 2 } },
      }),
  },
  session4: {
    description:
      "session6, minus the five backend scores sourced in Part 3 (Gin and ASP.NET Core performance; Gin, Spring Boot and ASP.NET Core type-safety held at 3): the KB of session 4",
    apply: (base) => ({
      ...variants.session6!.apply(base),
      options: variants.session6!.apply(base).options.map((o) => {
        const reset = {
          gin: ["performance", "type-safety"],
          "spring-boot": ["type-safety"],
          "aspnet-core": ["performance", "type-safety"],
        }[o.id];
        if (!reset) return o;
        return {
          ...o,
          scores: { ...o.scores, ...Object.fromEntries(reset.map((c) => [c, { ...o.scores[c]!, value: 3 }])) },
        };
      }),
    }),
  },
  "d9-traffic": {
    description:
      "session7, with D9 narrowed as first proposed in Q30: fires on busy traffic (large or spiky) for a multi-user app, whether commercial or not",
    apply: (base) => ({
      ...variants.session7!.apply(base),
      rules: variants.session7!.apply(base).rules.map((r) =>
        r.id === "D9"
          ? {
              ...r,
              when: {
                all: [
                  { in: ["q.traffic", ["large", "spiky"]] },
                  { in: ["q.app-kind", ["e-commerce", "web-app", "mobile-backend", "api-only"]] },
                  { not: { has: ["q.data-flags", "single-user"] } },
                ],
              },
            }
          : r,
      ),
    }),
  },
  "lang-ecosystem-even": {
    description:
      "probe (session 8 audit, not a KB change, on the session-8 KB): every language ecosystem score backed only by GK held at 3, as Python's and TypeScript's already are",
    apply: (base) => {
      const kb = withoutFrontend(withoutHosting(variants.session13!.apply(base)));
      return {
        ...kb,
        options: kb.options.map((o) => {
          const e = o.scores.ecosystem;
          if (o.part !== "language" || !e || e.sources.some((x) => x.kind !== "general")) return o;
          return { ...o, scores: { ...o.scores, ecosystem: { ...e, value: 3 } } };
        }),
      };
    },
  },
  "session2-no-d0": {
    description: "session2 without rule D0: the run that motivated D0 (session 2, finding 3)",
    apply: (kb) => {
      const k = variants.session2!.apply(kb);
      return { ...k, rules: k.rules.filter((r) => r.id !== "D0") };
    },
  },
};

function setValues(
  kb: KnowledgeBase,
  values: Record<string, Record<string, { value: number; unsourced?: true; proposed?: number }>>,
): KnowledgeBase {
  return {
    ...kb,
    options: kb.options.map((o) => {
      const v = values[o.id];
      if (!v) return o;
      return {
        ...o,
        scores: {
          ...o.scores,
          ...Object.fromEntries(Object.entries(v).map(([c, x]) => [c, { ...o.scores[c]!, ...x }])),
        },
      };
    }),
  };
}

function withProposedValues(kb: KnowledgeBase): KnowledgeBase {
  return {
    ...kb,
    options: kb.options.map((o) => ({
      ...o,
      scores: Object.fromEntries(
        Object.entries(o.scores).map(([c, s]) => [c, s.unsourced && s.proposed ? { ...s, value: s.proposed } : s]),
      ),
    })),
  };
}

const FRONTEND_RULES = ["S1", "S2", "S3", "S4", "S10", "S11", "S12", "S13", "S14", "S15", "S16"];

/** The KB before Part 4 (session 9): no frontend part, its criteria, rules, relations or B2's ssr effect. */
export function withoutFrontend(kb: KnowledgeBase): KnowledgeBase {
  const frontendIds = new Set(kb.options.filter((o) => o.part === "frontend").map((o) => o.id));
  return {
    ...kb,
    parts: kb.parts.filter((p) => p.id !== "frontend"),
    criteria: kb.criteria
      .filter((c) => !(c.appliesTo.length === 1 && c.appliesTo[0] === "frontend"))
      .map((c) => ({ ...c, typeOnlyFor: undefined, appliesTo: c.appliesTo.filter((p) => p !== "frontend") })),
    options: kb.options.filter((o) => o.part !== "frontend"),
    rules: kb.rules
      .filter((r) => !FRONTEND_RULES.includes(r.id))
      .map((r) => ({ ...r, effects: r.effects.filter((e) => !("target" in e) || !frontendIds.has(e.target)) })),
    compatibility: kb.compatibility.filter(
      (c) => c.part !== "frontend" && !frontendIds.has(c.option) && !c.anyOf.some((x) => frontendIds.has(x)),
    ),
  };
}

const HOSTING_RULES = [
  "S17",
  "S18",
  "S19",
  "S20",
  "S21",
  "K1",
  "K1b",
  "K1c",
  "K2",
  "K3",
  "K4",
  "K4b",
  "K4c",
  "K5",
  "K6",
  "K7",
  "K8",
  "A2",
];
const HOSTING_RELATIONS = ["C-frontend-server-realtime"];

/** The KB before Part 5 (session 10): no hosting part, its rules (and A1's hosting effects) or relations. */
export function withoutHosting(kb: KnowledgeBase): KnowledgeBase {
  const hostingIds = new Set(kb.options.filter((o) => o.part === "hosting").map((o) => o.id));
  return {
    ...kb,
    parts: kb.parts.filter((p) => p.id !== "hosting"),
    criteria: kb.criteria.map((c) => ({ ...c, appliesTo: c.appliesTo.filter((p) => p !== "hosting") })),
    options: kb.options.filter((o) => o.part !== "hosting"),
    rules: kb.rules
      .filter((r) => !HOSTING_RULES.includes(r.id))
      .map((r) => ({ ...r, effects: r.effects.filter((e) => !("target" in e) || !hostingIds.has(e.target)) })),
    compatibility: kb.compatibility.filter(
      (c) =>
        c.part !== "hosting" &&
        !hostingIds.has(c.option) &&
        !c.anyOf.some((x) => hostingIds.has(x)) &&
        !HOSTING_RELATIONS.includes(c.id),
    ),
  };
}

/** Scenario inputs before session 10: G8 had no `cost` weight (cost became a hosting criterion with Part 5). */
function beforeSession10(s: Scenario): UserInput {
  if (s.id !== "G8") return s.input;
  const weights = { ...s.input.weights };
  delete weights.cost;
  return { ...s.input, weights };
}
for (const [name, v] of Object.entries(variants)) if (name !== "current") v.inputs ??= beforeSession10;
