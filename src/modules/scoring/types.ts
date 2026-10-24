import type { Level, SkillLevel } from "@/modules/knowledge-base";

export interface UserInput {
  weights?: Partial<Record<string, Level>>; // unset = "low"
  answers?: Record<string, string | string[]>; // question id → option id (multi-select: list); unset = "not-sure"
  skills?: Partial<Record<string, SkillLevel>>; // language id → level; unset = "none"
  knownFrameworks?: string[];
  style?: string; // Architecture Advisor style id
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
  final: number;
  /** final minus the gap between the chosen type and the product's best type (SCORING_ENGINE step 5). */
  cand: number;
}

export interface PartResult {
  partId: string;
  needed: boolean;
  notNeededBy?: string;
  types: TypeResult[]; // ranked, excluded ones removed
  chosenType?: string;
  closeCall?: string; // runner-up type within closeCallPoints of the winner
  products: ProductResult[]; // ranked by cand, excluded ones removed
  excluded: string[];
}

export interface ScoreResult {
  kbVersion: string;
  effectiveWeights: Record<string, Level>;
  inputConflicts: InputConflict[];
  firedRules: FiredRule[];
  notes: string[];
  parts: Record<string, PartResult>;
}
