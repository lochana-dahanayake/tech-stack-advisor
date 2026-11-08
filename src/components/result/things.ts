import type { Recommendation } from "@/modules/recommendation";
import { criterionName, fmt, LEVEL_LABELS, optionName, PART_ORDER, partName } from "./format";

export interface Thing {
  kind: "close-call" | "adjusted" | "tie" | "raised" | "note";
  title: string;
  body: string;
}

const TIE_REASONS = {
  "stack score": "the stack it makes",
  "sum of final": "the stack's total score",
  "KB order": "the knowledge base's order",
} as const;

/** "Things to know" in plain words, shared by the result page and the Markdown export. */
export function thingsToKnow(rec: Recommendation): Thing[] {
  const out: Thing[] = [];
  for (const cc of rec.closeCalls) {
    const alt = PART_ORDER.filter((p) => cc.picks[p] && cc.picks[p] !== rec.score.stack.picks[p]).map((p) =>
      optionName(cc.picks[p]!),
    );
    const points = Math.round(cc.gap) === 1 ? "point" : "points";
    out.push({
      kind: "close-call",
      title: `Close call: ${alt.join(" + ")}`,
      body: `A stack with ${alt.join(" and ")} scores ${fmt(cc.score)}, only ${fmt(cc.gap)} ${points} behind. ${optionName(cc.best)} is the best ${partName(cc.partId, true).toLowerCase()} on its own, so it's worth a look.`,
    });
  }
  for (const a of rec.adjusted)
    out.push({
      kind: "adjusted",
      title: `${optionName(a.pick)} instead of ${optionName(a.best)} (${partName(a.partId, true).toLowerCase()})`,
      body: `${optionName(a.best)} ranks first on its own, but the stack needs ${optionName(a.pick)}: ${a.reason}`,
    });
  for (const t of rec.ties)
    out.push({
      kind: "tie",
      title: `A tie: ${t.options.map(optionName).join(" and ")}`,
      body: `They score the same. ${optionName(t.pick)} is picked by ${TIE_REASONS[t.reason]}.`,
    });
  for (const r of rec.raised)
    out.push({
      kind: "raised",
      title: `${criterionName(r.criterion)} counted as ${LEVEL_LABELS[r.used]}, not ${LEVEL_LABELS[r.chosen]}`,
      body: r.reason,
    });
  for (const n of rec.notes)
    out.push({ kind: "note", title: n.points ? `Note (${n.points} points)` : "Note", body: n.text });
  return out;
}
