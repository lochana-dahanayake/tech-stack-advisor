import { describe, expect, it } from "vitest";
import { fitFor } from "@/modules/scoring";

describe("fitFor (SCORING_ENGINE, Result type: ≥ 75 strong · 60–74.9 good · 45–59.9 possible · < 45 weak)", () => {
  it.each([
    [100, "strong"],
    [75, "strong"],
    [74.99, "good"],
    [60, "good"],
    [59.99, "possible"],
    [45, "possible"],
    [44.99, "weak"],
    [0, "weak"],
  ] as const)("%d → %s", (score, fit) => {
    expect(fitFor(score)).toBe(fit);
  });
});
