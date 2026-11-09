import type { KnowledgeBase } from "./schema";

/** Something the notes mention that the KB can answer (schema §10): a ranked option or a glossary entry. */
export interface Mention {
  kind: "option" | "glossary";
  id: string;
  name: string;
  /** The alias text that matched, as written in the KB (lower case). */
  matched: string;
  /** One or two lines from the KB: what it is, and how it relates to this tool. */
  answer: string;
  /** For an option: its part. */
  part?: string;
  /** For a glossary entry: ranked options it relates to. */
  related: string[];
}

export const MAX_MENTIONS = 4;

/** Option names that are everyday words: matched only through explicit aliases ("render.com", "express.js"). */
const COMMON_WORDS = new Set(["render", "express", "railway", "astro"]);

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Every alias the notes are matched against, with its owner (`option:<id>` or `glossary:<id>`). An option is matched by
 * its name and id (when 3+ characters, so "go" in "we go live" doesn't match) and by its explicit `aliases`.
 */
export function mentionAliases(kb: KnowledgeBase): { alias: string; key: string }[] {
  const out: { alias: string; key: string }[] = [];
  for (const o of kb.options) {
    if (o.level !== "product") continue;
    const implicit = [o.name.toLowerCase(), o.id].filter(
      (a) => a.length >= 3 && !/[/(,]/.test(a) && !COMMON_WORDS.has(a),
    );
    for (const alias of new Set([...implicit, ...(o.aliases ?? [])])) out.push({ alias, key: `option:${o.id}` });
  }
  for (const g of kb.glossary) for (const alias of g.aliases) out.push({ alias, key: `glossary:${g.id}` });
  return out;
}

/**
 * Deterministic alias match of free-text notes against the KB (adapted from Architecture Advisor): lower case,
 * whole-word match; longer aliases are tried first and claim their text, so "ruby on rails" doesn't also match "ruby";
 * at most MAX_MENTIONS items, in order of first appearance. Pure.
 */
export function matchMentions(notes: string, kb: KnowledgeBase): Mention[] {
  const text = notes.toLowerCase();
  if (!text.trim()) return [];
  const byKey = new Map<string, Omit<Mention, "matched">>();
  for (const o of kb.options)
    if (o.level === "product")
      byKey.set(`option:${o.id}`, {
        kind: "option",
        id: o.id,
        name: o.name,
        answer: `${o.summary} We rank it under ${kb.parts.find((p) => p.id === o.part)?.name ?? o.part}.`,
        part: o.part,
        related: [],
      });
  for (const g of kb.glossary)
    byKey.set(`glossary:${g.id}`, { kind: "glossary", id: g.id, name: g.name, answer: g.answer, related: g.related });

  const candidates = mentionAliases(kb).sort(
    (a, b) => b.alias.length - a.alias.length || (a.alias < b.alias ? -1 : a.alias > b.alias ? 1 : 0),
  );
  const claimed: boolean[] = new Array(text.length).fill(false);
  const found = new Map<string, { mention: Mention; position: number }>();
  for (const { alias, key } of candidates) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(alias)}(?![\\p{L}\\p{N}])`, "gu");
    for (const m of text.matchAll(re)) {
      const start = m.index;
      const end = start + m[0].length;
      if (claimed.slice(start, end).some(Boolean)) continue;
      for (let i = start; i < end; i++) claimed[i] = true;
      const existing = found.get(key);
      if (!existing || start < existing.position)
        found.set(key, { mention: { ...byKey.get(key)!, matched: alias }, position: start });
    }
  }
  return [...found.values()]
    .sort((a, b) => a.position - b.position)
    .slice(0, MAX_MENTIONS)
    .map((f) => f.mention);
}
