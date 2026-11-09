import type { Recommendation } from "@/modules/recommendation";
import { criterionName, fmt, LEVEL_LABELS, optionName, PART_ORDER, partName } from "./format";

export interface Thing {
  kind: "conflict" | "lock" | "style" | "close-call" | "adjusted" | "tie" | "raised" | "note" | "bundle";
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
  if (rec.score.stack.conflict)
    out.push({ kind: "conflict", title: "These must-use choices don't fit together", body: rec.score.stack.conflict });
  for (const a of rec.adjusted.filter((x) => x.relation === "locked"))
    out.push({
      kind: "lock",
      title: `${optionName(a.pick)}: your must-use choice`,
      body: `${optionName(a.best)} ranks first for your answers. ${a.reason}`,
    });
  for (const w of rec.score.locks ?? [])
    out.push({
      kind: "lock",
      title:
        w.kind === "not-needed"
          ? `${optionName(w.option)}: kept, although no ${partName(w.partId, true).toLowerCase()} seemed needed`
          : `${optionName(w.option)}: kept, although a rule rules it out`,
      body: `${w.text} You marked it as a must-use, so it stays.`,
    });
  if (rec.style)
    out.push({
      kind: "style",
      title: `Architecture style: ${rec.style.name}`,
      body:
        rec.style.rules.length > 0
          ? `From Architecture Advisor. It nudged a few picks: ${rec.style.rules.map((r) => r.text).join(" ")}`
          : "From Architecture Advisor. No rule reads this style yet, so it doesn't change the ranking.",
    });
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
  for (const a of rec.adjusted.filter((x) => x.relation !== "locked"))
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
  for (const b of rec.bundles) {
    const d = b.differs[0];
    out.push({
      kind: "bundle",
      title: d ? `Close to the well-known ${b.name} stack` : `This is the well-known ${b.name} stack`,
      body: d
        ? `${b.description} Yours has ${d.stack ? optionName(d.stack) : `no ${partName(d.partId, true).toLowerCase()}`} instead of ${optionName(d.bundle)}. Shown for orientation; it doesn't change the ranking.`
        : `${b.description} Shown for orientation; it doesn't change the ranking.`,
    });
  }
  return out;
}
