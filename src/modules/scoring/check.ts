import type { KnowledgeBase } from "@/modules/knowledge-base";
import type { UserInput } from "./types";

export interface InputMessage {
  code: "nothing-to-rank" | "too-many-critical";
  message: string;
}

/** More Critical priorities than this gets a warning (SCORING_ENGINE step 1; DESIGN, same as the sibling). */
export const MAX_CRITICAL = 3;

/**
 * Checks the form can ask the engine (SCORING_ENGINE step 1). `issues` block the result; `warnings` don't.
 * Unknown ids are `validateInput`'s job (it throws); this one returns messages for people.
 */
export function checkInput(input: UserInput, kb: KnowledgeBase): { issues: InputMessage[]; warnings: InputMessage[] } {
  const issues: InputMessage[] = [];
  const warnings: InputMessage[] = [];
  const levels = Object.values(input.weights ?? {});
  const appKind = input.answers?.["app-kind"];
  const strongPriority = levels.some((l) => l === "high" || l === "critical");
  if ((appKind === undefined || appKind === "not-sure") && !strongPriority) {
    const question = kb.questions.find((q) => q.id === "app-kind")?.text ?? "What are you building?";
    issues.push({
      code: "nothing-to-rank",
      message: `Answer “${question}” or set at least one priority to High or Critical, so there is something to rank on.`,
    });
  }
  const critical = levels.filter((l) => l === "critical").length;
  if (critical > MAX_CRITICAL)
    warnings.push({
      code: "too-many-critical",
      message: `You marked ${critical} priorities as Critical. Real stacks can't maximise everything; try keeping it to ${MAX_CRITICAL}.`,
    });
  return { issues, warnings };
}
