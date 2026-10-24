import type { Effect, KnowledgeBase, Level, Option, Rule } from "@/modules/knowledge-base";
import { evaluateCondition, maxLevel, usesDerived, type ConditionContext } from "./conditions";
import type {
  FiredRule,
  InputConflict,
  PartResult,
  ProductResult,
  ScoreResult,
  StackResult,
  TypeResult,
  UserInput,
} from "./types";

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const languageIds = (kb: KnowledgeBase) => kb.options.filter((o) => o.part === "language").map((o) => o.id);

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
  const langs = languageIds(kb);
  for (const l of Object.keys(input.skills ?? {})) if (!langs.includes(l)) throw new Error(`unknown language ${l}`);
  for (const f of input.knownFrameworks ?? [])
    if (!kb.options.some((o) => o.id === f && o.level === "product" && o.part !== "language"))
      throw new Error(`unknown framework ${f}`);
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

/** score(input, kb): pure and deterministic (SCORING_ENGINE steps 1–6 for the parts in the KB). */
export function score(input: UserInput, kb: KnowledgeBase): ScoreResult {
  validateInput(input, kb);
  const ctx: ConditionContext = { answers: input.answers ?? {}, skills: input.skills ?? {}, style: input.style };
  const learning = input.goal === "learn" ? kb.skills.find((s) => "goal" in s.when) : undefined;
  const skillOf = (l: string) => input.skills?.[l] ?? "none";
  const protectStrong =
    input.goal !== "learn" &&
    kb.skills.some((s) => "protectStrong" in s.when) &&
    Object.values(input.skills ?? {}).some((x) => x === "strong");
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

  // Pass 1: rules that read only the input (they may set floors). Step 2: effective weights.
  apply(kb.rules.filter((r) => !usesDerived(r.when)));
  const levels: Record<string, Level> = {};
  const conflicts: InputConflict[] = [];
  for (const c of kb.criteria) levels[c.id] = input.weights?.[c.id] ?? "low";
  const floors: { id: string; criterion: string; level: Level }[] = effects.flatMap(({ rule, effect }) =>
    effect.type === "floor" ? [{ id: rule.id, criterion: effect.criterion, level: effect.level }] : [],
  );
  if (learning?.floor) floors.push({ id: learning.id, ...learning.floor });
  for (const f of floors) {
    const before = levels[f.criterion] ?? "low";
    const after = maxLevel(before, f.level);
    if (after !== before && input.weights?.[f.criterion] !== undefined)
      conflicts.push({ criterion: f.criterion, chosen: before, used: after, ruleId: f.id });
    levels[f.criterion] = after;
  }
  // Pass 2: rules that read effective weights or which parts are needed (never floors; checked by the KB tests).
  ctx.weights = levels;
  const partState = (): Record<string, "needed" | "not-needed"> =>
    Object.fromEntries(
      kb.parts.map((p) => [
        p.id,
        effects.some(({ effect }) => effect.type === "not-needed" && effect.part === p.id) ? "not-needed" : "needed",
      ]),
    );
  ctx.partState = partState();
  apply(kb.rules.filter((r) => usesDerived(r.when)));

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
    const hasTypes = part.levels.includes("type");
    const typeCriteria = part.typeCriteria ?? [];
    const types: TypeResult[] = all
      .filter((o) => hasTypes && o.level === "type" && !o.none && !excluded.has(o.id))
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
      if (excluded.has(o.id) || (hasTypes && liveTypes.length === 0)) {
        if (!partExcluded.includes(o.id)) partExcluded.push(o.id);
        continue;
      }
      const base = baseScore(o, productCriteria, w);
      const rules = rulePoints(o.id);
      const skill = clamp(
        skillPoints(o, input, kb) * (learning?.factor ?? 1),
        kb.meta.caps.skillsMin,
        kb.meta.caps.skillsMax,
      );
      const final = clamp(base + rules + skill, 0, 100);
      const gap = hasTypes
        ? Math.max(0, (chosen?.final ?? 0) - Math.max(...liveTypes.map((t) => typeFinal.get(t) ?? 0)))
        : 0;
      products.push({ id: o.id, types: o.types ?? [], base, rules, skill, final, cand: final - gap });
    }
    parts[part.id] = {
      partId: part.id,
      needed: true,
      types: rankedTypes,
      chosenType: chosen?.id,
      closeCall: chosen && second && chosen.final - second.final < kb.meta.closeCallPoints ? second.id : undefined,
      products:
        part.id === "language" && protectStrong
          ? strongBeforeUnknown(
              rank(products, (p) => [p.cand, p.final], order),
              skillOf,
            )
          : rank(products, (p) => [p.cand, p.final], order),
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
    stack: assemble(parts, kb, protectStrong ? skillOf : undefined),
  };
}

/**
 * T6 (owner, 2026-10-24): a language the team knows at "strong" never ranks below one nobody knows. Only that pair
 * order changes; "some" languages keep their place by points.
 */
function strongBeforeUnknown<T extends { id: string }>(ranked: T[], skillOf: (id: string) => string): T[] {
  const list = [...ranked];
  for (let moved = true; moved;) {
    moved = false;
    const firstUnknown = list.findIndex((x) => skillOf(x.id) === "none");
    const strongAfter = list.findIndex((x, i) => i > firstUnknown && skillOf(x.id) === "strong");
    if (firstUnknown >= 0 && strongAfter > firstUnknown) {
      const [strong] = list.splice(strongAfter, 1);
      list.splice(firstUnknown, 0, strong!);
      moved = true;
    }
  }
  return list;
}

/** Team-skill bucket (KB schema §7.4), before the T5 factor. */
function skillPoints(o: Option, input: UserInput, kb: KnowledgeBase): number {
  const level = (l: string) => input.skills?.[l] ?? "none";
  const bySkill = (l: string) => kb.skills.find((s) => "skill" in s.when && s.when.skill === level(l));
  if (o.part === "language") {
    let total = bySkill(o.id)?.languagePoints ?? 0;
    const t4 = kb.skills.find((s) => "deadline" in s.when);
    const deadline = input.answers?.deadline;
    const knowsOne = Object.values(input.skills ?? {}).some((x) => x === "some" || x === "strong");
    if (
      t4 &&
      "deadline" in t4.when &&
      typeof deadline === "string" &&
      t4.when.deadline.includes(deadline) &&
      level(o.id) === "none" &&
      knowsOne
    )
      total += t4.languagePoints;
    return total;
  }
  const langs = kb.compatibility.filter((c) => c.option === o.id && c.part === "language").flatMap((c) => c.anyOf);
  let total = Math.max(0, ...langs.map((l) => bySkill(l)?.productPoints ?? 0));
  if (input.knownFrameworks?.includes(o.id))
    total += kb.skills.find((s) => "knownFramework" in s.when)?.productPoints ?? 0;
  return total;
}

const CANDIDATES = 5;

/**
 * Step 6: the best combination of the top candidates per needed part that satisfies every `requires` relation.
 * Score = mean candidate score; tie-break: higher sum of final → option ids in KB order. Pair bonuses come later.
 */
export function assemble(
  parts: Record<string, PartResult>,
  kb: KnowledgeBase,
  skillOf?: (id: string) => string, // set when T6 applies: languages nobody knows can't beat a strong one
): StackResult {
  const needed = kb.parts
    .filter((p) => parts[p.id]?.needed && (parts[p.id]?.products.length ?? 0) > 0)
    .map((p) => p.id);
  const lists = needed.map((id) => {
    const all = parts[id]!.products;
    // T6: while a strongly known language is still ranked (no rule excluded it), drop languages nobody knows.
    if (id !== "language" || !skillOf || !all.some((p) => skillOf(p.id) === "strong")) return all.slice(0, CANDIDATES);
    return all.filter((p) => skillOf(p.id) !== "none").slice(0, CANDIDATES);
  });
  const order = kb.options.map((o) => o.id);
  const ok = (picks: Record<string, string>) =>
    kb.compatibility.every((c) => {
      if (!Object.values(picks).includes(c.option) || !(c.part in picks)) return true;
      return c.anyOf.includes(picks[c.part]!);
    });
  let best: { picks: Record<string, string>; score: number; sumFinal: number; key: number[] } | undefined;
  const walk = (i: number, picks: Record<string, string>, cand: number, fin: number) => {
    if (i === needed.length) {
      if (!ok(picks)) return;
      const score = needed.length ? cand / needed.length : 0;
      const key = needed.map((id) => order.indexOf(picks[id]!));
      const better =
        !best ||
        score > best.score + 1e-9 ||
        (Math.abs(score - best.score) <= 1e-9 &&
          (fin > best.sumFinal + 1e-9 || (Math.abs(fin - best.sumFinal) <= 1e-9 && key.join() < best.key.join())));
      if (better) best = { picks: { ...picks }, score, sumFinal: fin, key };
      return;
    }
    for (const p of lists[i]!) walk(i + 1, { ...picks, [needed[i]!]: p.id }, cand + p.cand, fin + p.final);
  };
  walk(0, {}, 0, 0);
  if (!best) {
    const picks = Object.fromEntries(needed.map((id, i) => [id, lists[i]![0]!.id]));
    const score = needed.reduce((s, id, i) => s + lists[i]![0]!.cand, 0) / needed.length;
    return {
      picks,
      score,
      adjusted: [],
      conflict: "No combination of the top candidates fits together; showing each part's #1.",
    };
  }
  const result = best;
  const adjusted = needed
    .filter((id) => parts[id]!.products[0]!.id !== result.picks[id])
    .map((id) => {
      const top = parts[id]!.products[0]!.id;
      const relation = kb.compatibility.find(
        (c) => c.option === top && c.part in result.picks && !c.anyOf.includes(result.picks[c.part]!),
      );
      return { partId: id, best: top, pick: result.picks[id]!, relation: relation?.id ?? "stack score" };
    });
  return { picks: result.picks, score: result.score, adjusted };
}
