import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { score, validateInput, type UserInput } from "@/modules/scoring";
import { presets } from "@/components/form/presets";

/** Locks (Q12, SCORING_ENGINE steps 1, 3, 4 and 6): "we must use X" keeps X in the stack, whatever the scores say. */
const example = (id: string) => presets.find((p) => p.id === id)!.input;

describe("locks: validation", () => {
  it.each([
    [{ locked: { nope: "postgresql" } }, /unknown part nope/],
    [{ locked: { database: "django" } }, /django is not a database product/],
    [{ locked: { database: "relational" } }, /relational is not a database product/],
    [{ locked: { hosting: "nope" } }, /nope is not a hosting product/],
  ])("rejects %j", (input, error) => {
    expect(() => validateInput(input as UserInput, kb)).toThrow(error);
  });

  it("accepts a product of the part", () => {
    expect(() => validateInput({ locked: { database: "mongodb" } }, kb)).not.toThrow();
  });
});

describe("locks: scoring", () => {
  it("a locked product is the pick, its approach becomes the chosen one, and the result says it was locked", () => {
    const input = { ...example("shop"), locked: { database: "mongodb" } };
    const r = score(input, kb);
    expect(score(example("shop"), kb).stack.picks.database).toBe("postgresql");
    expect(r.stack.picks.database).toBe("mongodb");
    expect(r.parts.database!.chosenType).toBe("document");
    expect(r.parts.database!.closeCall).toBeUndefined();
    expect(r.stack.adjusted).toContainEqual({
      partId: "database",
      best: r.parts.database!.products[0]!.id,
      pick: "mongodb",
      relation: "locked",
    });
    expect(r.locks).toEqual([]);
  });

  it("a lock on a part a rule calls unnecessary keeps the part, with a warning naming the rule", () => {
    const r = score({ ...example("portfolio"), locked: { database: "postgresql" } }, kb);
    expect(r.parts.database!.needed).toBe(true);
    expect(r.stack.picks.database).toBe("postgresql");
    expect(r.locks).toEqual([
      {
        partId: "database",
        option: "postgresql",
        kind: "not-needed",
        ruleId: "D8",
        text: kb.rules.find((x) => x.id === "D8")!.explanation,
      },
    ]);
  });

  it("a lock on an option a rule excludes keeps it, with a warning instead of a removal", () => {
    const input: UserInput = {
      answers: { "app-kind": "web-app", commercial: "yes", budget: "free-only" },
      locked: { hosting: "vercel" },
    };
    expect(score({ ...input, locked: {} }, kb).parts.hosting!.excluded).toContain("vercel");
    const r = score(input, kb);
    expect(r.stack.picks.hosting).toBe("vercel");
    expect(r.parts.hosting!.excluded).not.toContain("vercel");
    expect(r.parts.hosting!.products.map((p) => p.id)).toContain("vercel");
    expect(r.locks).toContainEqual({
      partId: "hosting",
      option: "vercel",
      kind: "excluded",
      ruleId: "K1",
      text: kb.rules.find((x) => x.id === "K1")!.explanation,
    });
  });

  it("a lock pulls the rest of the stack along: Django needs Python", () => {
    const r = score({ ...example("shop"), locked: { backend: "django" } }, kb);
    expect(r.stack.picks.backend).toBe("django");
    expect(r.stack.picks.language).toBe("python");
    expect(r.stack.conflict).toBeUndefined();
  });

  it("locks beat the strong-language protection (T6)", () => {
    const r = score({ ...example("shop"), locked: { language: "go" } }, kb);
    expect(r.stack.picks.language).toBe("go");
  });

  it("locks that clash keep both picks and explain the clash", () => {
    const r = score({ ...example("shop"), locked: { backend: "django", language: "java" } }, kb);
    expect(r.stack.picks.backend).toBe("django");
    expect(r.stack.picks.language).toBe("java");
    expect(r.stack.conflict).toBe(
      `Your “Must use” choices don't work together: ${kb.compatibility.find((c) => c.id === "C-django-language")!.explanation}`,
    );
  });

  it("a lock with no valid partner says which relation blocks it", () => {
    const r = score({ ...example("shop"), locked: { hosting: "github-pages" } }, kb);
    expect(r.stack.picks.hosting).toBe("github-pages");
    expect(r.stack.conflict).toContain("GitHub Pages serves static files only");
  });

  it("no lock, no locks field", () => {
    expect(score(example("shop"), kb).locks).toBeUndefined();
  });
});

const products = kb.options.filter((o) => o.level === "product");

describe("locks: properties (SCORING_ENGINE property 5)", () => {
  it("a locked option is always in the stack, for every example and every product", () => {
    for (const p of presets)
      for (const o of products) {
        const r = score({ ...p.input, locked: { [o.part]: o.id } }, kb);
        expect(r.stack.picks[o.part], `${p.id} + ${o.id}`).toBe(o.id);
      }
  }, 60_000);

  it("two random locks are both kept, and scoring stays deterministic", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...presets),
        fc.constantFrom(...products),
        fc.constantFrom(...products),
        (p, a, b) => {
          const locked = { [a.part]: a.id, [b.part]: b.id };
          const input = { ...p.input, locked };
          const r = score(input, kb);
          for (const [part, id] of Object.entries(locked)) expect(r.stack.picks[part]).toBe(id);
          expect(r).toEqual(score(input, kb));
        },
      ),
      { numRuns: 200 },
    );
  }, 60_000);
});
