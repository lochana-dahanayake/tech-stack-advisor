import { describe, expect, it } from "vitest";
import {
  emptyForm,
  frameworkOptions,
  fromInput,
  restoreForm,
  sanitiseForm,
  serialiseForm,
  STEP_QUESTIONS,
  toUserInput,
} from "@/components/form/form-state";
import { presets } from "@/components/form/presets";
import { kb } from "@/modules/knowledge-base";
import { validateInput } from "@/modules/scoring";

describe("form state", () => {
  it("asks every KB question exactly once across the steps", () => {
    const asked = Object.values(STEP_QUESTIONS).flat();
    expect([...asked].sort()).toEqual(kb.questions.map((q) => q.id).sort());
  });

  it.each(presets.map((p) => [p.id, p] as const))("round-trips the %s example unchanged", (_, p) => {
    expect(toUserInput(fromInput(p.input))).toEqual(p.input);
  });

  it("leaves out empty multi-selects and defaults, and keeps 'learn' and known frameworks", () => {
    const f = { ...emptyForm(), answers: { "data-flags": [], seo: "yes" } };
    expect(toUserInput(f)).toEqual({ answers: { seo: "yes" } });
    const g = { ...emptyForm(), goal: "learn" as const, knownFrameworks: ["react"] };
    expect(toUserInput(g)).toEqual({ answers: {}, goal: "learn", knownFrameworks: ["react"] });
    expect(() => validateInput(toUserInput(g), kb)).not.toThrow();
  });

  it("offers only real framework packages as known frameworks", () => {
    const ids = frameworkOptions(kb).map((o) => o.id);
    expect(ids).toContain("react");
    expect(ids).toContain("django");
    expect(ids).not.toContain("plain-html");
    expect(ids).not.toContain("frontend-server"); // a bridge to the frontend framework's server
    expect(ids).not.toContain("postgresql");
    expect(ids).not.toContain("python");
  });

  it("drops anything the KB doesn't know from a saved form", () => {
    const dirty = {
      answers: { "app-kind": "spaceship", seo: "yes", "data-flags": ["money", "nope"], ghost: "x", traffic: ["small"] },
      weights: { performance: "high", speed: "high", cost: "extreme" },
      skills: { python: "strong", cobol: "strong", go: "expert" },
      knownFrameworks: ["react", "jquery"],
      goal: "panic",
      locked: { database: "mongodb", backend: "postgresql", hosting: 7, nope: "react" },
      style: "big-ball-of-mud",
    } as unknown as Parameters<typeof sanitiseForm>[0];
    expect(sanitiseForm(dirty, kb)).toEqual({
      answers: { seo: "yes", "data-flags": ["money"] },
      weights: { performance: "high" },
      skills: { python: "strong" },
      knownFrameworks: ["react"],
      goal: "ship",
      locked: { database: "mongodb" },
    });
  });

  it("keeps must-use locks and the architecture style, and leaves out empty locks", () => {
    const f = { ...emptyForm(), locked: { database: "mongodb", hosting: "" }, style: "serverless" };
    expect(toUserInput(f)).toEqual({ answers: {}, locked: { database: "mongodb" }, style: "serverless" });
    expect(fromInput(toUserInput(f))).toEqual({ ...f, locked: { database: "mongodb" } });
    expect(sanitiseForm({ style: "serverless" }, kb).style).toBe("serverless");
  });

  it("restores what it saved, and ignores broken or old saves", () => {
    const form = fromInput(presets[1]!.input);
    expect(restoreForm(serialiseForm({ form, step: 3 }, kb), kb)).toEqual({ form, step: 3 });
    expect(restoreForm(serialiseForm({ form, step: 9 as 1 }, kb), kb)?.step).toBe(1);
    const onResult = { form, step: 4 as const, view: "result" as const, example: "shop" };
    expect(restoreForm(serialiseForm(onResult, kb), kb)).toEqual(onResult);
    const odd = JSON.stringify({ v: 1, form, step: 2, view: "chart", example: 7 });
    expect(restoreForm(odd, kb)).toEqual({ form, step: 2 });
    expect(restoreForm("{not json", kb)).toBeUndefined();
    expect(restoreForm(JSON.stringify({ v: 0, form }), kb)).toBeUndefined();
    expect(restoreForm(null, kb)).toBeUndefined();
  });
});
