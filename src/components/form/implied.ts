import type { KnowledgeBase, Level } from "@/modules/knowledge-base";
import type { ScoreResult, UserInput } from "@/modules/scoring";

const ORDER: Level[] = ["none", "low", "medium", "high", "critical"];

export interface ImpliedLevel {
  level: Level;
  /** Names of the rules that set the floor (KB `rules.json` / `skills.json`). */
  from: string[];
  /** The user picked a lower level themselves (the engine reports an input conflict). */
  overrides: boolean;
}

/**
 * Priorities the engine raised above what the form shows ("Implied: at least High, from 'Money involved'"),
 * read from the result rather than recomputed, so the form can never disagree with the engine.
 */
export function impliedLevels(input: UserInput, result: ScoreResult, kb: KnowledgeBase): Record<string, ImpliedLevel> {
  const out: Record<string, ImpliedLevel> = {};
  for (const c of kb.criteria) {
    const chosen = input.weights?.[c.id] ?? "low";
    const used = result.effectiveWeights[c.id] ?? chosen;
    if (ORDER.indexOf(used) <= ORDER.indexOf(chosen)) continue;
    const from = result.firedRules.flatMap((f) => {
      const rule = kb.rules.find((r) => r.id === f.id);
      const effects = (f.branch === "when" ? rule?.effects : rule?.otherwise) ?? [];
      return effects.some((e) => e.type === "floor" && e.criterion === c.id && e.level === used) ? [rule!.name] : [];
    });
    if (input.goal === "learn")
      for (const s of kb.skills)
        if ("goal" in s.when && s.floor?.criterion === c.id && s.floor.level === used) from.push(s.name);
    out[c.id] = { level: used, from, overrides: input.weights?.[c.id] !== undefined };
  }
  return out;
}
