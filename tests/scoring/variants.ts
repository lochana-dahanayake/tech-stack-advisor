import type { KnowledgeBase } from "@/modules/knowledge-base";

/**
 * KB variants that reproduce earlier calibration runs (KNOWLEDGE_BASE_DRAFT §5 and §10). Each is the current KB
 * with the documented differences undone, so every number in the calibration log comes from a command in the repo.
 */
export const variants: Record<string, { description: string; apply: (kb: KnowledgeBase) => KnowledgeBase }> = {
  current: { description: "The KB as committed", apply: (kb) => kb },
  draft: {
    description: "Unsourced scores at their proposed (draft) values: the KB as drafted in PR #5 (session 3)",
    apply: (kb) => useProposedValues(variants.session6!.apply(kb)),
  },
  session2: {
    description: "draft, plus D3 document −10 (not −30) and no D9: the database KB of session 2 (2026-10-23)",
    apply: (kb) => {
      const k = useProposedValues(variants.session6!.apply(kb));
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
  session6: {
    description:
      "current, with the session-7 primary numbers undone (Gin performance 5, FastAPI performance 3 and community 4, Django performance 2, Fastify community unsourced 3): the KB of session 6",
    apply: (kb) =>
      setValues(kb, {
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
      "current, with D9 narrowed as proposed in Q30 (sqlite.org whentouse): fires on busy traffic (large or spiky) for a multi-user app, whether commercial or not",
    apply: (kb) => ({
      ...kb,
      rules: kb.rules.map((r) =>
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

function useProposedValues(kb: KnowledgeBase): KnowledgeBase {
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
