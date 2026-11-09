import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { buildPrompt } from "@/modules/ai/prompt";
import { mockReorderReply } from "@/modules/ai/providers/mock";
import { parseReply, sanitize, validateReply } from "@/modules/ai/validate";
import { score } from "@/modules/scoring";
import { ctxFor, inputOf, validReply } from "./helpers";

const ctx = ctxFor(inputOf("G3"));
const ids = buildPrompt(ctx).ids;
const check = (reply: unknown, c = ctx) => validateReply(reply, c, buildPrompt(c).ids);
const reasonOf = (reply: unknown, c = ctx) => {
  const v = check(reply, c);
  return v.ok ? "ok" : v.reason;
};

describe("AI reply validation (AI_INTEGRATION §4–6)", () => {
  it("accepts a reply that explains the engine's own stack, with no adjustments", () => {
    const v = check(validReply(ctx));
    expect(v.ok).toBe(true);
    if (v.ok) {
      expect(v.adjustments).toEqual([]);
      expect(v.adjusted).toBe(ctx.rules);
      expect(v.explanation.stack.map((s) => s.optionId)).toEqual(ctx.parts.map((p) => ctx.rules.stack.picks[p]));
    }
  });

  it.each([
    [0, /delta must not be 0/],
    [6, /delta/],
    [-7, /delta/],
    [2.5, /delta/],
  ])("rejects delta %s", (delta, reason) => {
    const r = validReply(ctx);
    r.adjustments = [{ optionId: ids.adjustable[1]!, delta, reason: "Because the notes say so.", basis: "inputs" }];
    expect(reasonOf(r)).toMatch(reason);
  });

  it("rejects more than 3 adjustments, duplicates, and ids outside the top 5 of their part", () => {
    const adj = (optionId: string) => ({ optionId, delta: -1, reason: "A specific reason here.", basis: "inputs" });
    const r = validReply(ctx);
    r.adjustments = ids.adjustable.slice(0, 4).map(adj);
    expect(reasonOf(r)).toMatch(/adjustments/);
    r.adjustments = [adj(ids.adjustable[0]!), adj(ids.adjustable[0]!)];
    expect(reasonOf(r)).toMatch(/adjusted once/);
    const sixth = ctx.rules.parts.frontend!.products[5]!.id;
    r.adjustments = [adj(sixth)];
    expect(reasonOf(r)).toMatch(/optionId/);
    const excluded = ctx.rules.parts.frontend!.excluded[0];
    if (excluded) {
      r.adjustments = [adj(excluded)];
      expect(reasonOf(r)).toMatch(/optionId/);
    }
    r.adjustments = [adj("not-a-product")];
    expect(reasonOf(r)).toMatch(/optionId/);
  });

  it("never lets a locked part be adjusted", () => {
    const locked = ctxFor({ ...inputOf("G3"), locked: { database: "mysql" } });
    const p = buildPrompt(locked);
    expect(p.ids.adjustable.some((id) => kb.options.find((o) => o.id === id)?.part === "database")).toBe(false);
    const r = validReply(locked);
    r.adjustments = [{ optionId: "postgresql", delta: 5, reason: "Postgres is better here.", basis: "inputs" }];
    expect(reasonOf(r, locked)).toMatch(/optionId/);
  });

  it("re-runs the stack assembly with the adjustments: the explanation must name that stack", () => {
    const p = buildPrompt(ctx);
    const reorder = mockReorderReply(p) as never as { adjustments: { optionId: string; delta: number }[] };
    expect(reorder.adjustments).toHaveLength(1);
    const v = check(reorder);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const { optionId, delta } = reorder.adjustments[0]!;
    const expected = score(ctx.input, kb, { [optionId]: delta });
    expect(v.adjusted.stack.picks).toEqual(expected.stack.picks);
    expect(v.adjusted.stack.picks).not.toEqual(ctx.rules.stack.picks);
    expect(v.adjustments[0]).toMatchObject({ optionId, delta, partId: expect.any(String) });

    // The same adjustment while still naming the old stack is invalid: the AI can't pick the stack.
    const stale = validReply(ctx);
    stale.adjustments = reorder.adjustments as never;
    expect(reasonOf(stale)).toMatch(/explanation\.stack must be.*after your adjustments/);
  });

  it("rejects a stack in the wrong order, with a part missing, or naming another option", () => {
    const r = validReply(ctx);
    r.explanation.stack.reverse();
    expect(reasonOf(r)).toMatch(/explanation\.stack must be/);
    const missing = validReply(ctx);
    missing.explanation.stack.pop();
    expect(reasonOf(missing)).toMatch(/explanation\.stack must be/);
    const other = validReply(ctx);
    const part = ctx.rules.parts.database!.products;
    other.explanation.stack.find((s) => s.partId === "database")!.optionId = part.find(
      (x) => x.id !== ctx.rules.stack.picks.database,
    )!.id;
    expect(reasonOf(other)).toMatch(/explanation\.stack must be/);
  });

  it("an adjustment citing the notes needs notes, and quoted phrases must come from them", () => {
    const withNotes = ctxFor({ ...inputOf("G3"), notes: "Our ops team already runs MySQL in production." });
    const adj = (reason: string) => ({ optionId: "mysql", delta: 1, reason, basis: "notes" });
    const r = validReply(withNotes);
    r.adjustments = [adj('The notes say "already runs MySQL in production".')];
    expect(reasonOf(r, withNotes)).toBe("ok");
    r.adjustments = [adj('The notes say "we love Oracle databases".')];
    expect(reasonOf(r, withNotes)).toMatch(/not in the notes/);
    const plain = validReply(ctx);
    plain.adjustments = [adj("The notes mention MySQL.")];
    expect(reasonOf(plain)).toMatch(/there are no notes/);
  });

  it("clamps and sanitises: strips tags and markdown links from every string", () => {
    const r = validReply(ctx);
    r.explanation.summary = 'Use <b>this</b> <script>alert(1)</script>[stack](https://evil.example "x").';
    const v = check(r);
    expect(v.ok && v.explanation.summary).toBe("Use this stack.");
  });

  it("drops unknown keys and rejects a missing explanation", () => {
    const r = { ...validReply(ctx), extra: "x" };
    const v = check(r);
    expect(v.ok && "extra" in v.response).toBe(false);
    expect(reasonOf({ adjustments: [] })).toMatch(/explanation/);
  });
});

describe("parseReply and sanitize", () => {
  it("parses objects, fenced JSON and JSON inside prose; reports empty, missing and broken JSON", () => {
    expect(parseReply({ a: 1 })).toEqual({ ok: true, value: { a: 1 } });
    expect(parseReply('```json\n{"a":1}\n```')).toEqual({ ok: true, value: { a: 1 } });
    expect(parseReply('Here you go: {"a":{"b":2}} hope it helps')).toEqual({ ok: true, value: { a: { b: 2 } } });
    expect(parseReply("")).toMatchObject({ ok: false, reason: "the reply was empty" });
    expect(parseReply(42)).toMatchObject({ ok: false, reason: "the reply was empty" });
    expect(parseReply("no json")).toMatchObject({ reason: "the reply held no JSON object" });
    expect(parseReply('{"a": 1')).toMatchObject({ reason: "the reply held no JSON object" });
    expect(parseReply('{"a": }')).toMatchObject({ reason: "the reply was not valid JSON" });
  });

  it("keeps plain text and collapses whitespace", () => {
    expect(sanitize("  a   b\n c ")).toBe("a b c");
    expect(sanitize("x < y and y > z")).toBe("x < y and y > z");
  });
});
