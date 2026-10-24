import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { score, type PartResult } from "@/modules/scoring";
import { golden, teamLanguagePick, type PartExpectation, type Scenario } from "./golden";

function check(part: "database" | "backend", p: PartResult, e: PartExpectation, s: Scenario) {
  if (e.notNeeded) {
    expect(p.needed).toBe(false);
    return;
  }
  expect(p.needed).toBe(true);
  if (e.typeIn) expect(e.typeIn).toContain(p.chosenType);
  if (e.typeInTop2) expect(p.types.slice(0, 2).map((t) => t.id)).toContain(e.typeInTop2);
  for (const t of e.typeNot ?? []) expect(p.chosenType).not.toBe(t);
  if (e.productIn) {
    const pick =
      part === "database"
        ? p.products.find((x) => x.types.includes(p.chosenType!))?.id
        : teamLanguagePick(score(s.input, kb), s.input, kb);
    expect(e.productIn).toContain(pick);
  }
  if (e.productNotSecond) {
    const inType = p.products.filter((x) => x.types.includes(p.chosenType!));
    expect(inType[1]?.id).not.toBe(e.productNotSecond);
  }
}

describe("golden scenarios (database and backend parts)", () => {
  for (const s of golden) {
    it(`${s.id} ${s.title}`, () => {
      const r = score(s.input, kb);
      for (const part of ["database", "backend"] as const) {
        const e = s.expect[part];
        if (e) check(part, r.parts[part]!, e, s);
      }
      // Every scenario returns a result for every part (G12: no crash, no empty result).
      for (const part of kb.parts) expect(r.parts[part.id]).toBeDefined();
    });
  }

  it("type-win coverage: every ranked type is #1 in at least one golden scenario, unless exempt with a reason", () => {
    const won = new Set<string>();
    for (const s of golden) {
      const r = score(s.input, kb);
      for (const part of kb.parts) {
        const p = r.parts[part.id]!;
        if (p.needed && p.chosenType) won.add(p.chosenType);
        if (!p.needed) won.add(kb.options.find((o) => o.part === part.id && o.none)!.id);
      }
    }
    const missing = kb.options
      .filter((o) => o.level === "type" && !o.coverageExempt && !won.has(o.id))
      .map((o) => o.id);
    expect(missing).toEqual([]);
  });
});
