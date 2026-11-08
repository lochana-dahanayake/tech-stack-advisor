import { describe, expect, it } from "vitest";
import { impliedLevels } from "@/components/form/implied";
import { kb } from "@/modules/knowledge-base";
import { score, type UserInput } from "@/modules/scoring";

const implied = (input: UserInput) => impliedLevels(input, score(input, kb), kb);

describe("impliedLevels (form badges read from the engine's floors)", () => {
  it("names the rules that raised a priority", () => {
    const r = implied({ answers: { "data-flags": ["money"], seo: "yes", "app-kind": "portfolio" } });
    expect(r["data-integrity"]).toEqual({ level: "critical", from: ["Money or strict consistency"], overrides: false });
    expect(r.seo).toEqual({
      level: "high",
      from: ["Content site or portfolio", "Search engines must find the pages"],
      overrides: false,
    });
    expect(r.performance).toBeUndefined();
  });

  it("marks a level the user chose lower as overridden, and ignores a higher one", () => {
    expect(implied({ answers: { "real-time": "yes" }, weights: { "real-time": "medium" } })["real-time"]).toEqual({
      level: "high",
      from: ["Live updates needed"],
      overrides: true,
    });
    expect(implied({ answers: { "real-time": "yes" }, weights: { "real-time": "critical" } })["real-time"]).toBe(
      undefined,
    );
  });

  it("includes the learning goal's floor (T5)", () => {
    expect(implied({ answers: { "app-kind": "web-app" }, goal: "learn" })["learning-curve"]).toEqual({
      level: "medium",
      from: ["Goal: learn something new"],
      overrides: false,
    });
  });
});
