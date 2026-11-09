import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { buildRecommendation } from "@/modules/recommendation";
import { score, validateAiDeltas } from "@/modules/scoring";
import { golden } from "./golden";

const input = (id: string) => golden.find((g) => g.id === id)!.input;
const product = (r: ReturnType<typeof score>, part: string, id: string) =>
  r.parts[part]!.products.find((p) => p.id === id)!;

describe("AI adjustments in the engine (AI_INTEGRATION §5, SCORING_ENGINE step 5)", () => {
  it("no deltas: the result is exactly the rules-only result", () => {
    for (const g of golden) expect(score(g.input, kb, {})).toEqual(score(g.input, kb));
  });

  it("adds the delta to the product's final and cand, records it, and leaves other products alone", () => {
    const before = score(input("G3"), kb);
    const after = score(input("G3"), kb, { mysql: -3 });
    const b = product(before, "database", "mysql");
    const a = product(after, "database", "mysql");
    expect(a.ai).toBe(-3);
    expect(a.final).toBeCloseTo(b.final - 3);
    expect(a.cand).toBeCloseTo(b.cand - 3);
    expect(product(after, "database", "postgresql")).toEqual(product(before, "database", "postgresql"));
    expect(after.ai).toEqual({ mysql: -3 });
    expect(before.ai).toBeUndefined();
  });

  it("re-runs ranking and stack assembly: lifting a close #2 changes the stack the engine picks", () => {
    const rules = score(input("G3"), kb);
    const changed = kb.parts.some((part) => {
      const [first, second] = rules.parts[part.id]?.products ?? [];
      if (!first || !second || first.cand - second.cand >= 5) return false;
      const after = score(input("G3"), kb, { [second.id]: 5 });
      return after.stack.picks[part.id] === second.id;
    });
    expect(changed).toBe(true);
  });

  it("hard rules still hold: a lock stays, and T6 keeps a strong language over one nobody knows", () => {
    const locked = { ...input("G3"), locked: { database: "mysql" } };
    expect(score(locked, kb, { postgresql: 5 }).stack.picks.database).toBe("mysql");
    const g2 = input("G2"); // Java strong
    const r = score(g2, kb, { csharp: 5, java: -5 });
    const langs = r.parts.language!.products.map((p) => p.id);
    expect(langs.indexOf("java")).toBeLessThan(langs.indexOf("csharp"));
  });

  it("final stays within 0–100", () => {
    const r = score(input("G2"), kb, { java: 5 });
    expect(product(r, "language", "java").final).toBeLessThanOrEqual(100);
  });

  it.each([
    [{ "not-real": 1 }, /not a product/],
    [{ relational: 1 }, /not a product/],
    [{ mysql: 0 }, /non-zero integer/],
    [{ mysql: 6 }, /non-zero integer/],
    [{ mysql: 1.5 }, /non-zero integer/],
    [{ mysql: 1, postgresql: 1, sqlite: 1, mongodb: 1 }, /at most 3/],
  ])("rejects %j", (deltas, message) => {
    expect(() => validateAiDeltas(deltas, kb)).toThrow(message);
    expect(() => score(input("G3"), kb, deltas)).toThrow(message);
  });

  it("the result page shows the AI's points with its reason", () => {
    const r = score(input("G3"), kb, { mysql: -3 });
    const view = buildRecommendation(input("G3"), r, kb, "2026-11-09", { mysql: "The notes say so." });
    const mysql = view.parts.find((p) => p.partId === "database")!.options.find((o) => o.id === "mysql")!;
    expect(mysql.ai).toBe(-3);
    expect(mysql.adjustments).toContainEqual({ source: "ai", text: "The notes say so.", points: -3 });
    const plain = buildRecommendation(input("G3"), score(input("G3"), kb, { sqlite: 2 }), kb, "2026-11-09");
    const sqlite = plain.parts.find((p) => p.partId === "database")!.options.find((o) => o.id === "sqlite")!;
    expect(sqlite.adjustments).toContainEqual({ source: "ai", text: "AI adjustment", points: 2 });
  });
});
