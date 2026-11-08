import type { Fit } from "@/modules/scoring";
import { cn } from "@/lib/utils";
import { FIT_LABELS } from "./format";

/** Fit colour classes (globals.css `--fit-*`). Colour is never the only signal: the label is always shown too. */
export const FIT_BG: Record<Fit, string> = {
  strong: "bg-fit-strong",
  good: "bg-fit-good",
  possible: "bg-fit-possible",
  weak: "bg-fit-weak",
};

/** "● Good fit": a coloured dot plus the fit label. */
export function FitBadge({ fit, className }: { fit: Fit; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", FIT_BG[fit])} aria-hidden />
      {FIT_LABELS[fit]}
    </span>
  );
}

/** A thin 0–100 bar in the fit colour of the score. Decorative: the number is always printed next to it. */
export function ScoreBar({ value, fit, className }: { value: number; fit: Fit; className?: string }) {
  return (
    <span className={cn("block h-2 rounded-full bg-muted", className)} aria-hidden>
      <span
        className={cn("block h-2 rounded-full", FIT_BG[fit])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  );
}
