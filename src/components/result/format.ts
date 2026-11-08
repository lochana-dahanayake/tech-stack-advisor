import type { Fit } from "@/modules/scoring";
import { kb } from "@/modules/knowledge-base";

/** Scores are kept exact in the engine and rounded only for display. */
export function fmt(n: number): string {
  return String(Math.round(n));
}

export const FIT_LABELS: Record<Fit, string> = {
  strong: "Strong fit",
  good: "Good fit",
  possible: "Possible fit",
  weak: "Weak fit",
};

export { PART_ORDER } from "@/modules/recommendation";

const optionNames = new Map(kb.options.map((o) => [o.id, o.name]));
const partNames = new Map(kb.parts.map((p) => [p.id, p.name]));

export function optionName(id: string): string {
  return optionNames.get(id) ?? id;
}

/** "Programming language" is shortened to "Language" where space is tight. */
export function partName(id: string, short = false): string {
  if (short && id === "language") return "Language";
  return partNames.get(id) ?? id;
}

export const LEVEL_LABELS: Record<string, string> = {
  none: "Not needed",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const criterionNames = new Map(kb.criteria.map((c) => [c.id, c.name]));
export const criterionName = (id: string) => criterionNames.get(id) ?? id;

/** "+5" / "−3" with a real minus sign. */
export function signed(n: number): string {
  const r = Math.round(n);
  return r > 0 ? `+${r}` : r < 0 ? `−${-r}` : "0";
}

/** "Next.js, Nuxt or SvelteKit" */
export function orList(ids: string[]): string {
  const names = ids.map(optionName);
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} or ${names.at(-1)}`;
}
