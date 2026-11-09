import { createHash } from "node:crypto";
import type { KvStore } from "@/modules/platform/store";
import type { AiContext } from "./context";
import { PROMPT_VERSION } from "./prompt";
import type { AiResponse } from "./schema";

/** Cache entries live 30 days (AI_INTEGRATION §7). */
export const CACHE_TTL_MS = 30 * 24 * 3600 * 1000;

/** What is stored per answer: the validated response, keyed by a hash. No notes are stored. */
export interface CacheEntry {
  response: AiResponse;
  provider: string;
  model: string;
  createdAt: number;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Sorts object keys at every depth, so the same answers in another order give the same key. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}

/** Lower-case, single spaces: whitespace or case changes in the notes don't make a request new. */
export const normaliseNotes = (notes: string) => notes.toLowerCase().replace(/\s+/g, " ").trim();

/** T1 key: every structured answer and the normalised (redacted) notes, plus the KB and prompt versions. */
export function identicalKey(ctx: AiContext): string {
  const answers = { ...ctx.input, notes: undefined }; // the notes go in normalised and redacted, below
  return sha256(JSON.stringify([ctx.rules.kbVersion, PROMPT_VERSION, canonical(answers), normaliseNotes(ctx.notes)]));
}

export async function findIdentical(store: KvStore, ctx: AiContext): Promise<CacheEntry | undefined> {
  return store.get<CacheEntry>(`ai:t1:${identicalKey(ctx)}`);
}

/** Stores a validated answer. Only valid answers ever get here. */
export async function saveEntry(store: KvStore, ctx: AiContext, entry: CacheEntry): Promise<void> {
  await store.set(`ai:t1:${identicalKey(ctx)}`, entry, CACHE_TTL_MS);
}
