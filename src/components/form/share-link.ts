import type { KnowledgeBase } from "@/modules/knowledge-base";
import { checkInput, type UserInput } from "@/modules/scoring";
import { sanitiseForm, toUserInput, type FormState, type StepId } from "./form-state";

/**
 * Shareable links (sibling FR-37): the answers travel in the URL hash as `#a=<base64url JSON>`. Browsers never
 * send the hash to the server. Ids rather than positions are encoded, so a link keeps working when the KB adds
 * questions; anything the KB no longer knows is dropped and the form opens instead of the result. The notes are
 * left out, because links get pasted into chats (same as the sibling); so is the "Don't use AI" choice.
 */
const PARAM = "a=";
const LINK_VERSION = 1;

export type SharedLink =
  /** No share link in the hash. */
  | { status: "none" }
  /** Unreadable: cut off, hand-edited or from an unknown link version. */
  | { status: "broken" }
  /** Every answer is valid for the current KB: show the result straight away. */
  | { status: "ok"; form: FormState }
  /** Some answers were dropped, or there's nothing to rank on: open the form at the step that needs attention. */
  | { status: "partial"; form: FormState; step: StepId };

const toBase64Url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (code: string) =>
  new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(atob(code.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)),
  );

/**
 * Short keys keep links short: a answers, w weights, s skills, f known frameworks, g goal, l must-use locks,
 * st architecture style. Defaults are left out.
 */
interface LinkJson {
  v: number;
  a?: unknown;
  w?: unknown;
  s?: unknown;
  f?: unknown;
  g?: unknown;
  l?: unknown;
  st?: unknown;
}

/** The hash part (with `#`) for these answers. */
export function encodeShareHash(input: UserInput): string {
  const data: LinkJson = { v: LINK_VERSION, a: input.answers ?? {} };
  if (input.weights && Object.keys(input.weights).length > 0) data.w = input.weights;
  if (input.skills && Object.keys(input.skills).length > 0) data.s = input.skills;
  if (input.knownFrameworks && input.knownFrameworks.length > 0) data.f = input.knownFrameworks;
  if (input.goal === "learn") data.g = "learn";
  if (input.locked && Object.keys(input.locked).length > 0) data.l = input.locked;
  if (input.style) data.st = input.style;
  return `#${PARAM}${toBase64Url(JSON.stringify(data))}`;
}

/** How many values a link carries (a multi-select counts each choice), to tell whether cleaning dropped any. */
const size = (o: unknown): number =>
  Array.isArray(o)
    ? o.length
    : typeof o === "object" && o !== null
      ? Object.values(o).reduce<number>((n, v) => n + (Array.isArray(v) ? v.length : 1), 0)
      : 0;

const isRecord = (o: unknown): o is Record<string, unknown> => typeof o === "object" && o !== null && !Array.isArray(o);

/** Reads a hash back, cleaning it with the form's KB filter and checking it with the engine's own validator. */
export function decodeShareHash(hash: string, kb: KnowledgeBase): SharedLink {
  const body = hash.replace(/^#/, "");
  if (!body.startsWith(PARAM)) return { status: "none" };
  let data: unknown;
  try {
    data = JSON.parse(fromBase64Url(body.slice(PARAM.length)));
  } catch {
    return { status: "broken" };
  }
  if (!isRecord(data) || data.v !== LINK_VERSION) return { status: "broken" };

  const raw = {
    answers: isRecord(data.a) ? data.a : {},
    weights: isRecord(data.w) ? data.w : {},
    skills: isRecord(data.s) ? data.s : {},
    knownFrameworks: Array.isArray(data.f) ? data.f : [],
    locked: isRecord(data.l) ? data.l : {},
  };
  const style = data.st;
  const form = sanitiseForm({ ...raw, goal: data.g === "learn" ? "learn" : "ship", style } as Partial<FormState>, kb);
  const dropped =
    size(raw.answers) + size(raw.weights) + size(raw.skills) + size(raw.knownFrameworks) + size(raw.locked) !==
      size(form.answers) + size(form.weights) + size(form.skills) + size(form.knownFrameworks) + size(form.locked) ||
    (style !== undefined && form.style !== style);
  const canRank = checkInput(toUserInput(form), kb).issues.length === 0;
  if (!dropped && canRank) return { status: "ok", form };
  // The only blocking issue ("nothing to rank on") is answered on step 1; otherwise let them review priorities.
  return { status: "partial", form, step: canRank ? 4 : 1 };
}
