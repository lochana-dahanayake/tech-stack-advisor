import type { KnowledgeBase } from "@/modules/knowledge-base";

/**
 * KB variants that reproduce earlier calibration runs (KNOWLEDGE_BASE_DRAFT §5 and §10). Each is the current KB
 * with the documented differences undone, so every number in the calibration log comes from a command in the repo.
 */
export const variants: Record<string, { description: string; apply: (kb: KnowledgeBase) => KnowledgeBase }> = {
  current: { description: "The KB as committed", apply: (kb) => kb },
  draft: {
    description: "Unsourced scores at their proposed (draft) values: the KB as drafted in PR #5 (session 3)",
    apply: useProposedValues,
  },
  session2: {
    description: "draft, plus D3 document −10 (not −30) and no D9: the database KB of session 2 (2026-10-23)",
    apply: (kb) => {
      const k = useProposedValues(kb);
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
  session4: {
    description:
      "current, minus the five backend scores sourced in Part 3 (Gin and ASP.NET Core performance; Gin, Spring Boot and ASP.NET Core type-safety held at 3): the KB of session 4",
    apply: (kb) => ({
      ...kb,
      options: kb.options.map((o) => {
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
  "session2-no-d0": {
    description: "session2 without rule D0: the run that motivated D0 (session 2, finding 3)",
    apply: (kb) => {
      const k = variants.session2!.apply(kb);
      return { ...k, rules: k.rules.filter((r) => r.id !== "D0") };
    },
  },
};

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
