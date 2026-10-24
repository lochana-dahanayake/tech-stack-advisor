import type { Condition, Level } from "@/modules/knowledge-base";

const LEVEL_ORDER: Level[] = ["none", "low", "medium", "high", "critical"];

export interface ConditionContext {
  answers: Record<string, string | string[]>;
  skills: Partial<Record<string, string>>;
  style?: string;
  weights?: Record<string, Level>; // only after floors are applied (rule pass 2)
  partState?: Record<string, "needed" | "not-needed">; // only after pass 1
}

function lookup(path: string, ctx: ConditionContext): string | string[] | undefined {
  const [scope, key = ""] = path.split(".");
  if (scope === "q") return ctx.answers[key] ?? "not-sure";
  if (scope === "skill") return ctx.skills[key] ?? "none";
  if (scope === "weight") {
    if (!ctx.weights) throw new Error(`weight path ${path} used before weights are known`);
    return ctx.weights[key];
  }
  if (scope === "part") {
    if (!ctx.partState) throw new Error(`part path ${path} used before parts are known`);
    return ctx.partState[key] ?? "needed";
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

const derived = (path: string) => path.startsWith("weight.") || path.startsWith("part.");

/** True when a condition reads something only known after pass 1: effective weights or which parts are needed. */
export function usesDerived(c: Condition): boolean {
  if ("gte" in c) return derived(c.gte[0]);
  if ("eq" in c) return derived(c.eq[0]);
  if ("in" in c) return derived(c.in[0]);
  if ("has" in c) return false;
  if ("all" in c) return c.all.some(usesDerived);
  if ("any" in c) return c.any.some(usesDerived);
  return usesDerived(c.not);
}

export const maxLevel = (a: Level, b: Level): Level => (LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b);
