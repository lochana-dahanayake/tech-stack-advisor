import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/explain/route";
import { kb } from "@/modules/knowledge-base";
import { parseInput } from "@/modules/ai";
import { resetSharedStore } from "@/modules/platform/store";
import { score } from "@/modules/scoring";
import { inputOf } from "../ai/helpers";

const G3 = inputOf("G3");
const G2 = inputOf("G2");

const post = (body: unknown, ip = "203.0.113.7") =>
  POST(
    new Request("http://localhost/api/explain", {
      method: "POST",
      headers: { "x-forwarded-for": ip },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const aiFor = async (body: unknown, ip?: string) => (await (await post(body, ip)).json()).ai;

beforeEach(() => {
  resetSharedStore();
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/explain (TESTING_STRATEGY §5)", () => {
  it("returns the 'disabled' AI block when AI_MODE is off or unset", async () => {
    vi.stubEnv("AI_MODE", "off");
    const res = await post({ input: G2 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ai: { status: "disabled", adjustments: [] } });
    vi.stubEnv("AI_MODE", "");
    expect((await aiFor({ input: G2 })).status).toBe("disabled");
  });

  it("AI_MODE=mock: ok with the engine's stack, then cached for the identical request", async () => {
    vi.stubEnv("AI_MODE", "mock");
    const ai = await aiFor({ input: G3 });
    expect(ai).toMatchObject({ status: "ok", provider: "Mock AI", promptVersion: "1", adjustments: [] });
    expect(ai.stack).toEqual(score(G3, kb).stack.picks);
    expect((await aiFor({ input: G3 })).status).toBe("cached");
  });

  it("AI_MOCK=reorder: the stack in the block is the one the server re-assembled with the adjustment", async () => {
    vi.stubEnv("AI_MODE", "mock");
    vi.stubEnv("AI_MOCK", "reorder");
    const ai = await aiFor({ input: G3 });
    expect(ai.status).toBe("ok");
    const [a] = ai.adjustments;
    expect(ai.stack).toEqual(score(G3, kb, { [a.optionId]: a.delta }).stack.picks);
    expect(ai.stack).not.toEqual(score(G3, kb).stack.picks);
  });

  it.each(["invalid", "429", "fail"])("AI_MODE=mock with the %s fixture falls back to 'unavailable'", async (f) => {
    vi.stubEnv("AI_MODE", "mock");
    vi.stubEnv("AI_MOCK", f);
    expect(await aiFor({ input: G3 })).toEqual({ status: "unavailable", adjustments: [], promptVersion: "1" });
  });

  it("AI_MODE=live without keys reports 'unavailable' and calls nothing", async () => {
    vi.stubEnv("AI_MODE", "live");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await aiFor({ input: G2 })).status).toBe("unavailable");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rate-limits per client: the 11th request in 10 minutes gets 'rate_limited'", async () => {
    vi.stubEnv("AI_MODE", "mock");
    const statuses = [];
    for (let i = 0; i < 11; i++) statuses.push((await aiFor({ input: G3 })).status);
    expect(statuses.at(-1)).toBe("rate_limited");
    expect(statuses.slice(0, 10)).not.toContain("rate_limited");
    expect((await aiFor({ input: G3 }, "198.51.100.1")).status).toBe("cached");
  });

  it("ignores scores and stacks sent by the client and recomputes the rule result", async () => {
    vi.stubEnv("AI_MODE", "mock");
    const ai = await aiFor({ input: G3, result: { stack: { picks: { database: "mongodb" } } } });
    expect(ai.stack).toEqual(score(G3, kb).stack.picks);
  });

  it("never echoes API keys and logs no notes", async () => {
    vi.stubEnv("AI_MODE", "mock");
    vi.stubEnv("GEMINI_API_KEY", "secret-gemini-key-123");
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const res = await post({ input: { ...G3, notes: "private detail about our bank" } });
    expect(await res.text()).not.toContain("secret-gemini-key-123");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private detail");
    expect(log).toHaveBeenCalled();
  });

  it("returns 'unavailable', not a stack trace, when the AI step throws", async () => {
    vi.stubEnv("AI_MODE", "mock");
    const { sharedStore } = await import("@/modules/platform/store");
    vi.spyOn(sharedStore(), "get").mockRejectedValueOnce(new Error("boom")); // the cache lookup fails
    const res = await post({ input: G3 });
    expect(await res.json()).toEqual({ ai: { status: "unavailable", adjustments: [] } });
  });

  it("rejects bodies that aren't JSON or don't hold a valid input, without echoing internals", async () => {
    expect((await post("{oops")).status).toBe(400);
    expect((await post(null)).status).toBe(400);
    const nothing = await post({ input: {} });
    expect(nothing.status).toBe(400);
    const json = await nothing.json();
    expect(json.issues).toEqual([expect.stringMatching(/something to rank/)]);
    expect(JSON.stringify(json)).not.toMatch(/at .*\.ts|Error:/);
    expect((await post({ input: { ...G3, weights: { speed: "max" } } })).status).toBe(400);
    expect((await post({ input: { ...G3, answers: { nope: "x" } } })).status).toBe(400);
    expect((await post({ input: { ...G3, extra: 1 } })).status).toBe(400);
    expect((await post({ input: { ...G3, notes: "x".repeat(1001) } })).status).toBe(400);
    expect((await post({ input: { ...G3, notes: "x".repeat(20_000) } })).status).toBe(413);
  });
});

describe("parseInput", () => {
  it("accepts every golden input and reports unknown ids as issues instead of throwing", () => {
    expect(parseInput(G3, kb)).toEqual({ ok: true, input: G3 });
    expect(parseInput({ ...G3, locked: { database: "nextjs" } }, kb)).toEqual({
      ok: false,
      issues: ["nextjs is not a database product"],
    });
    expect(parseInput("x", kb).ok).toBe(false);
  });
});
