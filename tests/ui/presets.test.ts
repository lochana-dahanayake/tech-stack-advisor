import { describe, expect, it } from "vitest";
import { presets } from "@/components/form/presets";
import { kb } from "@/modules/knowledge-base";
import { score } from "@/modules/scoring";
import { golden } from "../scoring/golden";

describe("example presets", () => {
  it("have unique ids", () => {
    expect(new Set(presets.map((p) => p.id)).size).toBe(presets.length);
  });

  it.each(presets.map((p) => [p.id, p] as const))("%s copies its golden scenario's input exactly", (_, p) => {
    const g = golden.find((s) => s.id === p.golden);
    expect(g, `golden scenario ${p.golden}`).toBeDefined();
    expect(p.input).toEqual(g!.input);
  });

  it("the landing preview example (chat) uses all five parts", () => {
    const r = score(presets[0]!.input, kb);
    expect(Object.keys(r.stack.picks).sort()).toEqual(["backend", "database", "frontend", "hosting", "language"]);
  });
});
