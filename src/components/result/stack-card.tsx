import type { ScoreResult } from "@/modules/scoring";
import { fitFor } from "@/modules/scoring";
import { cn } from "@/lib/utils";
import { FitBadge, ScoreBar } from "./fit";
import { fmt, optionName, PART_ORDER, partName } from "./format";

/** One row per part in display order: the stack's pick and its score, or "not needed". */
export function stackRows(result: ScoreResult) {
  return PART_ORDER.flatMap((partId) => {
    const part = result.parts[partId];
    if (!part) return [];
    const pick = result.stack.picks[partId];
    const product = part.products.find((p) => p.id === pick);
    // cand: the score the part is ranked by (SCORING_ENGINE step 5); the stack score is their mean.
    return [{ partId, needed: part.needed, pick, final: product?.cand }];
  });
}

/**
 * The stack in one card: the pick for each part with its score bar, the stack score and its fit label.
 * Used by the landing preview, the form's live panel and the result page.
 */
export function StackCard({
  result,
  label,
  footer,
  compact = false,
  className,
}: {
  result: ScoreResult;
  label: React.ReactNode;
  footer?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const rows = stackRows(result);
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <p className="text-right">
          <span className="block text-2xl leading-none font-semibold tabular-nums">{fmt(result.stack.score)}</span>
          <span className="text-xs text-muted-foreground">stack score</span>
        </p>
      </div>
      <ul aria-label="Stack picks" className={cn("mt-4", compact ? "space-y-2.5" : "space-y-3")}>
        {rows.map((r) => (
          <li key={r.partId} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="w-24 shrink-0 text-muted-foreground">{partName(r.partId, true)}</span>
              {r.needed && r.pick ? (
                <>
                  <span className="flex-1 font-medium">{optionName(r.pick)}</span>
                  <span className="text-muted-foreground tabular-nums">{fmt(r.final ?? 0)}</span>
                </>
              ) : (
                <span className="flex-1 text-muted-foreground italic">Not needed</span>
              )}
            </div>
            {r.needed && r.final !== undefined ? (
              <ScoreBar value={r.final} fit={fitFor(r.final)} />
            ) : (
              <span className="block h-2 rounded-full border border-dashed" aria-hidden />
            )}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
        <FitBadge fit={fitFor(result.stack.score)} />
        {footer}
      </div>
    </div>
  );
}
