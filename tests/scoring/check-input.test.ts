import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { checkInput } from "@/modules/scoring";

describe("checkInput (SCORING_ENGINE step 1 validation)", () => {
  it("needs an app kind or one priority at High or Critical, otherwise there is nothing to rank on", () => {
    expect(checkInput({}, kb).issues.map((i) => i.code)).toEqual(["nothing-to-rank"]);
    expect(checkInput({ answers: { "app-kind": "not-sure" } }, kb).issues.map((i) => i.code)).toEqual([
      "nothing-to-rank",
    ]);
    expect(checkInput({ weights: { performance: "medium" } }, kb).issues).toHaveLength(1);
    expect(checkInput({ answers: { "app-kind": "web-app" } }, kb).issues).toEqual([]);
    expect(checkInput({ weights: { performance: "high" } }, kb).issues).toEqual([]);
    expect(checkInput({ weights: { cost: "critical" } }, kb).issues).toEqual([]);
  });

  it("warns (but allows) more than 3 Critical priorities", () => {
    const three = { performance: "critical", cost: "critical", maturity: "critical" } as const;
    expect(checkInput({ weights: three }, kb).warnings).toEqual([]);
    const four = { ...three, scalability: "critical" } as const;
    const { issues, warnings } = checkInput({ weights: four }, kb);
    expect(issues).toEqual([]);
    expect(warnings.map((w) => w.code)).toEqual(["too-many-critical"]);
    expect(warnings[0]!.message).toMatch(/4 priorities as Critical/);
  });

  it("a typical answered input passes cleanly", () => {
    expect(checkInput({ answers: { "app-kind": "portfolio", seo: "yes" } }, kb)).toEqual({ issues: [], warnings: [] });
  });
});
