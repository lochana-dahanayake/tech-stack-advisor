import type { Level, SkillLevel } from "@/modules/knowledge-base";

export interface UserInput {
  weights?: Partial<Record<string, Level>>; // unset = "low"
  answers?: Record<string, string | string[]>; // question id → option id (multi-select: list); unset = "not-sure"
  skills?: Partial<Record<string, SkillLevel>>; // language id → level; unset = "none"
  knownFrameworks?: string[];
  style?: string; // Architecture Advisor style id
  goal?: "ship" | "learn"; // default "ship" (Q11)
  /** "We must use X" (Q12): part id → product id. The product is always in the stack. */
  locked?: Partial<Record<string, string>>;
  /** Free-text notes (≤ MAX_NOTES_LENGTH): read only by the AI layer, never by the engine. */
  notes?: string;
}

export interface FiredRule {
  id: string;
  branch: "when" | "otherwise";
  explanation: string;
}

export interface InputConflict {
  criterion: string;
  chosen: Level;
  used: Level;
  ruleId: string;
}

export interface TypeResult {
  id: string;
  base: number;
  rules: number;
  final: number;
}

export interface ProductResult {
  id: string;
  types: string[];
  base: number;
  rules: number;
  skill: number;
  /** AI adjustment (AI_INTEGRATION §5): present only when the AI layer adjusted this product. */
  ai?: number;
  final: number;
  /** final minus the gap between the chosen type and the product's best type (SCORING_ENGINE step 5). */
  cand: number;
}

export interface PartResult {
  partId: string;
  needed: boolean;
  notNeededBy?: string;
  types: TypeResult[]; // ranked, excluded ones removed
  chosenType?: string; // undefined for one-level parts (language)
  closeCall?: string; // runner-up type within closeCallPoints of the winner
  products: ProductResult[]; // ranked by cand, excluded ones removed
  excluded: string[];
}

/** Step 6.6: options level at the top of a part, and which rule settled the pick among them. */
export interface StackTie {
  partId: string;
  options: string[]; // tied with the part's #1 (same cand and final), in KB order
  pick: string;
  reason: "stack score" | "sum of final" | "KB order";
}

export interface StackCloseCall {
  partId: string;
  best: string; // the part's own #1, kept in the alternative stack
  picks: Record<string, string>; // the alternative stack
  score: number;
  gap: number; // chosen stack score − alternative score
}

export interface StackResult {
  picks: Record<string, string>; // needed part → option
  score: number; // mean candidate score of the picks
  /** Parts whose pick isn't their own #1, and why (a `requires` relation). */
  adjusted: { partId: string; best: string; pick: string; relation: string }[];
  ties: StackTie[];
  /**
   * Step 6.7: for an adjusted part, the best stack that keeps the part's own #1, when the pick beats it by less
   * than closeCallPoints. The UI shows both stacks.
   */
  closeCalls: StackCloseCall[];
  conflict?: string; // no combination satisfies every relation: per-part #1s are returned
  /** Relations of kind note or penalty that apply to the chosen stack (e.g. SQLite on one server; K9 beta). */
  relationNotes: { id: string; text: string; points?: number }[];
}

/** A rule that would have removed a locked pick (or its part): kept, with this warning instead (step 1, Q12). */
export interface LockWarning {
  partId: string;
  option: string;
  kind: "excluded" | "not-needed";
  ruleId: string;
  text: string; // the rule's explanation
}

export interface ScoreResult {
  kbVersion: string;
  effectiveWeights: Record<string, Level>;
  inputConflicts: InputConflict[];
  firedRules: FiredRule[];
  notes: string[];
  parts: Record<string, PartResult>;
  stack: StackResult;
  /** Set when the input locks a part: what the locks overrode (empty when nothing). */
  locks?: LockWarning[];
  /** The AI adjustments this result was scored with (option id → points); absent for a rules-only result. */
  ai?: Record<string, number>;
}
