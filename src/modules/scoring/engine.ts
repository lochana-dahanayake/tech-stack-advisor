import type { Effect, KnowledgeBase, Level, Option, Rule } from "@/modules/knowledge-base";
import { evaluateCondition, maxLevel, usesWeights, type ConditionContext } from "./conditions";
import type { FiredRule, InputConflict, PartResult, ProductResult, ScoreResult, TypeResult, UserInput } from "./types";

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Rejects ids the KB doesn't know, so a typo can't silently change a result. */
export function validateInput(input: UserInput, kb: KnowledgeBase): void {
  const criteria = new Set(kb.criteria.map((c) => c.id));
  for (const c of Object.keys(input.weights ?? {})) if (!criteria.has(c)) throw new Error(`unknown criterion ${c}`);
  for (const [q, v] of Object.entries(input.answers ?? {})) {
    const question = kb.questions.find((x) => x.id === q);
    if (!question) throw new Error(`unknown question ${q}`);
    const values = Array.isArray(v) ? v : [v];
    if (Array.isArray(v) !== (question.kind === "multi")) throw new Error(`question ${q} expects ${question.kind}`);
    for (const x of values) if (!question.options.includes(x)) throw new Error(`question ${q} has no option ${x}`);
  }
  for (const l of Object.keys(input.skills ?? {}))
    if (!kb.meta.languageIds.includes(l)) throw new Error(`unknown language ${l}`);
  for (const f of input.knownFrameworks ?? [])
    if (!kb.options.some((o) => o.id === f && o.level === "product")) throw new Error(`unknown framework ${f}`);
}

/** Weighted average of the given criteria on 0–100 (SCORING_ENGINE steps 4–5). All weights 0 → 50. */
export function baseScore(o: Option, criteria: string[], weights: Record<string, number>): number {
  let sum = 0;
  let total = 0;
  for (const c of criteria) {
    const w = weights[c] ?? 0;
    const entry = o.scores[c];
    if (!entry) throw new Error(`${o.id} has no score for ${c}`);
    sum += w * entry.value;
    total += w;
  }
  return total === 0 ? 50 : ((sum / total - 1) / 4) * 100;
}

function rank<T extends { id: string }>(items: T[], key: (x: T) => number[], order: string[]): T[] {
  return [...items].sort((a, b) => {
    const ka = key(a);
    const kb2 = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb2[i]) return (kb2[i] ?? 0) - (ka[i] ?? 0);
    return order.indexOf(a.id) - order.indexOf(b.id);
  });
}

/**
 * score(input, kb): pure and deterministic. Covers the parts in the KB so far (database, backend);
 * stack assembly (step 6) comes with the language part.
 */
export function score(input: UserInput, kb: KnowledgeBase): ScoreResult {
  validateInput(input, kb);
  const ctx: ConditionContext = { answers: input.answers ?? {}, skills: input.skills ?? {}, style: input.style };
  const fired: FiredRule[] = [];
  const effects: { rule: Rule; effect: Effect }[] = [];
  const apply = (rules: Rule[]) => {
    for (const r of rules) {
      if (evaluateCondition(r.when, ctx)) {
        fired.push({ id: r.id, branch: "when", explanation: r.explanation });
        r.effects.forEach((effect) => effects.push({ rule: r, effect }));
      } else if (r.otherwise) {
        fired.push({ id: r.id, branch: "otherwise", explanation: r.otherwiseExplanation ?? "" });
        r.otherwise.forEach((effect) => effects.push({ rule: r, effect }));
      }
    }
  };

  // Pass 1: rules that don't read weights (they may set floors). Step 2: effective weights.
  apply(kb.rules.filter((r) => !usesWeights(r.when)));
  const levels: Record<string, Level> = {};
  const conflicts: InputConflict[] = [];
  for (const c of kb.criteria) levels[c.id] = input.weights?.[c.id] ?? "low";
  for (const { rule, effect } of effects) {
    if (effect.type !== "floor") continue;
    const before = levels[effect.criterion] ?? "low";
    const after = maxLevel(before, effect.level);
    if (after !== before && input.weights?.[effect.criterion] !== undefined)
      conflicts.push({ criterion: effect.criterion, chosen: before, used: after, ruleId: rule.id });
    levels[effect.criterion] = after;
  }
  // Pass 2: rules that read effective weights (never floors; checked by the KB integrity test).
  ctx.weights = levels;
  apply(kb.rules.filter((r) => usesWeights(r.when)));

  const w: Record<string, number> = {};
  for (const [c, l] of Object.entries(levels)) w[c] = kb.meta.levels[l];
  const points = new Map<string, number>();
  const excluded = new Set<string>();
  const notNeeded = new Map<string, string>();
  const notes: string[] = [];
  for (const { rule, effect } of effects) {
    if (effect.type === "modify") points.set(effect.target, (points.get(effect.target) ?? 0) + effect.points);
    else if (effect.type === "exclude") excluded.add(effect.target);
    else if (effect.type === "not-needed" && !notNeeded.has(effect.part)) notNeeded.set(effect.part, rule.id);
    else if (effect.type === "note") notes.push(effect.text);
  }
  const cap = kb.meta.caps.rules;
  const rulePoints = (id: string) => clamp(points.get(id) ?? 0, -cap, cap);

  const order = kb.options.map((o) => o.id);
  const parts: Record<string, PartResult> = {};
  for (const part of kb.parts) {
    const all = kb.options.filter((o) => o.part === part.id);
    if (notNeeded.has(part.id)) {
      parts[part.id] = {
        partId: part.id,
        needed: false,
        notNeededBy: notNeeded.get(part.id),
        types: [],
        products: [],
        excluded: [],
      };
      continue;
    }
    const typeCriteria = part.typeCriteria ?? [];
    const types: TypeResult[] = all
      .filter((o) => o.level === "type" && !o.none && !excluded.has(o.id))
      .map((o) => {
        const base = baseScore(o, typeCriteria, w);
        const rules = rulePoints(o.id);
        return { id: o.id, base, rules, final: clamp(base + rules, 0, 100) };
      });
    const rankedTypes = rank(types, (t) => [t.final, t.base], order);
    const chosen = rankedTypes[0];
    const second = rankedTypes[1];
    const typeFinal = new Map(types.map((t) => [t.id, t.final]));

    const productCriteria = kb.criteria.filter((c) => c.appliesTo.includes(part.id)).map((c) => c.id);
    const partExcluded = all.filter((o) => excluded.has(o.id)).map((o) => o.id);
    const products: ProductResult[] = [];
    for (const o of all.filter((x) => x.level === "product")) {
      const liveTypes = (o.types ?? []).filter((t) => typeFinal.has(t));
      if (excluded.has(o.id) || liveTypes.length === 0) {
        if (!partExcluded.includes(o.id)) partExcluded.push(o.id);
        continue;
      }
      const base = baseScore(o, productCriteria, w);
      const rules = rulePoints(o.id);
      const skill = clamp(skillPoints(o.id, input, kb), kb.meta.caps.skillsMin, kb.meta.caps.skillsMax);
      const final = clamp(base + rules + skill, 0, 100);
      const bestType = Math.max(...liveTypes.map((t) => typeFinal.get(t) ?? 0));
      const cand = final - Math.max(0, (chosen?.final ?? 0) - bestType);
      products.push({ id: o.id, types: o.types ?? [], base, rules, skill, final, cand });
    }
    parts[part.id] = {
      partId: part.id,
      needed: true,
      types: rankedTypes,
      chosenType: chosen?.id,
      closeCall: chosen && second && chosen.final - second.final < kb.meta.closeCallPoints ? second.id : undefined,
      products: rank(products, (p) => [p.cand, p.final], order),
      excluded: partExcluded,
    };
  }
  return {
    kbVersion: kb.meta.kbVersion,
    effectiveWeights: levels,
    inputConflicts: conflicts,
    firedRules: fired,
    notes,
    parts,
  };
}

/** Team-skill bucket (KB schema §7.4): T1/T2 through the product's language, T3 for a known framework. */
function skillPoints(optionId: string, input: UserInput, kb: KnowledgeBase): number {
  let total = 0;
  const langs = kb.compatibility.filter((c) => c.option === optionId && c.part === "language").flatMap((c) => c.anyOf);
  const bestLevelPoints = Math.max(
    0,
    ...langs.map((l) => {
      const level = input.skills?.[l] ?? "none";
      const rule = kb.skills.find((s) => "skill" in s.when && s.when.skill === level);
      return rule?.productPoints ?? 0;
    }),
  );
  total += bestLevelPoints;
  if (input.knownFrameworks?.includes(optionId))
    total += kb.skills.find((s) => "knownFramework" in s.when)?.productPoints ?? 0;
  return total;
}
