import { describe, expect, it } from "vitest";
import { kb, rawKnowledgeBase, type KnowledgeBase, type Relation } from "@/modules/knowledge-base";
import { knowledgeBaseSchema } from "@/modules/knowledge-base/schema";
import { score } from "@/modules/scoring";
import { golden } from "./golden";

const input = (id: string) => golden.find((g) => g.id === id)!.input;
const withoutPairings: KnowledgeBase = {
  ...kb,
  compatibility: kb.compatibility.filter((c) => c.kind !== "worksBestWith"),
};

describe("worksBestWith pairings (KB schema §6, SCORING_ENGINE step 6)", () => {
  it("adds a small bonus that can settle a near-tie: G4 picks Django (with PostgreSQL) over FastAPI", () => {
    expect(score(input("G4"), withoutPairings).stack.picks.backend).toBe("fastapi");
    const r = score(input("G4"), kb);
    expect(r.stack.picks).toMatchObject({ backend: "django", database: "postgresql" });
    expect(r.stack.relationNotes).toContainEqual(expect.objectContaining({ id: "C-django-postgresql", points: 1 }));
  });

  it("is spread over the stack's parts and capped at caps.stackPairBonus", () => {
    const g4 = input("G4");
    const base = score(g4, kb).stack; // includes C-django-postgresql (+1)
    const picks = base.picks;
    const n = Object.keys(picks).length;
    const pair = (option: string, part: string): Relation => ({
      id: `T-${option}-${part}`,
      kind: "worksBestWith",
      option,
      part,
      anyOf: [picks[part]!],
      points: 3,
      explanation: "test pairing",
      sources: [{ kind: "design", note: "test", reviewed: false }],
    });
    // Three more +3 pairings, all with the picked backend (so no rival stack shares them): 1 + 9 points asked for,
    // at most 6 allowed. (Pairings a rival also matches can cancel each other out under the cap.)
    const many: KnowledgeBase = {
      ...kb,
      compatibility: [
        ...kb.compatibility,
        pair(picks.backend!, "hosting"),
        pair(picks.backend!, "frontend"),
        pair(picks.backend!, "language"),
      ],
    };
    const boosted = score(g4, many).stack;
    expect(boosted.picks).toEqual(picks); // the bonus only favours the stack that already won
    expect(boosted.score - base.score).toBeCloseTo((kb.meta.caps.stackPairBonus - 1) / n, 9);
  });

  it("the schema allows 1 to 3 points for a pairing and none above 0 for a penalty", () => {
    const relations = rawKnowledgeBase.compatibility as unknown as Relation[];
    const pairing = relations.find((c) => c.kind === "worksBestWith")!;
    const parse = (c: Relation) =>
      knowledgeBaseSchema.safeParse({ ...rawKnowledgeBase, compatibility: [...relations, { ...c, id: "T" }] }).success;
    expect(parse(pairing)).toBe(true);
    expect(parse({ ...pairing, points: 4 })).toBe(false);
    expect(parse({ ...pairing, points: 0 })).toBe(false);
    expect(parse({ ...pairing, points: undefined })).toBe(false);
    expect(parse({ ...pairing, kind: "penalty", points: 2 })).toBe(false);
    expect(parse({ ...pairing, kind: "note", points: 1 })).toBe(false);
  });
});
