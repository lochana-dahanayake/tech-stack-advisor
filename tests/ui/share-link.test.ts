import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { kb } from "@/modules/knowledge-base";
import { fromInput, toUserInput } from "@/components/form/form-state";
import { presets } from "@/components/form/presets";
import { decodeShareHash, encodeShareHash } from "@/components/form/share-link";

const hashOf = (data: unknown) => `#a=${Buffer.from(JSON.stringify(data)).toString("base64url")}`;
const shop = presets.find((p) => p.id === "shop")!.input;

describe("shareable link (URL hash)", () => {
  it("every example round-trips to the same answers", () => {
    for (const p of presets) {
      const link = decodeShareHash(encodeShareHash(p.input), kb);
      expect(link.status, p.id).toBe("ok");
      if (link.status === "ok") expect(toUserInput(link.form)).toEqual(p.input);
    }
  });

  it("keeps known frameworks and the learn goal", () => {
    const input = { ...shop, knownFrameworks: ["spring-boot"], goal: "learn" as const };
    const link = decodeShareHash(encodeShareHash(input), kb);
    expect(link.status === "ok" && toUserInput(link.form)).toEqual(input);
  });

  it("only uses URL-safe characters", () => {
    for (const p of presets) expect(encodeShareHash(p.input)).toMatch(/^#a=[A-Za-z0-9_-]+$/);
  });

  it("leaves defaults out, so links stay short", () => {
    const json = Buffer.from(encodeShareHash({ answers: { "app-kind": "web-app" } }).slice(3), "base64url").toString();
    expect(JSON.parse(json)).toEqual({ v: 1, a: { "app-kind": "web-app" } });
  });

  it("ignores hashes that aren't share links", () => {
    expect(decodeShareHash("", kb)).toEqual({ status: "none" });
    expect(decodeShareHash("#part-database", kb)).toEqual({ status: "none" });
  });

  it("reports cut-off, garbled or unknown-version links as broken", () => {
    const good = encodeShareHash(shop);
    expect(decodeShareHash(good.slice(0, 20), kb).status).toBe("broken");
    expect(decodeShareHash("#a=!!!", kb).status).toBe("broken");
    expect(decodeShareHash("#a=", kb).status).toBe("broken");
    expect(decodeShareHash(hashOf(null), kb).status).toBe("broken");
    expect(decodeShareHash(hashOf([1, 2]), kb).status).toBe("broken");
    expect(decodeShareHash(hashOf({ v: 2, a: shop.answers }), kb)).toEqual({ status: "broken" });
  });

  it("drops what the current KB doesn't know and opens the form instead of a result", () => {
    const link = decodeShareHash(
      hashOf({
        v: 1,
        a: { ...shop.answers, removed: "x", "data-flags": ["money", "gone"] },
        w: { ...shop.weights, vanished: "high" },
        s: { ...shop.skills, cobol: "strong" },
        f: ["no-such-framework"],
      }),
      kb,
    );
    expect(link.status).toBe("partial");
    if (link.status !== "partial") return;
    expect(toUserInput(link.form)).toEqual(shop);
    expect(link.step).toBe(4);
  });

  it("sends a link with nothing to rank on to step 1", () => {
    const link = decodeShareHash(hashOf({ v: 1, a: { traffic: "growing" } }), kb);
    expect(link).toMatchObject({ status: "partial", step: 1 });
  });

  it("never throws, whatever is in the hash", () => {
    fc.assert(
      fc.property(fc.string(), fc.anything(), (s, data) => {
        expect(() => decodeShareHash(`#a=${s}`, kb)).not.toThrow();
        expect(() => decodeShareHash(hashOf({ v: 1, a: data, w: data, s: data, f: data, g: data }), kb)).not.toThrow();
      }),
    );
  });

  it("a decoded form equals the form the example builds", () => {
    const link = decodeShareHash(encodeShareHash(shop), kb);
    expect(link.status === "ok" && link.form).toEqual(fromInput(shop));
  });

  it("encodes non-ASCII safely", () => {
    // Ids are ASCII today; the encoder must still survive any text a future KB might use.
    const input = { answers: { "app-kind": "web-app", note: "café ✓" } };
    expect(encodeShareHash(input)).toMatch(/^#a=[A-Za-z0-9_-]+$/);
  });
});
