import type { Condition, Level } from "@/modules/knowledge-base";

const LEVEL_ORDER: Level[] = ["none", "low", "medium", "high", "critical"];

export interface ConditionContext {
  answers: Record<string, string | string[]>;
  skills: Partial<Record<string, string>>;
  style?: string;
  weights?: Record<string, Level>; // only after floors are applied (rule pass 2)
}

function lookup(path: string, ctx: ConditionContext): string | string[] | undefined {
  const [scope, key = ""] = path.split(".");
  if (scope === "q") return ctx.answers[key] ?? "not-sure";
  if (scope === "skill") return ctx.skills[key] ?? "none";
  if (scope === "weight") {
    if (!ctx.weights) throw new Error(`weight path ${path} used before weights are known`);
    return ctx.weights[key];
  }
  return ctx.style;
}

/** Interprets the tiny rule condition language (eq, in, has, gte, all, any, not). */
export function evaluateCondition(c: Condition, ctx: ConditionContext): boolean {
  if ("eq" in c) return lookup(c.eq[0], ctx) === c.eq[1];
  if ("in" in c) {
    const v = lookup(c.in[0], ctx);
    return typeof v === "string" && c.in[1].includes(v);
  }
  if ("has" in c) {
    const v = lookup(c.has[0], ctx);
    return Array.isArray(v) && v.includes(c.has[1]);
  }
  if ("gte" in c) {
    const v = lookup(c.gte[0], ctx) as Level;
    return LEVEL_ORDER.indexOf(v) >= LEVEL_ORDER.indexOf(c.gte[1] as Level);
  }
  if ("all" in c) return c.all.every((x) => evaluateCondition(x, ctx));
  if ("any" in c) return c.any.some((x) => evaluateCondition(x, ctx));
  return !evaluateCondition(c.not, ctx);
}

export function usesWeights(c: Condition): boolean {
  if ("gte" in c) return c.gte[0].startsWith("weight.");
  if ("eq" in c) return c.eq[0].startsWith("weight.");
  if ("in" in c) return c.in[0].startsWith("weight.");
  if ("has" in c) return false;
  if ("all" in c) return c.all.some(usesWeights);
  if ("any" in c) return c.any.some(usesWeights);
  return usesWeights(c.not);
}

export const maxLevel = (a: Level, b: Level): Level => (LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b);
