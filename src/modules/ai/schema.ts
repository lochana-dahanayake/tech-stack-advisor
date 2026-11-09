import { z } from "zod";

/** Ids the AI may use in one request, built per request from the rule result (AI_INTEGRATION §4). */
export interface SchemaIds {
  /** Products the AI may adjust: the top 5 of each part in the stack, locked parts left out. */
  adjustable: string[];
  /** Parts in the stack, display order. */
  parts: string[];
  /** Every product the stack explanation may name (the ranked products of those parts). */
  options: string[];
}

const oneOf = (ids: string[]) => z.enum(ids as [string, ...string[]]);
// An enum needs at least one value; with none, any string passes here and the checks after the schema reject it.
const idFrom = (ids: string[]) => (ids.length > 0 ? oneOf(ids) : z.string());

/**
 * The response schema for one request (AI_INTEGRATION §4). Adjustable ids are an enum of the top 5 per part, so the
 * AI can't name an excluded, unknown or lower-ranked option. Unknown keys are stripped.
 */
export function responseSchema({ adjustable, parts, options }: SchemaIds) {
  return z.object({
    adjustments: z
      .array(
        z.object({
          optionId: idFrom(adjustable),
          delta: z
            .number()
            .int()
            .min(-5)
            .max(5)
            .refine((d) => d !== 0, "delta must not be 0"),
          reason: z.string().min(10).max(240),
          basis: z.enum(["notes", "inputs"]),
        }),
      )
      .max(adjustable.length > 0 ? 3 : 0)
      .refine((a) => new Set(a.map((x) => x.optionId)).size === a.length, "each option may be adjusted once"),
    explanation: z.object({
      summary: z.string().min(1).max(700),
      stack: z
        .array(z.object({ partId: idFrom(parts), optionId: idFrom(options), why: z.string().min(1).max(400) }))
        .max(parts.length),
      cautions: z.array(z.string().max(240)).max(3),
      notesUsed: z.array(z.string().max(160)).max(3),
    }),
  });
}

export type AiResponse = z.infer<ReturnType<typeof responseSchema>>;

/** The same schema as JSON Schema, sent to providers that support structured output. */
export function responseJsonSchema(ids: SchemaIds): Record<string, unknown> {
  return z.toJSONSchema(responseSchema(ids), { unrepresentable: "any" }) as Record<string, unknown>;
}
