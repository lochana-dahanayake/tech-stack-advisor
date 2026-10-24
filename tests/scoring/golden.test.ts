import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { score, type PartResult } from "@/modules/scoring";
import { golden, type PartExpectation, type Scenario } from "./golden";

function check(
  part: "database" | "backend" | "language",
  p: PartResult,
  e: PartExpectation & { inTop3?: string[] },
  s: Scenario,
) {
  if (e.notNeeded) {
    expect(p.needed).toBe(false);
    return;
  }
  expect(p.needed).toBe(true);
  if (e.typeIn) expect(e.typeIn).toContain(p.chosenType);
  if (e.typeInTop2) expect(p.types.slice(0, 2).map((t) => t.id)).toContain(e.typeInTop2);
  for (const t of e.typeNot ?? []) expect(p.chosenType).not.toBe(t);
  if (e.productIn) {
    const stackPick = score(s.input, kb).stack.picks[part];
    expect(e.productIn).toContain(stackPick);
    if (part === "database") expect(e.productIn).toContain(p.products.find((x) => x.types.includes(p.chosenType!))?.id);
  }
  for (const l of e.inTop3 ?? []) expect(p.products.slice(0, 3).map((x) => x.id)).toContain(l);
  if (e.productNotSecond) {
    const inType = p.products.filter((x) => x.types.includes(p.chosenType!));
    expect(inType[1]?.id).not.toBe(e.productNotSecond);
  }
}

describe("golden scenarios (database, backend and language parts, assembled stack)", () => {
  for (const s of golden) {
    it(`${s.id} ${s.title}`, () => {
      const r = score(s.input, kb);
      for (const part of ["database", "backend", "language"] as const) {
        const e = s.expect[part];
        if (e) check(part, r.parts[part]!, e, s);
      }
      const cc = s.expect.stackCloseCall;
      if (cc) {
        expect(r.parts[cc.partId]!.products[0]!.id).toBe(cc.best);
        expect(r.stack.picks[cc.partId]).toBe(cc.pick);
        const shown = r.stack.closeCalls.find((c) => c.partId === cc.partId);
        expect(shown?.best).toBe(cc.best);
        expect(shown?.picks).toMatchObject(cc.alternative);
      }
      // Every scenario returns a result for every part and a stack with no conflict (G12: no crash, no empty result).
      for (const part of kb.parts) expect(r.parts[part.id]).toBeDefined();
      expect(r.stack.conflict).toBeUndefined();
      for (const part of kb.parts) expect(part.id in r.stack.picks).toBe(r.parts[part.id]!.needed);
    });
  }

  it("type-win coverage: every ranked type is #1 in at least one golden scenario, unless exempt with a reason", () => {
    const won = new Set<string>();
    for (const s of golden) {
      const r = score(s.input, kb);
      for (const part of kb.parts) {
        const p = r.parts[part.id]!;
        if (p.needed && p.chosenType) won.add(p.chosenType);
        const none = kb.options.find((o) => o.part === part.id && o.none);
        if (!p.needed && none) won.add(none.id);
      }
    }
    const missing = kb.options
      .filter((o) => o.level === "type" && !o.coverageExempt && !won.has(o.id))
      .map((o) => o.id);
    expect(missing).toEqual([]);
  });
});
