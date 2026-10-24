import { describe, expect, it } from "vitest";
import { kb, type KnowledgeBase, type Rule } from "@/modules/knowledge-base";
import { baseScore, evaluateCondition, score, validateInput } from "@/modules/scoring";

const withRules = (rules: Rule[]): KnowledgeBase => ({ ...kb, rules: [...kb.rules, ...rules] });
const rule = (r: Partial<Rule> & Pick<Rule, "id" | "when" | "effects">): Rule => ({
  name: r.id,
  explanation: `${r.id} fired`,
  sources: [{ kind: "design", note: "test", reviewed: true }],
  ...r,
});

describe("conditions", () => {
  const ctx = {
    answers: { "data-flags": ["money"], "app-kind": "web-app" },
    skills: { python: "strong" },
    style: "layered",
  };
  it("supports eq, in, has, all, any, not", () => {
    expect(evaluateCondition({ eq: ["q.app-kind", "web-app"] }, ctx)).toBe(true);
    expect(evaluateCondition({ eq: ["q.deadline", "not-sure"] }, ctx)).toBe(true); // unset = not-sure
    expect(evaluateCondition({ in: ["skill.python", ["some", "strong"]] }, ctx)).toBe(true);
    expect(evaluateCondition({ in: ["q.data-flags", ["money"]] }, ctx)).toBe(false); // `in` needs a single value
    expect(evaluateCondition({ has: ["q.data-flags", "money"] }, ctx)).toBe(true);
    expect(evaluateCondition({ has: ["q.app-kind", "web-app"] }, ctx)).toBe(false); // `has` needs a list
    expect(evaluateCondition({ eq: ["skill.go", "none"] }, ctx)).toBe(true); // unset = none
    expect(evaluateCondition({ eq: ["style", "layered"] }, ctx)).toBe(true);
    expect(evaluateCondition({ all: [{ eq: ["style", "layered"] }, { not: { eq: ["style", "x"] } }] }, ctx)).toBe(true);
    expect(evaluateCondition({ any: [{ eq: ["style", "x"] }, { eq: ["style", "y"] }] }, ctx)).toBe(false);
  });
  it("compares weight levels with gte, only once weights are known", () => {
    expect(() => evaluateCondition({ gte: ["weight.maturity", "high"] }, ctx)).toThrow(/before weights/);
    const w = { ...ctx, weights: { maturity: "high" as const } };
    expect(evaluateCondition({ gte: ["weight.maturity", "high"] }, w)).toBe(true);
    expect(evaluateCondition({ gte: ["weight.maturity", "critical"] }, w)).toBe(false);
  });
});

describe("input validation", () => {
  it.each([
    [{ weights: { nope: "high" as const } }, /unknown criterion/],
    [{ answers: { nope: "x" } }, /unknown question/],
    [{ answers: { "app-kind": "x" } }, /no option/],
    [{ answers: { "app-kind": ["web-app"] } }, /expects single/],
    [{ answers: { "data-flags": "money" } }, /expects multi/],
    [{ skills: { cobol: "strong" as const } }, /unknown language/],
    [{ knownFrameworks: ["relational"] }, /unknown framework/],
  ])("rejects %j", (input, error) => {
    expect(() => validateInput(input, kb)).toThrow(error);
  });
});

describe("score", () => {
  it("uses 50 when every applicable weight is zero", () => {
    const relational = kb.options.find((o) => o.id === "relational")!;
    expect(baseScore(relational, ["learning-curve"], { "learning-curve": 0 })).toBe(50);
    expect(() => baseScore(relational, ["cost"], { cost: 1 })).toThrow(/no score/);
  });

  it("records an input conflict when a floor overrides an explicit lower level", () => {
    const r = score({ answers: { "real-time": "yes" }, weights: { "real-time": "low" } }, kb);
    expect(r.effectiveWeights["real-time"]).toBe("high");
    expect(r.inputConflicts).toEqual([{ criterion: "real-time", chosen: "low", used: "high", ruleId: "S5" }]);
    expect(score({ answers: { "real-time": "yes" } }, kb).inputConflicts).toEqual([]);
  });

  it("applies otherwise branches, notes and exclusions", () => {
    const r = score({ answers: { "data-shape": "documents", "app-kind": "api-only" } }, kb);
    expect(r.firedRules.find((f) => f.id === "D7")?.branch).toBe("otherwise");
    expect(r.notes).toContain("PostgreSQL's JSONB can store documents too.");
    expect(r.parts.backend!.types.map((t) => t.id)).not.toContain("fullstack");
    expect(r.parts.backend!.excluded).toEqual(["fullstack", "frontend-server"]);
  });

  it("excludes a product directly and runs weight-dependent rules after floors", () => {
    const k = withRules([
      rule({
        id: "K90",
        when: { gte: ["weight.maturity", "high"] },
        effects: [{ type: "exclude", target: "express" }],
      }),
    ]);
    const r = score({ answers: { lifespan: "5-plus-years" } }, k); // S8 raises maturity to high first
    expect(r.parts.backend!.excluded).toContain("express");
    expect(r.parts.backend!.products.map((p) => p.id)).not.toContain("express");
    expect(score({}, k).parts.backend!.excluded).not.toContain("express");
  });

  it("adds skill points through the product's language and for known frameworks, within the skill cap", () => {
    const r = score({ skills: { python: "strong" }, knownFrameworks: ["django"] }, kb);
    const django = r.parts.backend!.products.find((p) => p.id === "django")!;
    expect(django.skill).toBe(20);
    const k = { ...kb, skills: kb.skills.map((s) => ({ ...s, productPoints: 40 })) };
    expect(
      score({ skills: { python: "strong" }, knownFrameworks: ["django"] }, k).parts.backend!.products.find(
        (p) => p.id === "django",
      )!.skill,
    ).toBe(25);
  });

  it("charges products outside the chosen type the type gap (cand)", () => {
    const r = score({ answers: { "data-shape": "documents" } }, kb);
    const db = r.parts.database!;
    const top = db.types[0]!.final;
    const pg = db.products.find((p) => p.id === "postgresql")!;
    const relational = db.types.find((t) => t.id === "relational")!.final;
    expect(pg.cand).toBeCloseTo(pg.final - (top - relational));
  });

  it("reports no close call when the runner-up is 5 or more points behind", () => {
    const r = score({ answers: { "data-shape": "documents", "data-flags": ["fields-vary"] } }, kb);
    expect(r.parts.database!.closeCall).toBeUndefined();
  });
});
