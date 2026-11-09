import type { KnowledgeBase } from "@/modules/knowledge-base";
import type { KvStore } from "@/modules/platform/store";
import type { AiBlock } from "@/modules/recommendation";
import type { UserInput } from "@/modules/scoring";
import { findIdentical, saveEntry } from "./cache";
import { runChain, type Attempt } from "./chain";
import { makeContext } from "./context";
import { buildPrompt, PROMPT_VERSION } from "./prompt";
import type { LlmProvider } from "./providers/types";
import { validateReply, type Validation } from "./validate";

export interface ExplainDeps {
  providers: LlmProvider[];
  store: KvStore;
  now: () => number;
  /** false: identical requests go to the AI again (CACHE_IDENTICAL_REUSE=false). */
  identicalReuse: boolean;
  /** AI requests per UTC day across all users (AI_INTEGRATION §8). */
  dailyBudget: number;
  /** Gets only provider, latency, status and attempts: never notes or AI text (AI_INTEGRATION §9). */
  log?: (entry: { status: AiBlock["status"]; provider?: string; latencyMs?: number; attempts?: Attempt[] }) => void;
}

const DAY_MS = 24 * 3600 * 1000;
const unavailable: AiBlock = { status: "unavailable", adjustments: [], promptVersion: PROMPT_VERSION };

const block = (v: Extract<Validation, { ok: true }>): Pick<AiBlock, "adjustments" | "explanation" | "stack"> => ({
  adjustments: v.adjustments,
  explanation: v.explanation,
  stack: v.adjusted.stack.picks,
});

/**
 * The AI step for one validated input: recompute the rule result, reuse an identical earlier answer (T1, re-checked
 * against the fresh result), else run the provider chain. Any failure gives "unavailable": the rule result the user
 * already sees stays complete.
 */
export async function explain(input: UserInput, kb: KnowledgeBase, deps: ExplainDeps): Promise<AiBlock> {
  const { store, now, log = () => {} } = deps;
  const ctx = makeContext(input, kb);
  const prompt = buildPrompt(ctx);

  if (deps.identicalReuse) {
    const identical = await findIdentical(store, ctx);
    const v = identical && validateReply(identical.response, ctx, prompt.ids);
    if (identical && v?.ok) {
      log({ status: "cached", provider: identical.provider });
      return {
        status: "cached",
        reuse: { tier: "identical" },
        provider: identical.provider,
        model: identical.model,
        promptVersion: PROMPT_VERSION,
        ...block(v),
      };
    }
  }

  const used = await store.incr(`ai-budget:${Math.floor(now() / DAY_MS)}`, DAY_MS);
  if (used > deps.dailyBudget) {
    log({ status: "unavailable" });
    return unavailable;
  }

  const result = await runChain(prompt, ctx, deps);
  if (!result.ok) {
    log({ status: "unavailable", attempts: result.attempts });
    return unavailable;
  }

  await saveEntry(store, ctx, {
    response: result.response,
    provider: result.provider.label,
    model: result.provider.model,
    createdAt: now(),
  });
  log({ status: "ok", provider: result.provider.id, latencyMs: result.latencyMs, attempts: result.attempts });
  return {
    status: "ok",
    provider: result.provider.label,
    model: result.provider.model,
    promptVersion: PROMPT_VERSION,
    latencyMs: result.latencyMs,
    ...block(result),
  };
}
