export type Fit = "strong" | "good" | "possible" | "weak";

/** Fit label for a 0–100 score, same bands as Architecture Advisor (SCORING_ENGINE "Result type"; DESIGN, tune). */
export function fitFor(score: number): Fit {
  if (score >= 75) return "strong";
  if (score >= 60) return "good";
  if (score >= 45) return "possible";
  return "weak";
}
