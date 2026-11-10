import { productCriteria as productCriteriaOf } from "@/modules/knowledge-base/integrity";
import type { Effect, KnowledgeBase, Level, Option, Rule } from "@/modules/knowledge-base";
import { evaluateCondition, maxLevel, usesDerived, type ConditionContext } from "./conditions";
import type {
  FiredRule,
  InputConflict,
  PartResult,
  ProductResult,
  ScoreResult,
  StackResult,
  StackTie,
  LockWarning,
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
  if (input.style !== undefined && !kb.meta.architectureStyles.styles.some((s) => s.id === input.style))
    throw new Error(`unknown architecture style ${input.style}`);
  for (const [part, id] of Object.entries(input.locked ?? {})) {
    if (!kb.parts.some((p) => p.id === part)) throw new Error(`unknown part ${part}`);
    if (!kb.options.some((o) => o.id === id && o.part === part && o.level === "product"))
      throw new Error(`${id} is not a ${part} product`);
  }
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

/** At most this many options may carry an AI adjustment (AI_INTEGRATION §5). */
export const MAX_AI_ADJUSTMENTS = 3;

/**
 * Rejects AI adjustments the engine must never apply, whatever the AI layer let through (defence in depth,
 * AI_INTEGRATION §5): unknown or non-product ids, a delta that isn't a non-zero integer within ±caps.ai, more
 * than MAX_AI_ADJUSTMENTS options. "Only the top 5 of their part" is checked by the AI layer, which knows the
 * unadjusted ranking.
 */
export function validateAiDeltas(deltas: Record<string, number>, kb: KnowledgeBase): void {
  const entries = Object.entries(deltas);
  if (entries.length > MAX_AI_ADJUSTMENTS) throw new Error(`at most ${MAX_AI_ADJUSTMENTS} AI adjustments`);
  for (const [id, d] of entries) {
    if (!kb.options.some((o) => o.id === id && o.level === "product")) throw new Error(`${id} is not a product`);
    if (!Number.isInteger(d) || d === 0 || Math.abs(d) > kb.meta.caps.ai)
      throw new Error(`AI delta for ${id} must be a non-zero integer within ±${kb.meta.caps.ai}`);
  }
}

/**
 * score(input, kb): pure and deterministic (SCORING_ENGINE steps 1–6 for the parts in the KB).
 * `aiDeltas` (option id → points, AI_INTEGRATION §5) are added to those products' final scores before ranking
 * and stack assembly, so the server re-runs the whole assembly after the AI's adjustments; the AI never picks
 * the stack itself. Hard rules still hold: T6 and locks are applied after the deltas.
 */
export function score(input: UserInput, kb: KnowledgeBase, aiDeltas: Record<string, number> = {}): ScoreResult {
  validateInput(input, kb);
  validateAiDeltas(aiDeltas, kb);
  const ctx: ConditionContext = { answers: input.answers ?? {}, skills: input.skills ?? {}, style: input.style };
  const learning = input.goal === "learn" ? kb.skills.find((s) => "goal" in s.when) : undefined;
  const skillOf = (l: string) => input.skills?.[l] ?? "none";
  const protectStrong =
    input.goal !== "learn" &&
    kb.skills.some((s) => "protectStrong" in s.when) &&
    Object.values(input.skills ?? {}).some((x) => x === "strong");
  // T7: close calls keep a known language while the goal is "Use what we know" and the team knows one.
  const knownCloseCalls =
    input.goal !== "learn" &&
    kb.skills.some((s) => "knownCloseCalls" in s.when) &&
    Object.values(input.skills ?? {}).some((x) => x === "some" || x === "strong");
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
  const excluded = new Map<string, string>(); // option → the first rule that excluded it
  const notNeeded = new Map<string, string>();
  const notes: string[] = [];
  const keepType = new Map<string, { type: string; ruleId: string }>(); // part → the first keep-type rule
  for (const { rule, effect } of effects) {
    if (effect.type === "modify") points.set(effect.target, (points.get(effect.target) ?? 0) + effect.points);
    else if (effect.type === "exclude" && !excluded.has(effect.target)) excluded.set(effect.target, rule.id);
    else if (effect.type === "not-needed" && !notNeeded.has(effect.part)) notNeeded.set(effect.part, rule.id);
    else if (effect.type === "note") notes.push(effect.text);
    else if (effect.type === "keep-type" && !keepType.has(effect.part))
      keepType.set(effect.part, { type: effect.target, ruleId: rule.id });
  }
  const cap = kb.meta.caps.rules;
  const rulePoints = (id: string) => clamp(points.get(id) ?? 0, -cap, cap);

  const order = kb.options.map((o) => o.id);
  const parts: Record<string, PartResult> = {};
  const locked = Object.fromEntries(Object.entries(input.locked ?? {}).filter((e): e is [string, string] => !!e[1]));
  const lockWarnings: LockWarning[] = [];
  const warn = (partId: string, kind: LockWarning["kind"], ruleId: string) =>
    lockWarnings.push({
      partId,
      option: locked[partId]!,
      kind,
      ruleId,
      text: kb.rules.find((r) => r.id === ruleId)?.explanation ?? "",
    });
  for (const part of kb.parts) {
    const all = kb.options.filter((o) => o.part === part.id);
    // A locked part is always needed (step 3); the rule that said otherwise becomes a warning.
    const lockedOption = locked[part.id] ? kb.options.find((o) => o.id === locked[part.id]) : undefined;
    if (lockedOption && notNeeded.has(part.id)) warn(part.id, "not-needed", notNeeded.get(part.id)!);
    if (notNeeded.has(part.id) && !lockedOption) {
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
    // A locked product whose every approach was excluded keeps its approaches (with a warning), so it can be ranked.
    const lockedTypes = lockedOption?.types ?? [];
    const revived = lockedTypes.length > 0 && lockedTypes.every((t) => excluded.has(t)) ? lockedTypes : [];
    for (const t of revived) warn(part.id, "excluded", excluded.get(t)!);
    const types: TypeResult[] = all
      .filter((o) => hasTypes && o.level === "type" && !o.none && (!excluded.has(o.id) || revived.includes(o.id)))
      .map((o) => {
        const base = baseScore(o, typeCriteria, w);
        const rules = rulePoints(o.id);
        return { id: o.id, base, rules, final: clamp(base + rules, 0, 100) };
      });
    const rankedTypes = rank(types, (t) => [t.final, t.base], order);
    // Step 4: with a lock, the locked product's best approach is the chosen one (and there's no type close call).
    const chosen = lockedOption ? rankedTypes.find((t) => lockedTypes.includes(t.id)) : rankedTypes[0];
    const second = lockedOption ? undefined : rankedTypes[1];
    const typeFinal = new Map(types.map((t) => [t.id, t.final]));

    const productCriteria = productCriteriaOf(kb, part.id);
    const partExcluded = all
      .filter((o) => excluded.has(o.id) && !revived.includes(o.id) && o !== lockedOption)
      .map((o) => o.id);
    if (lockedOption && excluded.has(lockedOption.id)) warn(part.id, "excluded", excluded.get(lockedOption.id)!);
    const products: ProductResult[] = [];
    for (const o of all.filter((x) => x.level === "product")) {
      const liveTypes = (o.types ?? []).filter((t) => typeFinal.has(t));
      if (o !== lockedOption && (excluded.has(o.id) || (hasTypes && liveTypes.length === 0))) {
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
      const ai = aiDeltas[o.id] ?? 0;
      const final = clamp(base + rules + skill + ai, 0, 100);
      const gap = hasTypes
        ? Math.max(0, (chosen?.final ?? 0) - Math.max(...liveTypes.map((t) => typeFinal.get(t) ?? 0)))
        : 0;
      products.push({
        id: o.id,
        types: o.types ?? [],
        base,
        rules,
        skill,
        ...(ai !== 0 ? { ai } : {}),
        final,
        cand: final - gap,
      });
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
      ...(keepType.has(part.id) ? { keepType: keepType.get(part.id)! } : {}),
    };
  }
  // Relations that hold for this input (their `when`), with K9-style penalties resolved from dated facts.
  const relations: ActiveRelation[] = kb.compatibility
    .filter((c) => !c.when || evaluateCondition(c.when, ctx))
    .flatMap((c) => {
      if (c.kind !== "penalty") return [c];
      const fact = kb.options.find((o) => o.id === c.option)?.facts.find((f) => f.id === c.fact);
      if (fact?.status !== "beta") return [];
      const high = ["high", "critical"].includes(levels.maturity ?? "low");
      return [{ ...c, points: high ? (c.highMaturityPoints ?? c.points) : c.points }];
    });
  return {
    kbVersion: kb.meta.kbVersion,
    effectiveWeights: levels,
    inputConflicts: conflicts,
    firedRules: fired,
    notes,
    parts,
    stack: assemble(
      parts,
      kb,
      protectStrong ? skillOf : undefined,
      knownCloseCalls ? skillOf : undefined,
      relations,
      locked,
    ),
    ...(Object.keys(locked).length > 0 ? { locks: lockWarnings } : {}),
    ...(Object.keys(aiDeltas).length > 0 ? { ai: { ...aiDeltas } } : {}),
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
  const langs = kb.compatibility
    .filter((c) => c.kind === "requires" && c.option === o.id && c.part === "language")
    .flatMap((c) => c.anyOf);
  let total = Math.max(0, ...langs.map((l) => bySkill(l)?.productPoints ?? 0));
  if (input.knownFrameworks?.includes(o.id))
    total += kb.skills.find((s) => "knownFramework" in s.when)?.productPoints ?? 0;
  return total;
}

type ActiveRelation = KnowledgeBase["compatibility"][number];
const CANDIDATES = 5;
const EPS = 1e-9;

/**
 * Step 6: the best combination of the top candidates per needed part that satisfies every `requires` relation.
 * Score = mean candidate score; tie-break: higher sum of final → option ids in KB order. Pair bonuses come later.
 * Tie rule (step 6.6): options level at the top of a part are a tie, not an order; the stack settles it and says how.
 */
export function assemble(
  parts: Record<string, PartResult>,
  kb: KnowledgeBase,
  skillOf?: (id: string) => string, // set when T6 applies: languages nobody knows can't beat a strong one
  closeCallSkillOf?: (id: string) => string, // set when T7 applies: close calls keep a known language
  relations: ActiveRelation[] = kb.compatibility.filter((c) => !c.when && c.kind !== "penalty"),
  locked: Record<string, string> = {}, // part → product the user must use: its only candidate
): StackResult {
  const needed = kb.parts
    .filter((p) => parts[p.id]?.needed && (parts[p.id]?.products.length ?? 0) > 0)
    .map((p) => p.id);
  const lockedIds = Object.values(locked);
  const lockNeeds = new Set(
    relations
      .filter((c) => c.kind === "requires" && c.part === "language" && lockedIds.includes(c.option))
      .flatMap((c) => c.anyOf),
  );
  const lists = needed.map((id) => {
    const all = parts[id]!.products;
    if (locked[id]) return all.filter((p) => p.id === locked[id]);
    // keep-type (e.g. B2 "one project"): pick from that approach while one of its products is still ranked.
    const keep = parts[id]!.keepType?.type;
    if (keep && all.some((p) => p.types.includes(keep)))
      return all.filter((p) => p.types.includes(keep)).slice(0, CANDIDATES);
    // T6: while a strongly known language is still ranked (no rule excluded it), drop languages nobody knows,
    // except one a locked product needs (a lock beats T6: "we must use Django" means Python).
    if (id !== "language" || !skillOf || !all.some((p) => skillOf(p.id) === "strong")) return all.slice(0, CANDIDATES);
    return all.filter((p) => skillOf(p.id) !== "none" || lockNeeds.has(p.id)).slice(0, CANDIDATES);
  });
  const order = kb.options.map((o) => o.id);
  const inStack = (picks: Record<string, string>, c: ActiveRelation) => Object.values(picks).includes(c.option);
  const matches = (picks: Record<string, string>, c: ActiveRelation) =>
    inStack(picks, c) && c.part in picks && c.anyOf.includes(picks[c.part]!);
  // Penalties (K9) are paid by the stack, spread over its parts like any candidate score.
  const penalties = relations.filter((c) => c.kind === "penalty");
  const penalty = (picks: Record<string, string>) =>
    penalties.reduce((s, c) => s + (matches(picks, c) ? (c.points ?? 0) : 0), 0);
  // Known good pairings (worksBestWith, KB schema §6): +1 to +3 each, at most caps.stackPairBonus per stack, spread
  // over the stack's parts like a penalty, so they can only tip near-ties.
  const pairings = relations.filter((c) => c.kind === "worksBestWith");
  const bonus = (picks: Record<string, string>) =>
    Math.min(
      kb.meta.caps.stackPairBonus,
      pairings.reduce((s, c) => s + (matches(picks, c) ? (c.points ?? 0) : 0), 0),
    );
  type Found = { picks: Record<string, string>; score: number; sumFinal: number; key?: number[] };
  const orderIndex = new Map(order.map((id, i) => [id, i]));
  // The KB-order key is built only when a comparison gets that far (rare).
  const keyOf = (f: Found) => (f.key ??= needed.map((id) => orderIndex.get(f.picks[id]!) ?? -1));
  // a beats b: higher stack score → higher sum of final → option ids earlier in KB order, part by part.
  const beats = (a: Found, b: Found) => {
    if (Math.abs(a.score - b.score) > EPS) return a.score > b.score;
    if (Math.abs(a.sumFinal - b.sumFinal) > EPS) return a.sumFinal > b.sumFinal;
    const ka = keyOf(a);
    const kb2 = keyOf(b);
    const i = ka.findIndex((x, j) => x !== kb2[j]);
    return i >= 0 && ka[i]! < kb2[i]!;
  };
  let best: Found | undefined;
  const bestWith = new Map<string, Found>(); // "part:option" → best valid stack containing that option
  // Prune while walking: each hard relation is checked at the depth where both of its parts are picked (or, for a
  // requirement on a part that isn't in the stack, as soon as the option is picked). Same result as checking `ok`
  // on every full combination, much faster with five parts.
  const partOf = new Map(kb.options.map((o) => [o.id, o.part]));
  const checksAt: ActiveRelation[][] = needed.map(() => []);
  for (const c of relations) {
    if (c.kind !== "requires" && c.kind !== "conflicts") continue;
    const oi = needed.indexOf(partOf.get(c.option) ?? "");
    if (oi < 0) continue;
    const ti = needed.indexOf(c.part);
    if (ti < 0 && c.kind === "conflicts") continue;
    checksAt[Math.max(oi, ti)]!.push(c);
  }
  const holds = (c: ActiveRelation, picks: Record<string, string>) => {
    const has = picks[partOf.get(c.option)!] === c.option;
    if (!has) return true;
    const other = picks[c.part];
    return c.kind === "requires" ? other !== undefined && c.anyOf.includes(other) : !c.anyOf.includes(other ?? "");
  };
  const picks: Record<string, string> = {};
  const walk = (i: number, cand: number, fin: number) => {
    if (i === needed.length) {
      // `picks` is reused while walking: it is copied only when this combination wins somewhere.
      const found: Found = {
        picks,
        score: needed.length ? (cand + penalty(picks) + bonus(picks)) / needed.length : 0,
        sumFinal: fin,
      };
      let saved: Found | undefined;
      const keep = () => (saved ??= { picks: { ...picks }, score: found.score, sumFinal: fin });
      if (!best || beats(found, best)) best = keep();
      for (const id of needed) {
        const k = `${id}:${picks[id]}`;
        const prev = bestWith.get(k);
        if (!prev || beats(found, prev)) bestWith.set(k, keep());
      }
      return;
    }
    const part = needed[i]!;
    for (const p of lists[i]!) {
      picks[part] = p.id;
      if (checksAt[i]!.every((c) => holds(c, picks))) walk(i + 1, cand + p.cand, fin + p.final);
    }
    delete picks[part];
  };
  walk(0, 0, 0);
  if (!best) {
    const picks = Object.fromEntries(needed.map((id, i) => [id, lists[i]![0]!.id]));
    const score = needed.reduce((s, id, i) => s + lists[i]![0]!.cand, 0) / needed.length;
    return {
      picks,
      score,
      adjusted: [],
      ties: [],
      closeCalls: [],
      conflict:
        lockConflict(needed, lists, relations, locked, partOf, holds) ??
        "No combination of the top candidates fits together; showing each part's #1.",
      relationNotes: [],
    };
  }
  const result = best;
  // Step 6.6: options with the same cand and final as a part's #1 are tied with it.
  const tiedTop = (id: string) => {
    const [top, ...rest] = parts[id]!.products;
    return [top!, ...rest.filter((p) => Math.abs(p.cand - top!.cand) <= EPS && Math.abs(p.final - top!.final) <= EPS)];
  };
  const ties = needed.flatMap((id) => {
    if (locked[id]) return []; // a locked pick isn't settled by the tie rule
    const tied = tiedTop(id);
    const pick = result.picks[id]!;
    if (tied.length < 2 || !tied.some((p) => p.id === pick)) return [];
    const others = tied.flatMap((p) => (p.id === pick ? [] : (bestWith.get(`${id}:${p.id}`) ?? [])));
    const reason: StackTie["reason"] = others.every((o) => result.score > o.score + EPS)
      ? "stack score"
      : others.every((o) => Math.abs(result.score - o.score) > EPS || result.sumFinal > o.sumFinal + EPS)
        ? "sum of final"
        : "KB order";
    return [{ partId: id, options: tied.map((p) => p.id), pick, reason }];
  });
  const adjusted = needed
    .filter((id) => !tiedTop(id).some((p) => p.id === result.picks[id]))
    .map((id) => {
      const top = parts[id]!.products[0]!.id;
      const relation = relations.find(
        (c) =>
          (c.kind === "requires" &&
            c.option === top &&
            c.part in result.picks &&
            !c.anyOf.includes(result.picks[c.part]!)) ||
          (c.kind === "conflicts" &&
            c.option === top &&
            c.part in result.picks &&
            c.anyOf.includes(result.picks[c.part]!)) ||
          (c.kind === "conflicts" && c.part === id && c.anyOf.includes(top) && inStack(result.picks, c)),
      );
      const reason = locked[id] ? "locked" : (relation?.id ?? "stack score");
      return { partId: id, best: top, pick: result.picks[id]!, relation: reason };
    });
  // Step 6.7: a pick that beat the part's own #1 by less than the close-call threshold shows both stacks.
  // Keeping two parts' #1 can lead to the same stack: it is listed once, under the first part.
  const shown = new Set<string>();
  const closeCalls = adjusted.flatMap((a) => {
    const alt = bestWith.get(`${a.partId}:${a.best}`);
    if (!alt) return [];
    const key = JSON.stringify(alt.picks);
    if (shown.has(key)) return [];
    shown.add(key);
    if (closeCallSkillOf && alt.picks.language && closeCallSkillOf(alt.picks.language) === "none") return [];
    const gap = result.score - alt.score;
    return gap < kb.meta.closeCallPoints
      ? [{ partId: a.partId, best: a.best, picks: alt.picks, score: alt.score, gap }]
      : [];
  });
  const relationNotes = relations
    .filter(
      (c) => (c.kind === "note" || c.kind === "penalty" || c.kind === "worksBestWith") && matches(result.picks, c),
    )
    .map((c) => ({ id: c.id, text: c.explanation, ...(c.kind !== "note" ? { points: c.points } : {}) }));
  return { picks: result.picks, score: result.score, adjusted, ties, closeCalls, relationNotes };
}

/**
 * Step 6.5 with locks: names the relation that leaves a locked pick without a valid partner among the candidates
 * (e.g. Django locked with Java), so the result explains the clash instead of only saying nothing fits.
 */
function lockConflict(
  needed: string[],
  lists: { id: string }[][],
  relations: ActiveRelation[],
  locked: Record<string, string>,
  partOf: Map<string, string>,
  holds: (c: ActiveRelation, picks: Record<string, string>) => boolean,
): string | undefined {
  const lockedIds = new Set(Object.values(locked));
  const blocking = relations.find((c) => {
    if ((c.kind !== "requires" && c.kind !== "conflicts") || !lockedIds.has(c.option)) return false;
    const i = needed.indexOf(c.part);
    const partners = i < 0 ? [undefined] : lists[i]!.map((p) => p.id);
    return partners.every(
      (other) => !holds(c, { [partOf.get(c.option)!]: c.option, ...(other ? { [c.part]: other } : {}) }),
    );
  });
  if (blocking) return `Your “Must use” choices don't work together: ${blocking.explanation}`;
  return Object.keys(locked).length > 0
    ? "Your “Must use” choices leave no combination that works together; showing each part's #1."
    : undefined;
}
