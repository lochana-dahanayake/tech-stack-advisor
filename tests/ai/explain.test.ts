import { describe, expect, it, vi } from "vitest";
import { kb } from "@/modules/knowledge-base";
import { identicalKey } from "@/modules/ai/cache";
import { explain, type ExplainDeps } from "@/modules/ai/explain";
import { defaultDeps, providersFor } from "@/modules/ai";
import { mockReorderReply, mockReply } from "@/modules/ai/providers/mock";
import { ProviderError } from "@/modules/ai/providers/types";
import { aiEnv, aiMode } from "@/modules/platform/env";
import { MemoryStore } from "@/modules/platform/store";
import type { UserInput } from "@/modules/scoring";
import { ctxFor, fakeProvider, inputOf } from "./helpers";

const answering = (id = "a", reply = mockReply) => fakeProvider(id, [(p: Parameters<typeof mockReply>[0]) => reply(p)]);

function deps(over: Partial<ExplainDeps> = {}, provider = answering()) {
  const log = vi.fn();
  return {
    provider,
    log,
    deps: {
      providers: [provider.provider],
      store: new MemoryStore(),
      now: () => 0,
      identicalReuse: true,
      dailyBudget: 100,
      log,
      ...over,
    } satisfies ExplainDeps,
  };
}

const G3 = inputOf("G3");
const withNotes = (notes: string): UserInput => ({ ...G3, notes });

describe("explain (AI_INTEGRATION §1–7)", () => {
  it("returns ok with provider details, the explanation and the engine's stack", async () => {
    const { deps: d } = deps();
    const ai = await explain(G3, kb, d);
    expect(ai).toMatchObject({ status: "ok", provider: "a", model: "a-model", promptVersion: "2", adjustments: [] });
    expect(ai.stack).toEqual(ctxFor(G3).rules.stack.picks);
    expect(ai.explanation?.stack.map((s) => s.optionId)).toEqual(ctxFor(G3).parts.map((p) => ai.stack![p]));
  });

  it("returns the stack the server re-assembled after the AI's adjustments", async () => {
    const { deps: d } = deps({}, answering("a", mockReorderReply));
    const ai = await explain(G3, kb, d);
    expect(ai.status).toBe("ok");
    expect(ai.adjustments).toHaveLength(1);
    expect(ai.stack).not.toEqual(ctxFor(G3).rules.stack.picks);
  });

  it("returns unavailable when every provider fails, and stores nothing", async () => {
    const failing = fakeProvider("a", [new ProviderError("server", "503")]);
    const { deps: d } = deps({}, failing);
    expect(await explain(G3, kb, d)).toEqual({ status: "unavailable", adjustments: [], promptVersion: "2" });
    expect((await explain(G3, kb, d)).status).toBe("unavailable");
    expect(failing.calls).toHaveLength(2);
  });

  it("stops at the global daily budget", async () => {
    const { deps: d } = deps({ dailyBudget: 1, identicalReuse: false });
    expect((await explain(G3, kb, d)).status).toBe("ok");
    expect((await explain(withNotes("other"), kb, d)).status).toBe("unavailable");
  });

  it("logs status, provider and latency only: never notes or AI text", async () => {
    const { deps: d, log } = deps();
    await explain(withNotes("secret project codename Bluebird"), kb, d);
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toMatch(/Bluebird|Mock explanation/);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ status: "ok", provider: "a" }));
  });
});

describe("cache T1 (identical requests, AI_INTEGRATION §7)", () => {
  it("reuses an identical request without calling the AI; whitespace and case in notes don't matter", async () => {
    const { deps: d, provider } = deps();
    await explain(withNotes("We use MySQL a lot"), kb, d);
    const again = await explain(withNotes("  we use MYSQL   a lot "), kb, d);
    expect(again).toMatchObject({ status: "cached", reuse: { tier: "identical" }, provider: "a" });
    expect(provider.calls).toHaveLength(1);
  });

  it("the key ignores answer order but not answers; a cached answer doesn't count against the budget", async () => {
    const reordered: UserInput = Object.fromEntries(Object.entries(G3).reverse());
    expect(identicalKey(ctxFor(reordered))).toBe(identicalKey(ctxFor(G3)));
    expect(identicalKey(ctxFor({ ...G3, goal: "learn" }))).not.toBe(identicalKey(ctxFor(G3)));
    const { deps: d } = deps({ dailyBudget: 1 });
    await explain(G3, kb, d);
    expect((await explain(G3, kb, d)).status).toBe("cached");
  });

  it("calls the AI again for identical requests when CACHE_IDENTICAL_REUSE=false", async () => {
    const { deps: d, provider } = deps({ identicalReuse: false });
    await explain(G3, kb, d);
    expect((await explain(G3, kb, d)).status).toBe("ok");
    expect(provider.calls).toHaveLength(2);
  });

  it("re-checks a cached answer against the fresh rule result and calls the AI when it no longer fits", async () => {
    const { deps: d, provider } = deps();
    await explain(G3, kb, d);
    const key = `ai:t1:${identicalKey(ctxFor(G3))}`;
    const entry = (await d.store.get<{ response: { explanation: { stack: unknown[] } } }>(key))!;
    entry.response.explanation.stack = [];
    await d.store.set(key, entry, 1000);
    expect((await explain(G3, kb, d)).status).toBe("ok");
    expect(provider.calls).toHaveLength(2);
  });
});

describe("settings (server-only env, AI_INTEGRATION §12)", () => {
  it("reads AI_MODE, keys, models, budget and the mock fixture with safe defaults", () => {
    vi.stubEnv("AI_MODE", "");
    expect(aiMode()).toBe("off");
    vi.stubEnv("AI_MODE", "live");
    expect(aiMode()).toBe("live");
    vi.stubEnv("GEMINI_MODEL", "");
    vi.stubEnv("GROQ_MODEL", "");
    vi.stubEnv("AI_DAILY_BUDGET", "nope");
    vi.stubEnv("CACHE_IDENTICAL_REUSE", "false");
    vi.stubEnv("AI_MOCK", "");
    expect(aiEnv()).toMatchObject({
      gemini: { model: "gemini-3.5-flash-lite" },
      groq: { model: "openai/gpt-oss-120b" },
      dailyBudget: 1300,
      identicalReuse: false,
      mockScenario: "ok",
    });
    vi.unstubAllEnvs();
  });

  it("wires Gemini then Groq, skipping a provider without a key; mock mode uses the fixture", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "k");
    expect(providersFor("live").map((p) => p.id)).toEqual(["groq"]);
    vi.stubEnv("GEMINI_API_KEY", "k");
    expect(providersFor("live").map((p) => p.id)).toEqual(["gemini", "groq"]);
    vi.stubEnv("AI_MOCK", "reorder");
    expect(providersFor("mock").map((p) => p.model)).toEqual(["mock-reorder"]);
    expect(defaultDeps("mock")).toMatchObject({ identicalReuse: true, dailyBudget: 1300 });
    vi.unstubAllEnvs();
  });
});
