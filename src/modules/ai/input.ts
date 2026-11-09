import { z } from "zod";
import type { KnowledgeBase } from "@/modules/knowledge-base";
import { checkInput, MAX_NOTES_LENGTH, validateInput, type UserInput } from "@/modules/scoring";

const level = z.enum(["none", "low", "medium", "high", "critical"]);
const id = z.string().min(1).max(64);

/** The shape of a UserInput sent by the browser (SCORING_ENGINE step 1). Unknown keys are rejected. */
const inputSchema = z
  .object({
    weights: z.record(id, level).optional(),
    answers: z.record(id, z.union([id, z.array(id).max(20)])).optional(),
    skills: z.record(id, z.enum(["none", "some", "strong"])).optional(),
    knownFrameworks: z.array(id).max(50).optional(),
    style: id.optional(),
    goal: z.enum(["ship", "learn"]).optional(),
    locked: z.record(id, id).optional(),
    notes: z.string().max(MAX_NOTES_LENGTH).optional(),
  })
  .strict();

/**
 * Checks an untrusted request body's `input` the way the form does: its shape, the ids the KB knows (validateInput),
 * and that there is something to rank (checkInput). Returns the input or the problems, never throws.
 */
export function parseInput(
  raw: unknown,
  kb: KnowledgeBase,
): { ok: true; input: UserInput } | { ok: false; issues: string[] } {
  const shape = inputSchema.safeParse(raw);
  if (!shape.success)
    return { ok: false, issues: shape.error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`) };
  const input = shape.data as UserInput;
  try {
    validateInput(input, kb);
  } catch (error) {
    return { ok: false, issues: [error instanceof Error ? error.message : "invalid input"] };
  }
  const { issues } = checkInput(input, kb);
  if (issues.length > 0) return { ok: false, issues: issues.map((i) => i.message) };
  return { ok: true, input };
}
