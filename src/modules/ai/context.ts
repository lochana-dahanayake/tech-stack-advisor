import { matchMentions, type KnowledgeBase, type Mention } from "@/modules/knowledge-base";
import { PART_ORDER } from "@/modules/recommendation";
import { MAX_NOTES_LENGTH, score, type ScoreResult, type UserInput } from "@/modules/scoring";
import { redact } from "./redact";

/** How many ranked products per part the AI sees and may adjust (AI_INTEGRATION §3, §5). */
export const TOP_N = 5;

/** Everything one AI request is about, computed on the server from the validated input. */
export interface AiContext {
  kb: KnowledgeBase;
  input: UserInput;
  /** Recomputed here: the server never trusts scores sent by the browser (AI_INTEGRATION §9). */
  rules: ScoreResult;
  /** Notes as sent to the AI: trimmed, capped and redacted. */
  notes: string;
  /** KB items matched in the notes (deterministic, AI_INTEGRATION §4b): the AI must answer each. */
  mentions: Mention[];
  /** Parts in the stack, in display order. */
  parts: string[];
  /** Per part in the stack: its top TOP_N products in rule order (what the prompt lists). */
  top: Record<string, string[]>;
  /** Product ids the AI may adjust: the top TOP_N of each part in the stack, except locked parts. */
  adjustable: string[];
}

export function makeContext(input: UserInput, kb: KnowledgeBase): AiContext {
  const rules = score(input, kb);
  const parts = PART_ORDER.filter((p) => p in rules.stack.picks);
  const top = Object.fromEntries(
    parts.map((p) => [p, rules.parts[p]!.products.slice(0, TOP_N).map((x) => x.id)] as const),
  );
  // A locked part has one candidate (the user's choice), so adjusting its options could change nothing.
  const adjustable = parts.filter((p) => !input.locked?.[p]).flatMap((p) => top[p]!);
  return {
    kb,
    input,
    rules,
    notes: redact((input.notes ?? "").trim().slice(0, MAX_NOTES_LENGTH)),
    mentions: matchMentions(input.notes ?? "", kb),
    parts,
    top,
    adjustable,
  };
}
