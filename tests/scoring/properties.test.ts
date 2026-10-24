import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { kb, type KnowledgeBase, type Level } from "@/modules/knowledge-base";
import { score, type UserInput } from "@/modules/scoring";

const LEVELS: Level[] = ["none", "low", "medium", "high", "critical"];

/** Runs every weight combination of the database fit criteria (5^6 = 15,625) on "highly connected" data. */
function connectedSweep(k: KnowledgeBase) {
  const fit = k.parts.find((p) => p.id === "database")!.typeCriteria!;
  let combos = 0;
  let documentWins = 0;
  let worst = { margin: Infinity, weights: {} as Record<string, Level> };
  const idx = Array<number>(fit.length).fill(0);
  for (;;) {
    const weights = Object.fromEntries(fit.map((c, i) => [c, LEVELS[idx[i]!]!]));
    const db = score({ answers: { "data-shape": "connected" }, weights }, k).parts.database!;
    const doc = db.types.find((t) => t.id === "document")!.final;
    const best = Math.max(...db.types.filter((t) => t.id === "relational" || t.id === "graph").map((t) => t.final));
    if (db.chosenType === "document" || db.closeCall === "document") documentWins++;
    if (best - doc < worst.margin) worst = { margin: best - doc, weights };
    combos++;
    let i = 0;
    while (i < idx.length && ++idx[i]! === LEVELS.length) idx[i++] = 0;
    if (i === idx.length) break;
  }
  return { fit, combos, documentWins, worst };
}

const withD3Document = (points: number): KnowledgeBase => ({
  ...kb,
  rules: kb.rules.map((r) =>
    r.id === "D3"
      ? { ...r, effects: r.effects.map((e) => (e.type === "modify" && e.target === "document" ? { ...e, points } : e)) }
      : r,
  ),
});

describe("property 8: highly connected data never picks document (owner, 2026-10-24)", () => {
  it("holds for all 15,625 weight combinations of the database fit criteria", () => {
    const { fit, combos, documentWins, worst } = connectedSweep(kb);
    expect(fit).toHaveLength(6);
    expect(combos).toBe(15_625);
    expect(documentWins).toBe(0); // never #1, never the close-call runner-up
    // Calibration log §5 session 3: smallest margin 2.7 points, at learning-curve + scalability Critical.
    expect(worst.margin).toBeCloseTo(2.73, 2);
    expect(Object.entries(worst.weights).filter(([, l]) => l !== "none")).toEqual([
      ["learning-curve", "critical"],
      ["scalability", "critical"],
      ["schema-flexibility", "low"],
    ]);
  }, 60_000);

  it("needs a document penalty of at least 28 points (why D3 uses −30)", () => {
    const beats = (p: number) => {
      const { worst } = connectedSweep(withD3Document(p));
      return worst.margin < 0;
    };
    expect(beats(-27)).toBe(true);
    expect(beats(-28)).toBe(false);
  }, 120_000);
});

const questionAnswers = fc.record(
  Object.fromEntries(
    kb.questions.map((q) => [q.id, q.kind === "multi" ? fc.subarray(q.options) : fc.constantFrom(...q.options)]),
  ) as Record<string, fc.Arbitrary<string | string[]>>,
  { requiredKeys: [] },
);
const inputArb = fc.record({
  answers: questionAnswers,
  weights: fc.dictionary(fc.constantFrom(...kb.criteria.map((c) => c.id)), fc.constantFrom(...LEVELS)),
  skills: fc.dictionary(
    fc.constantFrom(...kb.options.filter((o) => o.part === "language").map((o) => o.id)),
    fc.constantFrom("none" as const, "some" as const, "strong" as const),
  ),
  style: fc.option(fc.constantFrom("microservices", "layered", "modular-monolith", "event-driven"), { nil: undefined }),
  goal: fc.constantFrom("ship" as const, "learn" as const),
}) as fc.Arbitrary<UserInput>;

describe("engine properties (TESTING_STRATEGY §2)", () => {
  it("is deterministic", () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        expect(score(input, kb)).toEqual(score(input, kb));
      }),
      { numRuns: 300 },
    );
  });

  it("keeps rule and skill buckets and all scores in bounds", () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        for (const p of Object.values(score(input, kb).parts)) {
          for (const t of p.types) {
            expect(Math.abs(t.rules)).toBeLessThanOrEqual(kb.meta.caps.rules);
            expect(t.final).toBeGreaterThanOrEqual(0);
            expect(t.final).toBeLessThanOrEqual(100);
          }
          for (const x of p.products) {
            expect(Math.abs(x.rules)).toBeLessThanOrEqual(kb.meta.caps.rules);
            expect(x.skill).toBeGreaterThanOrEqual(kb.meta.caps.skillsMin);
            expect(x.skill).toBeLessThanOrEqual(kb.meta.caps.skillsMax);
            expect(x.final).toBeGreaterThanOrEqual(0);
            expect(x.final).toBeLessThanOrEqual(100);
            expect(p.excluded).not.toContain(x.id);
          }
          if (!p.needed) expect(p.chosenType).toBeUndefined();
        }
      }),
      { numRuns: 300 },
    );
  });
});
