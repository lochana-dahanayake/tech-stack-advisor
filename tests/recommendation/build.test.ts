import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { buildRecommendation, dayNumber, PART_ORDER } from "@/modules/recommendation";
import { score, type UserInput } from "@/modules/scoring";
import { golden } from "../scoring/golden";

const TODAY = "2026-11-09";
const input = (id: string) => golden.find((g) => g.id === id)!.input;
const build = (i: UserInput, today = TODAY) => buildRecommendation(i, score(i, kb), kb, today);
const part = (r: ReturnType<typeof build>, id: string) => r.parts.find((p) => p.partId === id)!;
const option = (r: ReturnType<typeof build>, partId: string, id: string) =>
  part(r, partId).options.find((o) => o.id === id)!;

describe("buildRecommendation (ARCHITECTURE §2, SCORING_ENGINE step 7)", () => {
  it("is pure: same input and date, same output", () => {
    expect(build(input("G2"))).toEqual(build(input("G2")));
  });

  it("lists the parts in display order and keeps the engine's ranking", () => {
    const r = build(input("G2"));
    expect(r.parts.map((p) => p.partId)).toEqual([...PART_ORDER]);
    const engine = score(input("G2"), kb);
    for (const p of r.parts)
      expect(p.options.map((o) => o.id)).toEqual(engine.parts[p.partId]!.products.map((x) => x.id));
  });

  it("explains a part that isn't needed with the rule's own words (G1)", () => {
    const r = build(input("G1"));
    expect(part(r, "database")).toMatchObject({ needed: false, notNeeded: { ruleId: "D8" } });
    expect(part(r, "database").notNeeded!.text).toBe(kb.rules.find((x) => x.id === "D8")!.explanation);
  });

  it("labels options against the stack: in the stack, fits, needs, clashes (G2: Java + Spring Boot)", () => {
    const r = build(input("G2"));
    expect(option(r, "backend", "spring-boot").label).toEqual({ kind: "in-stack" });
    expect(option(r, "backend", "django").label).toEqual({ kind: "needs", part: "language", ids: ["python"] });
    expect(option(r, "language", "python").label).toEqual({ kind: "clashes", with: "spring-boot" });
    expect(option(r, "hosting", "netlify").label).toEqual({ kind: "clashes", with: "java" });
    expect(option(r, "database", "mysql").label).toEqual({ kind: "fits" });
  });

  it("splits the base score into per-criterion points that add up to it", () => {
    const r = build(input("G2"));
    for (const p of r.parts)
      for (const o of p.options) {
        const sum = o.why.reduce((s, w) => s + w.points, 0);
        expect(sum).toBeCloseTo(o.base, 9);
        for (let i = 1; i < o.why.length; i++) expect(o.why[i - 1]!.points).toBeGreaterThanOrEqual(o.why[i]!.points);
      }
  });

  it("names rule and skill adjustments with their points", () => {
    const r = build(input("G2"));
    expect(option(r, "language", "java").adjustments).toEqual([
      { source: "skill", text: "Team skills: your team has strong Java / Kotlin on the JVM skills", points: 20 },
    ]);
    const g1 = build(input("G1"));
    expect(option(g1, "frontend", "nextjs").adjustments.map((a) => a.id)).toEqual(["S16"]);
    const learn = build({ ...input("G2"), goal: "learn" });
    expect(option(learn, "language", "java").adjustments[0]!.text).toMatch(/halved/);
  });

  it("explains the tight-deadline penalty for a language nobody knows (T4, G5)", () => {
    const r = build(input("G5"));
    expect(option(r, "language", "python").adjustments).toEqual([
      { source: "skill", text: "Team skills: a tight deadline, and your team doesn't know it yet", points: -10 },
    ]);
  });

  it("passes the tie rule's result through (G12: Java and C# tie, the stack picks C#)", () => {
    expect(build(input("G12")).ties).toEqual([
      { partId: "language", options: ["java", "csharp"], pick: "csharp", reason: "stack score" },
    ]);
  });

  it("gives the reason an option was excluded", () => {
    const r = build(input("G8"));
    const excluded = part(r, "backend").excluded.find((e) => e.id === "frontend-server")!;
    expect(excluded.reason).toMatch(/no web frontend/);
  });

  it("explains adjusted picks: a relation's text, or the stack score (G8)", () => {
    const r = build(input("G8"));
    expect(r.adjusted.find((a) => a.partId === "hosting")!.reason).toBe(
      kb.compatibility.find((c) => c.id === "C-cloudflare-language")!.explanation,
    );
    expect(r.adjusted.find((a) => a.partId === "language")!.reason).toMatch(/stronger whole stack/);
    expect(r.closeCalls).toEqual(score(input("G8"), kb).stack.closeCalls);
  });

  it("puts the most important criteria first, Medium and above only", () => {
    const r = build(input("G2"));
    expect(r.topCriteria[0]).toBe("data-integrity"); // Critical via D5
    expect(r.topCriteria).not.toContain("cost");
  });

  it("explains a priority the engine raised above the user's choice", () => {
    const r = build({ answers: { "real-time": "yes", "app-kind": "web-app" }, weights: { "real-time": "medium" } });
    expect(r.raised).toEqual([
      {
        criterion: "real-time",
        chosen: "medium",
        used: "high",
        reason: kb.rules.find((x) => x.id === "S5")!.explanation,
      },
    ]);
  });

  it("marks facts stale only after their kind's window, using the date it is given", () => {
    const fresh = build(input("G2"), "2026-11-09");
    expect(fresh.parts.flatMap((p) => p.options.flatMap((o) => o.facts)).some((f) => f.stale)).toBe(false);
    const later = build(input("G2"), "2028-01-01");
    const facts = later.parts.flatMap((p) => p.options.flatMap((o) => o.facts));
    expect(facts.length).toBeGreaterThan(0);
    expect(facts.every((f) => f.stale)).toBe(true);
  });
});

describe("dayNumber", () => {
  it("counts days like the calendar does", () => {
    expect(dayNumber("1970-01-01")).toBe(0);
    expect(dayNumber("2000-03-01") - dayNumber("2000-02-28")).toBe(2); // 2000 is a leap year
    expect(dayNumber("2100-03-01") - dayNumber("2100-02-28")).toBe(1); // 2100 isn't
    expect(dayNumber("2026-11-09") - dayNumber("2025-11-09")).toBe(365);
  });
});
