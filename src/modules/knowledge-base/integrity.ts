import type { Condition, Effect, KnowledgeBase, Option, Source } from "./schema";

/** A score of 5 or 1 is a strong claim; it needs a book or ref source (owner rule, 2026-10-24). */
export function isComparativeExtreme(value: number): boolean {
  return value === 1 || value === 5;
}

const hasEvidence = (sources: Source[]) => sources.some((s) => s.kind === "book" || s.kind === "ref");

/** Every source in the KB, with where it is used (for the reference-id and release-gate checks). */
export function listSources(kb: KnowledgeBase): { where: string; source: Source }[] {
  const out: { where: string; source: Source }[] = [];
  for (const o of kb.options) {
    for (const [c, s] of Object.entries(o.scores))
      for (const src of s.sources) out.push({ where: `${o.id}.${c}`, source: src });
    for (const f of o.facts) for (const src of f.sources) out.push({ where: `${o.id}.fact.${f.id}`, source: src });
    for (const src of o.licence?.sources ?? []) out.push({ where: `${o.id}.licence`, source: src });
    for (const src of o.coverageExempt?.sources ?? []) out.push({ where: `${o.id}.coverageExempt`, source: src });
  }
  for (const r of kb.rules) for (const src of r.sources) out.push({ where: `rule ${r.id}`, source: src });
  for (const t of kb.skills) for (const src of t.sources) out.push({ where: `skill ${t.id}`, source: src });
  for (const c of kb.compatibility) for (const src of c.sources) out.push({ where: c.id, source: src });
  return out;
}

function conditionPaths(c: Condition): { path: string; values: string[]; op: string }[] {
  if ("eq" in c) return [{ path: c.eq[0], values: [c.eq[1]], op: "eq" }];
  if ("in" in c) return [{ path: c.in[0], values: c.in[1], op: "in" }];
  if ("has" in c) return [{ path: c.has[0], values: [c.has[1]], op: "has" }];
  if ("gte" in c) return [{ path: c.gte[0], values: [c.gte[1]], op: "gte" }];
  if ("all" in c) return c.all.flatMap(conditionPaths);
  if ("any" in c) return c.any.flatMap(conditionPaths);
  return conditionPaths(c.not);
}

/** Criteria a part's products are scored on: those that apply to the part, minus type-only ones (KB schema §4). */
export function productCriteria(kb: KnowledgeBase, partId: string): string[] {
  return kb.criteria.filter((c) => c.appliesTo.includes(partId) && !c.typeOnlyFor?.includes(partId)).map((c) => c.id);
}

/** Cross-file checks the Zod schema can't express. Returns human-readable problems; empty means valid. */
export function findIntegrityProblems(kb: KnowledgeBase): string[] {
  const p: string[] = [];
  const optionIds = new Set<string>();
  for (const o of kb.options) {
    if (optionIds.has(o.id)) p.push(`duplicate option id ${o.id}`);
    optionIds.add(o.id);
  }
  const parts = new Map(kb.parts.map((x) => [x.id, x]));
  const languageIds = kb.options.filter((o) => o.part === "language").map((o) => o.id);
  const criteria = new Map(kb.criteria.map((c) => [c.id, c]));
  const byId = new Map(kb.options.map((o) => [o.id, o]));
  for (const c of kb.criteria)
    for (const part of c.appliesTo) if (!parts.has(part)) p.push(`criterion ${c.id}: unknown part ${part}`);

  for (const part of kb.parts) {
    const applicable = kb.criteria.filter((c) => c.appliesTo.includes(part.id)).map((c) => c.id);
    for (const c of kb.criteria)
      for (const t of c.typeOnlyFor ?? [])
        if (!c.appliesTo.includes(t)) p.push(`criterion ${c.id}: type-only part ${t} isn't in appliesTo`);
    for (const c of part.typeCriteria ?? [])
      if (!applicable.includes(c)) p.push(`part ${part.id}: type criterion ${c} doesn't apply to the part`);
    const nones = kb.options.filter((o) => o.part === part.id && o.none);
    if (nones.length > 1) p.push(`part ${part.id}: more than one none type`);
  }

  const expectScores = (o: Option, want: string[]) => {
    const have = Object.keys(o.scores).sort();
    const exp = [...want].sort();
    if (have.join() !== exp.join()) p.push(`${o.id}: scores ${have.join(",")} but needs ${exp.join(",")}`);
  };
  for (const o of kb.options) {
    const part = parts.get(o.part);
    if (!part) {
      p.push(`${o.id}: unknown part ${o.part}`);
      continue;
    }
    if (o.level === "type") {
      if (o.types) p.push(`${o.id}: a type can't list types`);
      if (o.none) {
        if (Object.keys(o.scores).length) p.push(`${o.id}: none types have no scores`);
      } else expectScores(o, part.typeCriteria ?? []);
    } else {
      if (o.none) p.push(`${o.id}: only types can be none`);
      const hasTypes = part.levels.includes("type");
      if (hasTypes && !o.types?.length) p.push(`${o.id}: a product needs at least one type`);
      if (!hasTypes && o.types?.length) p.push(`${o.id}: ${o.part} has no type level`);
      for (const t of o.types ?? []) {
        const type = byId.get(t);
        if (!type || type.level !== "type" || type.part !== o.part) p.push(`${o.id}: ${t} is not a type of ${o.part}`);
        else if (type.none) p.push(`${o.id}: none types have no products`);
      }
      if (!o.licence) p.push(`${o.id}: licence missing`);
      expectScores(o, productCriteria(kb, o.part));
    }
    for (const [c, s] of Object.entries(o.scores)) {
      if (!criteria.has(c)) p.push(`${o.id}: unknown criterion ${c}`);
      if (isComparativeExtreme(s.value) && !hasEvidence(s.sources))
        p.push(`${o.id}.${c}: a score of ${s.value} needs a book or ref source (or set it to 3 and mark it unsourced)`);
      if (s.unsourced && hasEvidence(s.sources)) p.push(`${o.id}.${c}: marked unsourced but has a book/ref source`);
    }
    if (o.coverageExempt && o.level !== "type") p.push(`${o.id}: only types can be coverage-exempt`);
  }

  const questions = new Map(kb.questions.map((q) => [q.id, q]));
  const levels = ["none", "low", "medium", "high", "critical"];
  const checkEffect = (r: string, e: Effect) => {
    if ((e.type === "modify" || e.type === "exclude") && !optionIds.has(e.target))
      p.push(`rule ${r}: unknown target ${e.target}`);
    if (e.type === "floor" && !criteria.has(e.criterion)) p.push(`rule ${r}: unknown criterion ${e.criterion}`);
    if (e.type === "not-needed" && !parts.has(e.part)) p.push(`rule ${r}: unknown part ${e.part}`);
  };
  const ruleIds = new Set<string>();
  for (const r of kb.rules) {
    if (ruleIds.has(r.id)) p.push(`duplicate rule id ${r.id}`);
    ruleIds.add(r.id);
    [...r.effects, ...(r.otherwise ?? [])].forEach((e) => checkEffect(r.id, e));
    const paths = conditionPaths(r.when);
    for (const { path, values, op } of paths) {
      const [scope, key = ""] = path.split(".") as [string, string?];
      if (scope === "q") {
        const q = questions.get(key);
        if (!q) p.push(`rule ${r.id}: unknown question ${key}`);
        else {
          for (const v of values) if (!q.options.includes(v)) p.push(`rule ${r.id}: ${key} has no option ${v}`);
          if (op === "has" && q.kind !== "multi") p.push(`rule ${r.id}: 'has' needs a multi-select question`);
          if (op !== "has" && q.kind === "multi") p.push(`rule ${r.id}: use 'has' for multi-select ${key}`);
        }
      } else if (scope === "skill") {
        if (!languageIds.includes(key)) p.push(`rule ${r.id}: unknown language ${key}`);
        for (const v of values)
          if (!["none", "some", "strong"].includes(v)) p.push(`rule ${r.id}: bad skill level ${v}`);
      } else if (scope === "part") {
        if (!parts.has(key)) p.push(`rule ${r.id}: unknown part ${key}`);
        for (const v of values)
          if (!["needed", "not-needed"].includes(v)) p.push(`rule ${r.id}: part state is needed or not-needed`);
        if ([...r.effects, ...(r.otherwise ?? [])].some((e) => e.type === "floor"))
          p.push(`rule ${r.id}: a rule that sets floors can't depend on other parts`);
      } else if (scope === "weight") {
        if (!criteria.has(key)) p.push(`rule ${r.id}: unknown criterion ${key}`);
        for (const v of values) if (!levels.includes(v)) p.push(`rule ${r.id}: bad level ${v}`);
        if ([...r.effects, ...(r.otherwise ?? [])].some((e) => e.type === "floor"))
          p.push(`rule ${r.id}: a rule that sets floors can't depend on weights`);
      } else if (scope !== "style") p.push(`rule ${r.id}: unknown path ${path}`);
      if (op === "gte" && scope !== "weight") p.push(`rule ${r.id}: 'gte' only compares weight levels`);
    }
    if (r.otherwise && !r.otherwiseExplanation) p.push(`rule ${r.id}: otherwise needs an explanation`);
  }
  for (const t of kb.skills) {
    if (t.floor && !criteria.has(t.floor.criterion)) p.push(`skill ${t.id}: unknown criterion ${t.floor.criterion}`);
    if ("deadline" in t.when) {
      const q = questions.get("deadline");
      for (const d of t.when.deadline)
        if (!q?.options.includes(d)) p.push(`skill ${t.id}: deadline has no option ${d}`);
    }
  }
  for (const o of kb.options)
    if (o.part === "hosting" && o.level === "product" && o.freeTier === undefined)
      p.push(`${o.id}: hosting products need freeTier (null when there is none)`);
  for (const c of kb.compatibility) {
    if (!optionIds.has(c.option)) p.push(`${c.id}: unknown option ${c.option}`);
    if (c.kind === "penalty") {
      if (c.points === undefined) p.push(`${c.id}: a penalty needs points`);
      const fact = byId.get(c.option)?.facts.find((f) => f.id === c.fact);
      if (!fact || fact.kind !== "release-status")
        p.push(`${c.id}: a penalty needs a release-status fact on ${c.option}`);
    } else if (c.points !== undefined || c.highMaturityPoints !== undefined || c.fact)
      p.push(`${c.id}: only penalties have points or a fact`);
    if (c.part === "language") {
      for (const l of c.anyOf) if (!languageIds.includes(l)) p.push(`${c.id}: unknown language ${l}`);
    } else for (const x of c.anyOf) if (!optionIds.has(x)) p.push(`${c.id}: unknown option ${x}`);
  }
  return p;
}
