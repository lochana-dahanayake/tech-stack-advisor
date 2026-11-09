import type { Prompt } from "../prompt";
import { ProviderError, type LlmProvider } from "./types";

export type MockScenario = "ok" | "reorder" | "invalid" | "slow" | "429" | "fail";

/** The stack the prompt names as recommended, as part → option (parsed from the RECOMMENDED STACK line). */
function promptStack(prompt: Prompt): Record<string, string> {
  const line = prompt.user.split("\n").find((l) => l.startsWith("RECOMMENDED STACK")) ?? "";
  return Object.fromEntries([...line.matchAll(/([a-z-]+)=([a-z0-9-]+)/g)].map((m) => [m[1]!, m[2]!]));
}

/** A valid reply for any prompt: no adjustments, the rule engine's stack explained (AI_MODE=mock). */
export function mockReply(prompt: Prompt, stack = promptStack(prompt)): Record<string, unknown> {
  const parts = prompt.ids.parts;
  return {
    adjustments: [],
    explanation: {
      summary: `Mock explanation: ${parts.map((p) => stack[p]).join(" + ")} is the stack that best matches what you marked as most important.`,
      stack: parts.map((partId) => ({
        partId,
        optionId: stack[partId],
        why: `${stack[partId]} has the best score for your priorities among the ${partId} options that fit the rest of the stack.`,
      })),
      cautions: ["This is a mock reply (AI_MODE=mock); no AI service was called."],
      notesUsed: [],
    },
  };
}

/**
 * Like mockReply, but raises the #2 product of the first adjustable part by 5 points, so the UI's "AI changed the
 * stack" note can be checked. The stack it names is only right when that lifts #2 into the stack (the two are
 * within 5 points and fit the rest); otherwise validation rejects it, the repair retry fails the same way, and the
 * chain falls back to rules-only.
 */
export function mockReorderReply(prompt: Prompt): Record<string, unknown> {
  const stack = promptStack(prompt);
  let target: string | undefined;
  let second: string | undefined;
  // The first part whose #1 is in the stack and whose #2 is within 5 points of it (by rank score).
  const rankScore = (line: string | undefined) =>
    Number(/rank score ([\d.]+)/.exec(line ?? "")?.[1] ?? /final ([\d.]+)/.exec(line ?? "")?.[1]);
  for (const section of prompt.user.split("\nPART ").slice(1)) {
    const partId = section.slice(0, section.indexOf(" "));
    const first = /^ {2}1\. .*$/m.exec(section)?.[0];
    const secondLine = /^ {2}2\. .*$/m.exec(section)?.[0];
    const id = secondLine?.trim().split(" ")[1];
    const close = rankScore(first) - rankScore(secondLine) < 5 && first?.includes("[in stack]");
    if (prompt.ids.parts.includes(partId) && id && close && prompt.ids.adjustable.includes(id)) {
      target = partId;
      second = id;
      break;
    }
  }
  if (!target || !second) return mockReply(prompt);
  const reply = mockReply(prompt, { ...stack, [target]: second });
  return {
    ...reply,
    adjustments: [
      { optionId: second, delta: 5, reason: `Mock: ${second} suits these answers a little better.`, basis: "inputs" },
    ],
  };
}

/**
 * The fixture provider for AI_MODE=mock (AI_INTEGRATION §11): ok, reorder (see above), invalid (never valid JSON),
 * slow (waits until the chain's timeout), 429 (per-minute limit) or fail (HTTP 503). It spends no quota.
 */
export function mockProvider(scenario: string): LlmProvider {
  return {
    id: "mock",
    label: "Mock AI",
    model: `mock-${scenario}`,
    timeoutMs: 2_000,
    dailyResetAt: (now) => now + 60_000,
    async generate(prompt, signal) {
      switch (scenario) {
        case "invalid":
          return "Sorry, I can't produce JSON today.";
        case "slow":
          return new Promise((_, reject) =>
            signal.addEventListener("abort", () => reject(new ProviderError("timeout", "timed out"))),
          );
        case "429":
          throw new ProviderError("rate-minute", "HTTP 429 (per-minute limit)");
        case "fail":
          throw new ProviderError("server", "HTTP 503");
        case "reorder":
          return mockReorderReply(prompt);
        default:
          return mockReply(prompt);
      }
    },
  };
}
