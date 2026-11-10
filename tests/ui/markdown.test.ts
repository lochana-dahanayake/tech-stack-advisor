import { describe, expect, it } from "vitest";
import { presets } from "@/components/form/presets";
import { resultToMarkdown } from "@/components/result/markdown";
import { kb } from "@/modules/knowledge-base";
import { buildRecommendation } from "@/modules/recommendation";
import { score, type UserInput } from "@/modules/scoring";

const md = (id: string) => {
  const input: UserInput = presets.find((p) => p.id === id)!.input;
  const rec = buildRecommendation(input, score(input, kb), kb, "2026-11-09");
  return resultToMarkdown(rec, input, kb, { date: "2026-11-09", appVersion: "9.9.9" });
};

describe("resultToMarkdown", () => {
  it("is pure: the same result gives the same text", () => {
    expect(md("shop")).toBe(md("shop"));
  });

  it("leads with the stack, the score and the versions", () => {
    const text = md("shop");
    expect(text.split("\n")[0]).toBe(
      "# Tech stack recommendation: Java / Kotlin on the JVM + Next.js + Spring Boot + PostgreSQL + Render",
    );
    expect(text).toContain("_Tech Stack Advisor, 2026-11-09 · app v9.9.9 · knowledge base v" + kb.meta.kbVersion + "_");
    expect(text).toMatch(/\*\*Strong fit, stack score \d+ out of 100\.\*\*/);
    expect(text).toContain("| Backend | Spring Boot | Batteries-included framework |");
  });

  it("links back to the result when a share link is given, and only then", () => {
    const input = presets[0]!.input;
    const rec = buildRecommendation(input, score(input, kb), kb, "2026-11-09");
    const link = "https://example.test/advisor#a=abc";
    const text = resultToMarkdown(rec, input, kb, { date: "2026-11-09", appVersion: "9.9.9", link });
    expect(text).toContain(`[Open this result in Tech Stack Advisor](${link})`);
    expect(md("chat")).not.toContain("Open this result");
  });

  it("says which parts aren't needed and why (portfolio)", () => {
    const text = md("portfolio");
    expect(text).toContain("## Not needed");
    expect(text).toContain(`- **Database:** ${kb.rules.find((r) => r.id === "D8")!.explanation}`);
    expect(text).not.toContain("## Database");
  });

  it("includes things to know, per-part rankings with stack labels, and dated facts", () => {
    const text = md("api");
    expect(text).toContain("## Things to know");
    expect(text).toMatch(/- \*\*Close call: Go \+ Gin/);
    expect(text).toContain("## Backend");
    expect(text).toMatch(/\| 2 \| Gin \| \d+ \| Needs Go \|/);
    expect(text).toMatch(/checked 20\d\d-\d\d-\d\d/);
  });

  it("lists the answers in plain words", () => {
    const text = md("shop");
    expect(text).toContain("## Your answers");
    expect(text).toContain("- What are you building? Online shop");
    expect(text).toContain("- Extra data facts: Money or strict consistency");
    expect(text).toContain("- Team skills: Java / Kotlin on the JVM (strong)");
    expect(text).toContain("- Priorities you set: Maturity and long-term support: High, Fast to build with: Medium");
  });
});
