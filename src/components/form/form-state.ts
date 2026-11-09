import type { KnowledgeBase, Level, SkillLevel } from "@/modules/knowledge-base";
import { MAX_NOTES_LENGTH, type UserInput } from "@/modules/scoring";

/**
 * Everything the form holds. Only what the user actually set is stored: an unanswered question counts as
 * "Not sure", an untouched priority as Low, an unset skill as None (SCORING_ENGINE step 1).
 */
export interface FormState {
  answers: Partial<Record<string, string | string[]>>;
  weights: Partial<Record<string, Level>>;
  skills: Partial<Record<string, SkillLevel>>;
  knownFrameworks: string[];
  goal: "ship" | "learn";
  /** "Must use" per part (Q12): part id → product id. */
  locked: Partial<Record<string, string>>;
  /** Architecture Advisor style id (Q2), from `?style=` or chosen on step 3. */
  style?: string;
  /** Free-text notes (step 4), read only by the AI layer (AI_INTEGRATION §3). */
  notes: string;
  /** false: "Don't use AI for this request" (AI_INTEGRATION §9): nothing is sent to /api/explain. */
  useAi: boolean;
}

export const STEPS = [
  { id: 1, title: "Your project", short: "Project" },
  { id: 2, title: "Your team", short: "Team" },
  { id: 3, title: "Budget and rules", short: "Budget" },
  { id: 4, title: "What matters most", short: "Priorities" },
] as const;
export type StepId = (typeof STEPS)[number]["id"];

/** Which questions each step asks, in order. Steps 2 and 4 add skills and priorities below them. */
export const STEP_QUESTIONS: Record<StepId, string[]> = {
  1: ["app-kind", "traffic", "data-shape", "data-flags", "real-time", "seo"],
  2: ["team-size", "experience", "deadline", "lifespan"],
  3: ["budget", "commercial", "hosting-rule", "open-source-only"],
  4: [],
};

export const LEVEL_OPTIONS: { id: Level; label: string }[] = [
  { id: "none", label: "Not needed" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "critical", label: "Critical" },
];

export const SKILL_OPTIONS: { id: SkillLevel; label: string }[] = [
  { id: "none", label: "None" },
  { id: "some", label: "Some" },
  { id: "strong", label: "Strong" },
];

export const emptyForm = (): FormState => ({
  answers: {},
  weights: {},
  skills: {},
  knownFrameworks: [],
  goal: "ship",
  locked: {},
  notes: "",
  useAi: true,
});

export const fromInput = (input: UserInput): FormState => ({
  answers: { ...input.answers },
  weights: { ...input.weights },
  skills: { ...input.skills },
  knownFrameworks: [...(input.knownFrameworks ?? [])],
  goal: input.goal ?? "ship",
  locked: { ...input.locked },
  ...(input.style ? { style: input.style } : {}),
  notes: input.notes ?? "",
  useAi: true,
});

/** The engine input. Empty multi-selects and defaults are left out, so a form and its preset compare equal. */
export function toUserInput(s: FormState): UserInput {
  const answers = Object.fromEntries(
    Object.entries(s.answers).filter(
      (e): e is [string, string | string[]] => e[1] !== undefined && !(Array.isArray(e[1]) && e[1].length === 0),
    ),
  );
  const input: UserInput = { answers };
  if (Object.keys(s.weights).length > 0) input.weights = { ...s.weights };
  if (Object.keys(s.skills).length > 0) input.skills = { ...s.skills };
  if (s.knownFrameworks.length > 0) input.knownFrameworks = [...s.knownFrameworks];
  if (s.goal === "learn") input.goal = "learn";
  const locked = Object.fromEntries(Object.entries(s.locked).filter(([, v]) => v));
  if (Object.keys(locked).length > 0) input.locked = locked;
  if (s.style) input.style = s.style;
  const notes = s.notes.trim();
  if (notes) input.notes = notes.slice(0, MAX_NOTES_LENGTH);
  return input;
}

/**
 * Products a team can say it knows (T3): frontend and backend frameworks that are real packages. Bridges that run on
 * the frontend framework's own server (`frontend-server` requires a frontend pick) are left out: knowing Next.js
 * already covers them.
 */
export const frameworkOptions = (kb: KnowledgeBase) =>
  kb.options.filter(
    (o) =>
      o.level === "product" &&
      (o.part === "frontend" || o.part === "backend") &&
      !o.licence?.notAPackage &&
      !kb.compatibility.some((r) => r.kind === "requires" && r.option === o.id && r.part === "frontend"),
  );

const LEVEL_IDS = new Set<string>(LEVEL_OPTIONS.map((l) => l.id));
const SKILL_IDS = new Set<string>(SKILL_OPTIONS.map((l) => l.id));

/**
 * Keeps only answers the current KB knows. Anything else (an id removed in a KB update, a hand-edited value) is
 * dropped rather than trusted, so a stale save can never crash the form or the engine.
 */
export function sanitiseForm(f: Partial<FormState>, kb: KnowledgeBase): FormState {
  const answers: FormState["answers"] = {};
  for (const [id, v] of Object.entries(f.answers ?? {})) {
    const q = kb.questions.find((x) => x.id === id);
    if (!q) continue;
    if (q.kind === "multi" && Array.isArray(v)) answers[id] = v.filter((x) => q.options.includes(x));
    else if (q.kind === "single" && typeof v === "string" && q.options.includes(v)) answers[id] = v;
  }
  const languages = new Set(kb.options.filter((o) => o.part === "language").map((o) => o.id));
  const frameworks = new Set(frameworkOptions(kb).map((o) => o.id));
  return {
    answers,
    weights: Object.fromEntries(
      Object.entries(f.weights ?? {}).filter(
        ([id, l]) => kb.criteria.some((c) => c.id === id) && typeof l === "string" && LEVEL_IDS.has(l),
      ),
    ) as FormState["weights"],
    skills: Object.fromEntries(
      Object.entries(f.skills ?? {}).filter(
        ([id, l]) => languages.has(id) && typeof l === "string" && SKILL_IDS.has(l),
      ),
    ) as FormState["skills"],
    knownFrameworks: Array.isArray(f.knownFrameworks) ? f.knownFrameworks.filter((x) => frameworks.has(x)) : [],
    goal: f.goal === "learn" ? "learn" : "ship",
    locked: Object.fromEntries(
      Object.entries(f.locked ?? {}).filter(
        ([part, id]) =>
          typeof id === "string" && kb.options.some((o) => o.id === id && o.part === part && o.level === "product"),
      ),
    ),
    ...(typeof f.style === "string" && isStyle(f.style, kb) ? { style: f.style } : {}),
    notes: typeof f.notes === "string" ? f.notes.slice(0, MAX_NOTES_LENGTH) : "",
    useAi: f.useAi !== false,
  };
}

/** True for one of Architecture Advisor's style ids (the KB keeps the list, Q2). */
export const isStyle = (id: string, kb: KnowledgeBase) => kb.meta.architectureStyles.styles.some((s) => s.id === id);

/** Products a part can be locked to, in KB order. */
export const lockOptions = (kb: KnowledgeBase, part: string) =>
  kb.options.filter((o) => o.part === part && o.level === "product");

const STORAGE_KEY = "tech-stack-advisor:form";
const STORAGE_VERSION = 1;

export interface SavedForm {
  form: FormState;
  step: StepId;
  /** The result was on screen: a refresh shows it again (it is recomputed from the answers, never stored). */
  view?: "form" | "result";
  /** The example the answers came from, while they are unchanged. */
  example?: string;
}

export function serialiseForm(saved: SavedForm, kb: KnowledgeBase): string {
  return JSON.stringify({ v: STORAGE_VERSION, kb: kb.meta.kbVersion, ...saved });
}

type SavedFormJson = { v?: number; form?: Partial<FormState>; step?: number; view?: unknown; example?: unknown };

/** Reads saved answers back, cleaned with `sanitiseForm`. */
export function restoreForm(raw: string | null, kb: KnowledgeBase): SavedForm | undefined {
  if (!raw) return undefined;
  try {
    const data = JSON.parse(raw) as SavedFormJson;
    if (data.v !== STORAGE_VERSION || typeof data.form !== "object" || data.form === null) return undefined;
    const step = STEPS.some((s) => s.id === data.step) ? (data.step as StepId) : 1;
    const saved: SavedForm = { form: sanitiseForm(data.form, kb), step };
    if (data.view === "result") saved.view = "result";
    if (typeof data.example === "string") saved.example = data.example;
    return saved;
  } catch {
    return undefined;
  }
}

/**
 * Answers live in session storage: they survive a refresh in the same tab, but a new visit (or a new tab) starts
 * with a blank form, so nobody lands on someone else's half-filled answers (same as the sibling).
 */
export const loadSavedForm = (kb: KnowledgeBase): SavedForm | undefined => {
  try {
    return restoreForm(window.sessionStorage.getItem(STORAGE_KEY), kb);
  } catch {
    return undefined;
  }
};

export const saveForm = (saved: SavedForm, kb: KnowledgeBase) => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, serialiseForm(saved, kb));
  } catch {
    // Storage full or blocked (private mode): answers just won't survive a refresh.
  }
};

export const clearSavedForm = () => {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
};
