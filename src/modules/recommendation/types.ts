import type { Level, Mention } from "@/modules/knowledge-base";
import type { Fit, ScoreResult, StackCloseCall, StackTie } from "@/modules/scoring";

/** Where an option stands against the chosen stack (SCORING_ENGINE step 6, last paragraph). */
export type StackLabel =
  /** In the chosen stack; `locked` when the user marked it "Must use" (Q12). */
  | { kind: "in-stack"; locked?: true }
  | { kind: "fits" }
  /** It requires another part to be one of `ids`, and the stack has something else (Django → needs Python). */
  | { kind: "needs"; part: string; ids: string[] }
  /** A pick in the stack rules it out: the pick requires something else here, or the two conflict. */
  | { kind: "clashes"; with: string };

/** One criterion's share of the base score: `points` add up to `base` (step 7 contributions). */
export interface WhyRow {
  criterion: string;
  level: Level;
  value: number; // the KB score, 1–5
  points: number; // w·(value − 1)/4·100 / Σw
}

export interface Adjustment {
  source: "rule" | "skill" | "ai";
  id?: string; // rule id
  text: string;
  points: number;
}

export interface FactView {
  id: string;
  kind: string;
  text: string;
  checked: string; // YYYY-MM-DD
  /** Older than the KB's stale window for its kind on the date the caller passed in. */
  stale: boolean;
}

export interface OptionView {
  id: string;
  rank: number;
  base: number;
  rules: number;
  skill: number;
  /** AI adjustment in points, when the AI layer adjusted this option. */
  ai?: number;
  final: number;
  cand: number;
  fit: Fit;
  label: StackLabel;
  /** The option's own best-ranked approach (a product can belong to several); undefined for one-level parts. */
  type?: string;
  why: WhyRow[]; // sorted: biggest contribution first; criteria with weight 0 left out
  adjustments: Adjustment[];
  facts: FactView[];
  /** Oldest `checked` date of the scores used for this part. */
  scoresChecked: string;
}

export interface PartView {
  partId: string;
  needed: boolean;
  notNeeded?: { ruleId: string; text: string };
  types: { id: string; final: number; fit: Fit }[];
  chosenType?: string;
  /** A runner-up type within closeCallPoints of the chosen one. */
  typeCloseCall?: string;
  pick?: string;
  options: OptionView[];
  excluded: { id: string; reason: string }[];
}

export interface Recommendation {
  kbVersion: string;
  /** The Architecture Advisor style the answers came with (Q2), and the rules it fired (A-rules, KB schema §7.5). */
  style?: { id: string; name: string; rules: { id: string; text: string }[] };
  score: ScoreResult;
  stackScore: number;
  fit: Fit;
  /** Display order: language, frontend, backend, database, hosting. */
  parts: PartView[];
  /** Criteria at Medium or above after floors, most important first (the comparison table's rows). */
  topCriteria: string[];
  /** Picks that aren't their part's #1, with the reason in words. */
  /** `relation`: the relation id, "stack score", or "locked" (a must-use pick, Q12). */
  adjusted: { partId: string; best: string; pick: string; relation: string; reason: string }[];
  closeCalls: StackCloseCall[];
  ties: StackTie[];
  /** "You chose Medium for Real-time; we used High because …". */
  raised: { criterion: string; chosen: Level; used: Level; reason: string }[];
  /** Things the notes mention that the KB can answer (schema §10), shown with or without AI. */
  mentions: Mention[];
  /**
   * Well-known stacks the result matches (schema §10, never ranked): `differs` is empty for a full match, or the one
   * part that differs for a bundle of four or more parts ("close to MERN, with Vue instead of React").
   */
  bundles: {
    id: string;
    name: string;
    description: string;
    differs: { partId: string; bundle: string; stack?: string }[];
  }[];
  /** Rule notes and relation notes for the chosen stack. */
  notes: { id?: string; text: string; points?: number }[];
}

/** One bounded AI adjustment (AI_INTEGRATION §5): a product in the top 5 of its part, ±5 points, with a reason. */
export interface AiAdjustment {
  optionId: string;
  partId: string;
  delta: number;
  reason: string;
  /** "notes" when the reason comes from the user's notes, "inputs" when from the structured answers. */
  basis: "notes" | "inputs";
}

/** The AI's plain-language explanation of the stack the server assembled (after its adjustments). */
export interface AiExplanation {
  summary: string;
  /** One entry per part in the stack, in display order: why this pick suits the project. */
  stack: { partId: string; optionId: string; why: string }[];
  cautions: string[];
  notesUsed: string[];
  /** One answer per KB item matched in the notes (`option:<id>` or `glossary:<id>`). */
  mentions: { id: string; answer: string }[];
}

/**
 * What /api/explain returns (AI_INTEGRATION §10). `skipped` is set by the browser when the user opted out (no
 * request is made); `disabled` when the server runs with AI_MODE=off.
 */
export interface AiBlock {
  status: "ok" | "cached" | "unavailable" | "rate_limited" | "disabled" | "skipped";
  provider?: string;
  model?: string;
  promptVersion?: string;
  latencyMs?: number;
  /** Clamped and validated; empty when the AI changed nothing. */
  adjustments: AiAdjustment[];
  explanation?: AiExplanation;
  /** The stack the server assembled with the adjustments (needed part → option). */
  stack?: Record<string, string>;
  /** Set when an identical earlier request's answer was reused (cache tier T1). */
  reuse?: { tier: "identical" };
}
