import type { AiAdjustment, AiExplanation } from "@/modules/recommendation";
import { score, type ScoreResult } from "@/modules/scoring";
import type { AiContext } from "./context";
import { responseSchema, type AiResponse, type SchemaIds } from "./schema";

export type Validation =
  | {
      ok: true;
      response: AiResponse;
      adjustments: AiAdjustment[];
      explanation: AiExplanation;
      /** The rule result re-scored with the adjustments: the stack the server assembled, not the AI. */
      adjusted: ScoreResult;
    }
  | { ok: false; reason: string };

const invalid = (reason: string): Validation => ({ ok: false, reason });

/**
 * Turns a provider reply into a value: objects pass through; strings may hold JSON wrapped in ```json fences or
 * surrounded by prose, so the outermost {...} is parsed.
 */
export function parseReply(raw: unknown): { ok: true; value: unknown } | { ok: false; reason: string } {
  if (raw !== null && typeof raw === "object") return { ok: true, value: raw };
  if (typeof raw !== "string" || raw.trim() === "") return { ok: false, reason: "the reply was empty" };
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return { ok: false, reason: "the reply held no JSON object" };
  try {
    return { ok: true, value: JSON.parse(raw.slice(start, end + 1)) };
  } catch {
    return { ok: false, reason: "the reply was not valid JSON" };
  }
}

/** AI text is rendered as plain text, but tags and markdown links are stripped anyway (AI_INTEGRATION §6). */
export function sanitize(text: string): string {
  return text
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/!?\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") return sanitize(value) as T;
  if (Array.isArray(value)) return value.map(sanitizeDeep) as T;
  if (value !== null && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeDeep(v)])) as T;
  return value;
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Phrases the reason puts in quotes (8+ characters): they must come from the notes. */
const quotedPhrases = (reason: string) =>
  [...reason.matchAll(/["“”]([^"“”]{8,})["“”]/g)].map((m) => normalise(m[1]!)).filter(Boolean);

const clampDelta = (d: number) => Math.max(-5, Math.min(5, Math.round(d)));

/**
 * Schema and consistency checks of AI_INTEGRATION §4–6, run on every reply and on every cached reply against the
 * fresh rule result. The server clamps deltas itself, re-runs the engine (ranking and stack assembly) with them,
 * and the explanation must describe exactly that stack: the AI can't pick the stack directly.
 */
export function validateReply(raw: unknown, ctx: AiContext, ids: SchemaIds): Validation {
  const parsed = parseReply(raw);
  if (!parsed.ok) return invalid(parsed.reason);

  const result = responseSchema(ids).safeParse(parsed.value);
  if (!result.success) {
    const issue = result.error.issues[0]!;
    return invalid(`${issue.path.join(".") || "reply"}: ${issue.message}`);
  }
  const response = sanitizeDeep(result.data);

  const partOf = new Map(ctx.kb.options.map((o) => [o.id, o.part]));
  const adjustments: AiAdjustment[] = [];
  for (const a of response.adjustments) {
    // The schema's enum already limits ids; this keeps the rule even if the schema is ever loosened.
    if (!ctx.adjustable.includes(a.optionId)) return invalid(`${a.optionId} can't be adjusted`);
    adjustments.push({ ...a, partId: partOf.get(a.optionId)!, delta: clampDelta(a.delta) });
  }
  const notes = normalise(ctx.notes);
  for (const a of adjustments) {
    if (a.basis !== "notes") continue;
    if (!notes) return invalid(`adjustment for ${a.optionId} cites notes, but there are no notes`);
    const missing = quotedPhrases(a.reason).find((q) => !notes.includes(q));
    if (missing) return invalid(`adjustment for ${a.optionId} quotes "${missing}", which is not in the notes`);
  }

  const adjusted =
    adjustments.length > 0
      ? score(ctx.input, ctx.kb, Object.fromEntries(adjustments.map((a) => [a.optionId, a.delta])))
      : ctx.rules;
  const picks = adjusted.stack.picks;
  const expected = ctx.parts.filter((p) => p in picks);
  const named = response.explanation.stack;
  const wrong =
    named.length !== expected.length ||
    named.some((s, i) => s.partId !== expected[i] || s.optionId !== picks[s.partId]);
  if (wrong)
    return invalid(
      `explanation.stack must be, in this order: ${expected.map((p) => `${p}=${picks[p]}`).join(", ")} (the stack the engine assembles after your adjustments)`,
    );

  const answered = response.explanation.mentions.map((m) => m.id);
  if (new Set(answered).size !== answered.length) return invalid("mentions must not repeat an id");
  const unanswered = ids.mentions.find((id) => !answered.includes(id));
  if (unanswered) return invalid(`mentions must answer ${unanswered}`);

  return {
    ok: true,
    response,
    adjustments,
    adjusted,
    explanation: {
      summary: response.explanation.summary,
      stack: named,
      cautions: response.explanation.cautions,
      notesUsed: response.explanation.notesUsed,
      mentions: response.explanation.mentions,
    },
  };
}
