import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  findIntegrityProblems,
  isOpenSourceAllowed,
  kb,
  licenceBadge,
  listSources,
  rawKnowledgeBase,
} from "@/modules/knowledge-base";
import { knowledgeBaseSchema, type KnowledgeBase } from "@/modules/knowledge-base/schema";

const index = readFileSync(new URL("../../references/INDEX.md", import.meta.url), "utf8");
const indexIds = new Set([...index.matchAll(/^\| ([a-z0-9-]+) \|/gm)].map((m) => m[1]));

describe("knowledge base", () => {
  it("passes the Zod schema", () => {
    expect(() => knowledgeBaseSchema.parse(rawKnowledgeBase)).not.toThrow();
  });

  it("allows SQLite (public domain) under 'open source only' and labels it public domain, not OSI (Q28)", () => {
    const opt = (id: string) => kb.options.find((o) => o.id === id)!;
    expect(isOpenSourceAllowed(opt("sqlite"))).toBe(true);
    expect(licenceBadge(opt("sqlite"))).toBe("public domain");
    expect(opt("sqlite").licence!.osi).toBe(false);
    expect(isOpenSourceAllowed(opt("mongodb"))).toBe(false); // SSPL
    expect(licenceBadge(opt("postgresql"))).toBe("OSI: yes");
    const publicDomain = kb.options.filter((o) => licenceBadge(o) === "public domain").map((o) => o.id);
    expect(publicDomain).toEqual(["sqlite"]);
  });

  it("passes the integrity checks", () => {
    expect(findIntegrityProblems(kb)).toEqual([]);
  });

  it("cites only books and refs listed in references/INDEX.md", () => {
    const missing = listSources(kb)
      .filter(({ source }) => (source.kind === "book" || source.kind === "ref") && !indexIds.has(source.ref))
      .map(({ where, source }) => `${where}: ${"ref" in source ? source.ref : ""}`);
    expect(missing).toEqual([]);
  });

  it("gives every score of 5 or 1 a book or ref source (owner rule, 2026-10-24)", () => {
    const bad = kb.options.flatMap((o) =>
      Object.entries(o.scores)
        .filter(
          ([, s]) => (s.value === 5 || s.value === 1) && !s.sources.some((x) => x.kind === "book" || x.kind === "ref"),
        )
        .map(([c]) => `${o.id}.${c}`),
    );
    expect(bad).toEqual([]);
  });

  it("holds unsourced scores at 3 with only GK sources, and lists them (visible diff when one gets sourced)", () => {
    const unsourced = kb.options.flatMap((o) =>
      Object.entries(o.scores)
        .filter(([, s]) => s.unsourced)
        .map(([c, s]) => {
          expect(s.value).toBe(3);
          expect(s.sources.every((x) => x.kind === "general")).toBe(true);
          return `${o.id}.${c} (proposed ${s.proposed})`;
        }),
    );
    expect(unsourced).toMatchSnapshot();
  });

  it("matches the score matrix snapshot (any KB change is a visible diff)", () => {
    const matrix = Object.fromEntries(
      kb.options.map((o) => [
        o.id,
        Object.entries(o.scores)
          .map(([c, s]) => `${c}=${s.value}${s.unsourced ? "u" : ""}`)
          .join(" "),
      ]),
    );
    expect(matrix).toMatchSnapshot();
  });

  it("gives every coverage exemption to a ranked type with a reason", () => {
    const exempt = kb.options.filter((o) => o.coverageExempt).map((o) => o.id);
    expect(exempt).toEqual(["key-value"]);
  });

  it("release gate: no unreviewed sources, no unsourced scores, no fact more than 2x its stale window overdue", () => {
    if (!process.env.KB_RELEASE_GATE) return; // run with `npm run kb:release-gate`
    expect(
      listSources(kb)
        .filter(({ source }) => "reviewed" in source && !source.reviewed)
        .map((s) => s.where),
    ).toEqual([]);
    expect(
      kb.options.flatMap((o) =>
        Object.entries(o.scores)
          .filter(([, s]) => s.unsourced)
          .map(([c]) => `${o.id}.${c}`),
      ),
    ).toEqual([]);
    expect(overdueFacts(kb, new Date(), 2)).toEqual([]);
  });
});

/** Facts (and scores) older than `factor` × their stale window. The test runner supplies today; the engine never reads the clock. */
export function overdueFacts(k: KnowledgeBase, today: Date, factor: number): string[] {
  const days = (d: string) => (today.getTime() - new Date(`${d}T00:00:00Z`).getTime()) / 86_400_000;
  const out: string[] = [];
  for (const o of k.options) {
    for (const f of o.facts) {
      const window = k.meta.staleAfterDays[f.kind];
      if (window && days(f.checked) > factor * window) out.push(`${o.id}.${f.id}`);
      if (f.until && days(f.until) > 0) out.push(`${o.id}.${f.id} (support ended)`);
    }
    for (const [c, s] of Object.entries(o.scores)) {
      const window = k.meta.staleAfterDays.score;
      if (window && days(s.checked) > factor * window) out.push(`${o.id}.${c}`);
    }
  }
  return out;
}

describe("stale facts", () => {
  it("flags facts past their window and ended support", () => {
    const fake = knowledgeBaseSchema.parse(rawKnowledgeBase);
    expect(overdueFacts(fake, new Date("2026-10-24T00:00:00Z"), 1)).toEqual([]);
    const later = overdueFacts(fake, new Date("2031-01-01T00:00:00Z"), 1);
    expect(later).toContain("postgresql.support (support ended)");
    expect(later).toContain("postgresql.version");
  });
});
