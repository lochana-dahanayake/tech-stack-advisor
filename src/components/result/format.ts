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

/** Display order of the parts: from the code people write to where it runs. */
export const PART_ORDER = ["language", "frontend", "backend", "database", "hosting"] as const;

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
