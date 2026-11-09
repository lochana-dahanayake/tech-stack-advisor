import { describe, expect, it } from "vitest";
import { presets } from "@/components/form/presets";
import { labelText } from "@/components/result/labels";
import { thingsToKnow } from "@/components/result/things";
import { kb } from "@/modules/knowledge-base";
import { buildRecommendation } from "@/modules/recommendation";
import { score, type UserInput } from "@/modules/scoring";

const rec = (input: UserInput) => buildRecommendation(input, score(input, kb), kb, "2026-11-09");
const shop = presets.find((p) => p.id === "shop")!.input;
const portfolio = presets.find((p) => p.id === "portfolio")!.input;

describe("things to know with locks (Q12)", () => {
  it("a must-use pick that isn't the part's #1 is explained as the user's choice", () => {
    const things = thingsToKnow(rec({ ...shop, locked: { database: "mongodb" } }));
    const t = things.find((x) => x.kind === "lock")!;
    expect(t.title).toBe("MongoDB: your must-use choice");
    expect(t.body).toMatch(/^PostgreSQL ranks first for your answers\. You chose MongoDB as a must-use/);
    expect(things.some((x) => x.kind === "adjusted" && x.title.startsWith("MongoDB"))).toBe(false);
  });

  it("a lock that overrides a rule says which rule, in its own words", () => {
    const things = thingsToKnow(rec({ ...portfolio, locked: { database: "sqlite" } }));
    const t = things.find((x) => x.kind === "lock" && x.title.includes("needed"))!;
    expect(t.title).toBe("SQLite: kept, although no database seemed needed");
    expect(t.body).toBe(
      `${kb.rules.find((r) => r.id === "D8")!.explanation} You marked it as a must-use, so it stays.`,
    );
  });

  it("clashing must-use choices come first, as a conflict", () => {
    const things = thingsToKnow(rec({ ...shop, locked: { backend: "django", language: "java" } }));
    expect(things[0]).toEqual({
      kind: "conflict",
      title: "These must-use choices don't fit together",
      body: "Your “Must use” choices don't work together: Django runs on Python.",
    });
  });

  it("labels a locked pick as a must-use", () => {
    expect(labelText({ kind: "in-stack", locked: true })).toBe("Must use (your choice)");
    expect(labelText({ kind: "in-stack" })).toBe("In your stack");
  });

  it("says which architecture style came along and what it changed", () => {
    const a1 = kb.rules.find((r) => r.id === "A1")!.explanation;
    const micro = thingsToKnow(rec({ ...shop, style: "microservices" })).find((x) => x.kind === "style")!;
    expect(micro).toEqual({
      kind: "style",
      title: "Architecture style: Microservices",
      body: `From Architecture Advisor. It nudged a few picks: ${a1}`,
    });
    const p2p = thingsToKnow(rec({ ...shop, style: "peer-to-peer" })).find((x) => x.kind === "style")!;
    expect(p2p.body).toBe("From Architecture Advisor. No rule reads this style yet, so it doesn't change the ranking.");
    expect(thingsToKnow(rec(shop)).some((x) => x.kind === "style")).toBe(false);
  });
});
