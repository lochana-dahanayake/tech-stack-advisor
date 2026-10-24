import { z } from "zod";

// Zod schemas for the knowledge base (docs/KNOWLEDGE_BASE_SCHEMA.md). Shape only; cross-file checks are in integrity.ts.

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "ids are lowercase kebab-case");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dates are YYYY-MM-DD");
export const levelSchema = z.enum(["none", "low", "medium", "high", "critical"]);
export const skillLevelSchema = z.enum(["none", "some", "strong"]);

export const sourceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("book"), ref: id, locator: z.string().optional() }),
  // quality: P = primary source read directly, S = secondary only (docs/RESEARCH.md).
  z.object({ kind: z.literal("ref"), ref: id, quality: z.enum(["P", "S"]), note: z.string().optional() }),
  z.object({ kind: z.literal("general"), note: z.string().optional(), reviewed: z.boolean() }),
  z.object({ kind: z.literal("design"), note: z.string(), reviewed: z.boolean() }),
]);

const scoreValue = z.number().int().min(1).max(5);

export const scoreEntrySchema = z
  .object({
    value: scoreValue,
    why: z.string().min(1),
    sources: z.array(sourceSchema).min(1),
    checked: date,
    // A score whose evidence is missing is held at the neutral 3 until it is sourced; `proposed` keeps the draft value.
    unsourced: z.literal(true).optional(),
    proposed: scoreValue.optional(),
  })
  .refine((s) => !s.unsourced || (s.value === 3 && s.proposed !== undefined), {
    message: "an unsourced score must be 3 and keep its proposed value",
  })
  .refine((s) => s.proposed === undefined || s.unsourced === true, { message: "`proposed` only on unsourced scores" });

export const factSchema = z.object({
  id,
  kind: z.enum(["version", "support", "licence", "ownership", "pricing", "release-status", "usage"]),
  text: z.string().min(1),
  checked: date,
  until: date.optional(),
  status: z.enum(["beta", "ga"]).optional(),
  sources: z.array(sourceSchema).min(1),
});

export const partSchema = z.object({
  id,
  name: z.string(),
  levels: z.array(z.enum(["type", "product"])).min(1),
  typeCriteria: z.array(id).optional(),
});

export const criterionSchema = z.object({
  id,
  name: z.string(),
  short: z.string(),
  appliesTo: z.array(id).min(1),
  visibility: z.enum(["default", "advanced"]),
});

export const optionSchema = z.object({
  id,
  part: id,
  level: z.enum(["type", "product"]),
  types: z.array(id).optional(),
  name: z.string(),
  summary: z.string(),
  status: z.enum(["active", "maintenance", "deprecated"]),
  none: z.literal(true).optional(),
  // osi = an OSI-approved licence; publicDomain = no licence restrictions at all (SQLite), which OSI does not list.
  licence: z
    .object({
      spdx: z.string(),
      osi: z.boolean(),
      publicDomain: z.literal(true).optional(),
      sources: z.array(sourceSchema).min(1),
    })
    .optional(),
  scores: z.record(id, scoreEntrySchema),
  facts: z.array(factSchema),
  // Type-win coverage exemption (TESTING_STRATEGY §3): only with a written reason.
  coverageExempt: z.object({ reason: z.string().min(1), sources: z.array(sourceSchema).min(1) }).optional(),
});

export type Condition =
  | { eq: [string, string] }
  | { in: [string, string[]] }
  | { has: [string, string] }
  | { gte: [string, string] }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ eq: z.tuple([z.string(), z.string()]) }).strict(),
    z.object({ in: z.tuple([z.string(), z.array(z.string()).min(1)]) }).strict(),
    z.object({ has: z.tuple([z.string(), z.string()]) }).strict(),
    z.object({ gte: z.tuple([z.string(), levelSchema]) }).strict(),
    z.object({ all: z.array(conditionSchema).min(1) }).strict(),
    z.object({ any: z.array(conditionSchema).min(1) }).strict(),
    z.object({ not: conditionSchema }).strict(),
  ]),
);

export const effectSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("modify"), target: id, points: z.number().int().min(-30).max(30) }),
  z.object({ type: z.literal("exclude"), target: id }),
  z.object({ type: z.literal("floor"), criterion: id, level: levelSchema }),
  z.object({ type: z.literal("not-needed"), part: id }),
  z.object({ type: z.literal("note"), text: z.string().min(1) }),
]);

export const ruleSchema = z.object({
  id: z.string().regex(/^[SDBKAN]\d+[a-z]?$/),
  name: z.string(),
  when: conditionSchema,
  effects: z.array(effectSchema).min(1),
  explanation: z.string().min(1),
  otherwise: z.array(effectSchema).optional(),
  otherwiseExplanation: z.string().optional(),
  sources: z.array(sourceSchema).min(1),
});

export const questionSchema = z.object({
  id,
  text: z.string(),
  kind: z.enum(["single", "multi"]),
  options: z.array(id).min(2),
});

export const skillRuleSchema = z.object({
  id: z.string().regex(/^T\d+$/),
  name: z.string(),
  // T1/T2: a language at this skill level (the language +languagePoints, products requiring it +productPoints).
  // T3: a framework the team knows. T4: tight deadline, a language nobody knows while the team knows another.
  // T5: goal "learn" multiplies every skill effect by `factor` and adds a floor.
  when: z.union([
    z.object({ skill: skillLevelSchema }).strict(),
    z.object({ knownFramework: z.literal(true) }).strict(),
    z
      .object({
        deadline: z.array(z.string()).min(1),
        languageSkill: z.literal("none"),
        teamKnowsALanguage: z.literal(true),
      })
      .strict(),
    z.object({ goal: z.literal("learn") }).strict(),
    // T6 (hard rule): with goal "ship", a language the team knows at "strong" never loses to one nobody knows.
    z.object({ protectStrong: z.literal(true) }).strict(),
  ]),
  productPoints: z.number().int(),
  languagePoints: z.number().int(),
  factor: z.number().positive().optional(),
  floor: z.object({ criterion: id, level: levelSchema }).optional(),
  sources: z.array(sourceSchema).min(1),
});

export const relationSchema = z.object({
  id: z.string(),
  kind: z.literal("requires"),
  option: id,
  part: id,
  anyOf: z.array(id).min(1),
  explanation: z.string(),
  sources: z.array(sourceSchema).min(1),
});

export const metaSchema = z.object({
  kbVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  scale: z.object({ min: z.literal(1), max: z.literal(5) }),
  levels: z.object({ none: z.number(), low: z.number(), medium: z.number(), high: z.number(), critical: z.number() }),
  caps: z.object({
    rules: z.number(),
    skillsMin: z.number(),
    skillsMax: z.number(),
    stackPairBonus: z.number(),
    ai: z.number(),
  }),
  closeCallPoints: z.number(),
  staleAfterDays: z.record(z.string(), z.number().int().positive()),
});

export const knowledgeBaseSchema = z.object({
  meta: metaSchema,
  parts: z.array(partSchema),
  criteria: z.array(criterionSchema),
  options: z.array(optionSchema),
  questions: z.array(questionSchema),
  rules: z.array(ruleSchema),
  skills: z.array(skillRuleSchema),
  compatibility: z.array(relationSchema),
});

export type Source = z.infer<typeof sourceSchema>;
export type ScoreEntry = z.infer<typeof scoreEntrySchema>;
export type Fact = z.infer<typeof factSchema>;
export type Part = z.infer<typeof partSchema>;
export type Criterion = z.infer<typeof criterionSchema>;
export type Option = z.infer<typeof optionSchema>;
export type Effect = z.infer<typeof effectSchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type Question = z.infer<typeof questionSchema>;
export type SkillRule = z.infer<typeof skillRuleSchema>;
export type Relation = z.infer<typeof relationSchema>;
export type Meta = z.infer<typeof metaSchema>;
export type Level = z.infer<typeof levelSchema>;
export type SkillLevel = z.infer<typeof skillLevelSchema>;
export type KnowledgeBase = z.infer<typeof knowledgeBaseSchema>;
