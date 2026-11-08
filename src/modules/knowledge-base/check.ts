import { rawKnowledgeBase } from "./index";
import { findIntegrityProblems } from "./integrity";
import { knowledgeBaseSchema } from "./schema";

/** Build-time gate (next.config.ts): the KB must pass the Zod schema and the cross-file integrity checks. */
export function assertValidKnowledgeBase(raw: unknown = rawKnowledgeBase): void {
  const parsed = knowledgeBaseSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Knowledge base fails the schema:\n${parsed.error.message}`);
  const problems = findIntegrityProblems(parsed.data);
  if (problems.length > 0) throw new Error(`Knowledge base integrity problems:\n- ${problems.join("\n- ")}`);
}
