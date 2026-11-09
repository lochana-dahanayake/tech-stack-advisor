import { kb } from "@/modules/knowledge-base";
import { makeContext, type AiContext } from "@/modules/ai/context";
import { buildPrompt } from "@/modules/ai/prompt";
import { mockReply } from "@/modules/ai/providers/mock";
import { ProviderError, type LlmProvider } from "@/modules/ai/providers/types";
import type { UserInput } from "@/modules/scoring";
import { golden } from "../scoring/golden";

export const inputOf = (id: string): UserInput => structuredClone(golden.find((g) => g.id === id)!.input);
export const ctxFor = (input: UserInput): AiContext => makeContext(input, kb);

export interface Reply {
  adjustments: { optionId: string; delta: number; reason: string; basis: string }[];
  explanation: {
    summary: string;
    stack: { partId: string; optionId: string; why: string }[];
    cautions: string[];
    notesUsed: string[];
  };
}

/** A valid reply for the context (no adjustments, the rule engine's stack), deep-copied so tests can edit it. */
export function validReply(ctx: AiContext): Reply {
  return structuredClone(mockReply(buildPrompt(ctx))) as unknown as Reply;
}

type Step = unknown | ProviderError | "hang";

/** A fake provider that plays back one step per call ("hang" waits for ever). */
export function fakeProvider(id: string, steps: Step[], timeoutMs = 10_000) {
  const calls: string[] = [];
  const provider: LlmProvider = {
    id,
    label: id,
    model: `${id}-model`,
    timeoutMs,
    dailyResetAt: (now) => now + 3_600_000,
    async generate(prompt) {
      calls.push(prompt.user);
      const step = steps[Math.min(calls.length - 1, steps.length - 1)];
      if (step === "hang") return new Promise(() => {});
      if (step instanceof ProviderError) throw step;
      return typeof step === "function" ? (step as (p: typeof prompt) => unknown)(prompt) : step;
    },
  };
  return { provider, calls };
}
