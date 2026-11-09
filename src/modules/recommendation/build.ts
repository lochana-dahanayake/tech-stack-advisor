import { conditionPaths, productCriteria, type KnowledgeBase, type Level, type Option } from "@/modules/knowledge-base";
import { evaluateCondition, fitFor, type ScoreResult, type UserInput } from "@/modules/scoring";
import type { Adjustment, FactView, OptionView, PartView, Recommendation, StackLabel, WhyRow } from "./types";

/** Display order of the parts: from the code people write to where it runs. */
export const PART_ORDER = ["language", "frontend", "backend", "database", "hosting"] as const;

const LEVELS: Level[] = ["none", "low", "medium", "high", "critical"];
const SKILL_WORDS: Record<string, string> = { some: "some", strong: "strong" };

/** Days since 1970-01-01 for a YYYY-MM-DD date, without `Date` (the module stays pure). */
export function dayNumber(iso: string): number {
  const [y0, m, d] = iso.split("-").map(Number) as [number, number, number];
  const y = m <= 2 ? y0 - 1 : y0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/**
 * Turns the engine's result into what the result page shows (ARCHITECTURE §2): reasons, labels against the stack,
 * "checked on" dates. Pure: `today` (YYYY-MM-DD) is passed in by the caller, so the same call gives the same output.
 */
export function buildRecommendation(
  input: UserInput,
  result: ScoreResult,
  kb: KnowledgeBase,
  today: string,
  /** The AI's reason per adjusted option (AiBlock.adjustments), shown next to its points. */
  aiReasons: Record<string, string> = {},
): Recommendation {
  const opt = new Map(kb.options.map((o) => [o.id, o]));
  const name = (id: string) => opt.get(id)?.name ?? id;
  const ruleById = new Map(kb.rules.map((r) => [r.id, r]));
  const ctx = { answers: input.answers ?? {}, skills: input.skills ?? {}, style: input.style };
  const relations = kb.compatibility.filter(
    (c) => (c.kind === "requires" || c.kind === "conflicts") && (!c.when || evaluateCondition(c.when, ctx)),
  );
  const picks = result.stack.picks;
  const weightOf = (c: string) => kb.meta.levels[result.effectiveWeights[c] ?? "low"];
  const firedEffects = result.firedRules.flatMap((f) => {
    const rule = ruleById.get(f.id);
    const effects = (f.branch === "when" ? rule?.effects : rule?.otherwise) ?? [];
    return effects.map((effect) => ({ fired: f, effect }));
  });
  const todayN = dayNumber(today);

  const label = (o: Option): StackLabel => {
    if (picks[o.part] === o.id)
      return input.locked?.[o.part] === o.id ? { kind: "in-stack", locked: true } : { kind: "in-stack" };
    for (const r of relations) {
      if (r.option === o.id && r.kind === "requires" && !(picks[r.part] && r.anyOf.includes(picks[r.part]!)))
        return { kind: "needs", part: r.part, ids: r.anyOf };
      if (r.option === o.id && r.kind === "conflicts" && picks[r.part] && r.anyOf.includes(picks[r.part]!))
        return { kind: "clashes", with: picks[r.part]! };
      const other = Object.values(picks).find((p) => p === r.option);
      if (other && r.part === o.part && r.kind === "requires" && !r.anyOf.includes(o.id))
        return { kind: "clashes", with: other };
      if (other && r.part === o.part && r.kind === "conflicts" && r.anyOf.includes(o.id))
        return { kind: "clashes", with: other };
    }
    return { kind: "fits" };
  };

  const why = (o: Option, criteria: string[]): WhyRow[] => {
    const total = criteria.reduce((s, c) => s + weightOf(c), 0);
    if (total === 0) return [];
    return criteria
      .filter((c) => weightOf(c) > 0)
      .map((c) => {
        const value = o.scores[c]!.value;
        return {
          criterion: c,
          level: result.effectiveWeights[c] ?? "low",
          value,
          points: (weightOf(c) * ((value - 1) / 4) * 100) / total,
        };
      })
      .sort((a, b) => b.points - a.points || criteria.indexOf(a.criterion) - criteria.indexOf(b.criterion));
  };

  const skillText = (o: Option): string => {
    const level = (l: string) => input.skills?.[l] ?? "none";
    const bits: string[] = [];
    if (o.part === "language") {
      if (level(o.id) !== "none") bits.push(`your team has ${SKILL_WORDS[level(o.id)]} ${o.name} skills`);
      else bits.push("a tight deadline, and your team doesn't know it yet");
    } else {
      const langs = kb.compatibility
        .filter((c) => c.kind === "requires" && c.option === o.id && c.part === "language")
        .flatMap((c) => c.anyOf)
        .filter((l) => level(l) !== "none");
      for (const l of langs) bits.push(`your team has ${SKILL_WORDS[level(l)]} ${name(l)} skills`);
      if (input.knownFrameworks?.includes(o.id)) bits.push(`your team knows ${o.name}`);
    }
    const text = bits.join(" and ");
    const learn = input.goal === "learn" ? " (halved: you chose to learn something new)" : "";
    return `Team skills: ${text}${learn}`;
  };

  const adjustments = (o: Option, skill: number, ai = 0): Adjustment[] => {
    const out: Adjustment[] = firedEffects.flatMap(({ fired, effect }) =>
      effect.type === "modify" && effect.target === o.id
        ? [{ source: "rule" as const, id: fired.id, text: fired.explanation, points: effect.points }]
        : [],
    );
    if (skill !== 0) out.push({ source: "skill", text: skillText(o), points: skill });
    if (ai !== 0) out.push({ source: "ai", text: aiReasons[o.id] ?? "AI adjustment", points: ai });
    return out;
  };

  const facts = (o: Option): FactView[] =>
    o.facts.map((f) => ({
      id: f.id,
      kind: f.kind,
      text: f.text,
      checked: f.checked,
      stale: todayN - dayNumber(f.checked) > (kb.meta.staleAfterDays[f.kind] ?? Infinity),
    }));

  const excludedReason = (id: string): string => {
    const o = opt.get(id);
    const hit = firedEffects.find(
      ({ effect }) => effect.type === "exclude" && (effect.target === id || o?.types?.includes(effect.target)),
    );
    return hit ? hit.fired.explanation : "Its kind of option was ruled out by your answers.";
  };

  const parts: PartView[] = PART_ORDER.flatMap((partId): PartView[] => {
    const p = result.parts[partId];
    if (!p) return [];
    if (!p.needed) {
      const rule = p.notNeededBy ? ruleById.get(p.notNeededBy) : undefined;
      return [
        {
          partId,
          needed: false,
          notNeeded: rule ? { ruleId: rule.id, text: rule.explanation } : undefined,
          types: [],
          options: [],
          excluded: [],
        },
      ];
    }
    const criteria = productCriteria(kb, partId);
    const options: OptionView[] = p.products.map((r, i) => {
      const o = opt.get(r.id)!;
      return {
        id: r.id,
        rank: i + 1,
        base: r.base,
        rules: r.rules,
        skill: r.skill,
        ...(r.ai !== undefined ? { ai: r.ai } : {}),
        final: r.final,
        cand: r.cand,
        fit: fitFor(r.final),
        label: label(o),
        type: p.types.find((t) => o.types?.includes(t.id))?.id,
        why: why(o, criteria),
        adjustments: adjustments(o, r.skill, r.ai),
        facts: facts(o),
        scoresChecked: criteria.map((c) => o.scores[c]!.checked).sort()[0]!,
      };
    });
    return [
      {
        partId,
        needed: true,
        types: p.types.map((t) => ({ id: t.id, final: t.final, fit: fitFor(t.final) })),
        chosenType: p.chosenType,
        typeCloseCall: p.closeCall,
        pick: picks[partId],
        options,
        excluded: p.excluded.map((id) => ({ id, reason: excludedReason(id) })),
      },
    ];
  });

  const relationText = (id: string) => kb.compatibility.find((c) => c.id === id)?.explanation;
  const adjusted = result.stack.adjusted.map((a) => ({
    ...a,
    reason:
      (a.relation === "locked"
        ? `You chose ${name(a.pick)} as a must-use, so the stack is built around it.`
        : undefined) ??
      relationText(a.relation) ??
      `${name(a.pick)} makes a stronger whole stack than ${name(a.best)}, even though ${name(a.best)} scores higher on its own.`,
  }));

  const raised = result.inputConflicts.map((c) => ({
    criterion: c.criterion,
    chosen: c.chosen,
    used: c.used,
    reason:
      ruleById.get(c.ruleId)?.explanation ??
      kb.skills.find((s) => s.id === c.ruleId)?.name ??
      "One of your answers raised it.",
  }));

  const topCriteria = kb.criteria
    .map((c) => c.id)
    .filter((c) => LEVELS.indexOf(result.effectiveWeights[c] ?? "low") >= LEVELS.indexOf("medium"))
    .sort((a, b) => weightOf(b) - weightOf(a));

  const styleRules = new Set(
    kb.rules.filter((r) => conditionPaths(r.when).some((c) => c.path === "style")).map((r) => r.id),
  );
  const style = input.style
    ? {
        id: input.style,
        name: kb.meta.architectureStyles.styles.find((s) => s.id === input.style)?.name ?? input.style,
        rules: result.firedRules
          .filter((f) => styleRules.has(f.id) && f.branch === "when")
          .map((f) => ({ id: f.id, text: f.explanation })),
      }
    : undefined;

  return {
    kbVersion: result.kbVersion,
    ...(style ? { style } : {}),
    score: result,
    stackScore: result.stack.score,
    fit: fitFor(result.stack.score),
    parts,
    topCriteria,
    adjusted,
    closeCalls: result.stack.closeCalls,
    ties: result.stack.ties,
    raised,
    notes: [...result.notes.map((text) => ({ text })), ...result.stack.relationNotes],
  };
}
