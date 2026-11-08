import { licenceBadge, type KnowledgeBase } from "@/modules/knowledge-base";
import type { Recommendation } from "@/modules/recommendation";
import type { UserInput } from "@/modules/scoring";
import { FIT_LABELS, criterionName, fmt, LEVEL_LABELS, optionName, partName } from "./format";
import { labelText } from "./labels";
import { thingsToKnow } from "./things";

/** Table cells can't hold a raw "|" or a line break. */
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");

const RANKED = 5;

/**
 * A result as Markdown, for pasting into a design doc, an ADR or a pull request. Pure: the same result and options
 * always give the same text (the date is passed in).
 */
export function resultToMarkdown(
  rec: Recommendation,
  input: UserInput,
  kb: KnowledgeBase,
  meta: { date: string; appVersion: string },
): string {
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);
  const needed = rec.parts.filter((p) => p.needed);
  const notNeeded = rec.parts.filter((p) => !p.needed);

  push(`# Tech stack recommendation: ${needed.map((p) => optionName(p.pick ?? "")).join(" + ")}`, "");
  push(`_Tech Stack Advisor, ${meta.date} · app v${meta.appVersion} · knowledge base v${rec.kbVersion}_`, "");
  push(`**${FIT_LABELS[rec.fit]}, stack score ${fmt(rec.stackScore)} out of 100.**`);

  push("", "## The stack", "", "| Part | Pick | Approach | Score |", "|---|---|---|---|");
  for (const p of needed) {
    const pick = p.options.find((o) => o.id === p.pick);
    push(
      `| ${partName(p.partId, true)} | ${cell(optionName(p.pick ?? ""))} | ${cell(pick?.type ? optionName(pick.type) : "–")} | ${pick ? fmt(pick.cand) : "–"} |`,
    );
  }

  if (notNeeded.length > 0) {
    push("", "## Not needed", "");
    for (const p of notNeeded) push(`- **${partName(p.partId)}:** ${p.notNeeded?.text ?? ""}`);
  }

  const things = thingsToKnow(rec);
  if (things.length > 0) {
    push("", "## Things to know", "");
    for (const t of things) push(`- **${t.title}.** ${t.body}`);
  }

  for (const p of needed) {
    push("", `## ${partName(p.partId)}`, "");
    if (p.chosenType) {
      const close = p.typeCloseCall ? ` (close call with ${optionName(p.typeCloseCall)})` : "";
      push(`Best approach: **${optionName(p.chosenType)}**${close}.`, "");
    }
    push("| # | Option | Score | With this stack |", "|---|---|---|---|");
    for (const o of p.options.slice(0, RANKED))
      push(`| ${o.rank} | ${cell(optionName(o.id))} | ${fmt(o.cand)} | ${cell(labelText(o.label))} |`);
    if (p.options.length > RANKED) push("", `_${p.options.length - RANKED} more ranked lower._`);

    const pick = p.options.find((o) => o.id === p.pick);
    const option = kb.options.find((o) => o.id === p.pick);
    if (pick && option) {
      push("", `**Why ${optionName(pick.id)}:**`, "");
      for (const w of pick.why.slice(0, 4))
        push(`- ${criterionName(w.criterion)} (${LEVEL_LABELS[w.level]}): ${w.value}/5, +${fmt(w.points)}`);
      for (const a of pick.adjustments) push(`- ${a.points > 0 ? "+" : ""}${fmt(a.points)}: ${a.text}`);
      if (option.licence && !option.licence.notAPackage)
        push(`- Licence: ${option.licence.spdx} (${licenceBadge(option)})`);
      if (option.freeTier) push(`- Free tier: ${option.freeTier.summary} (checked ${option.freeTier.checked})`);
      for (const f of pick.facts) push(`- ${f.text} (checked ${f.checked}${f.stale ? ", due for a re-check" : ""})`);
    }
  }

  push("", "## Your answers", "");
  for (const q of kb.questions) {
    const v = input.answers?.[q.id];
    if (v === undefined || (Array.isArray(v) && v.length === 0)) continue;
    const values = (Array.isArray(v) ? v : [v]).map((x) => q.labels[x] ?? x);
    push(`- ${q.text}${q.text.endsWith("?") ? "" : ":"} ${values.join(", ")}`);
  }
  const skills = Object.entries(input.skills ?? {}).filter(([, l]) => l && l !== "none");
  if (skills.length > 0) push(`- Team skills: ${skills.map(([id, l]) => `${optionName(id)} (${l})`).join(", ")}`);
  if (input.knownFrameworks?.length)
    push(`- Frameworks the team knows: ${input.knownFrameworks.map(optionName).join(", ")}`);
  if (input.goal === "learn") push("- Goal: learn something new");
  const weights = Object.entries(input.weights ?? {});
  if (weights.length > 0)
    push(
      `- Priorities you set: ${weights.map(([c, l]) => `${criterionName(c)}: ${LEVEL_LABELS[l ?? "low"]}`).join(", ")}`,
    );

  push(
    "",
    "---",
    "",
    "_Scores come from a rule engine over a sourced knowledge base; the same answers always give the same result. A starting point for your own judgement, not a substitute for it._",
    "",
  );
  return lines.join("\n");
}
