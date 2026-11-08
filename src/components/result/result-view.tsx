"use client";

import { useEffect, useRef } from "react";
import {
  ArrowRightLeftIcon,
  ChevronRightIcon,
  CircleSlashIcon,
  CompassIcon,
  InfoIcon,
  PencilIcon,
  RotateCcwIcon,
  ScaleIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import type { Recommendation } from "@/modules/recommendation";
import { fitFor } from "@/modules/scoring";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { FitBadge } from "./fit";
import { criterionName, fmt, LEVEL_LABELS, optionName, PART_ORDER, partName } from "./format";
import { PartSection } from "./part-section";
import { Section } from "./section";

const FIT_STROKE = {
  strong: "stroke-fit-strong",
  good: "stroke-fit-good",
  possible: "stroke-fit-possible",
  weak: "stroke-fit-weak",
} as const;

/** The stack score as a ring in its fit colour, with the number in the middle (sibling's verdict card). */
export function ScoreDial({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-28 shrink-0" role="img" aria-label={`Stack score ${fmt(score)} out of 100`}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-muted" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, score)) / 100)}
          className={FIT_STROKE[fitFor(score)]}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="text-2xl font-semibold tabular-nums">{fmt(score)}</span>
        <span className="text-xs text-muted-foreground">stack score</span>
      </span>
    </div>
  );
}

/** One tile per part in the verdict card: the pick and its approach, or why the part isn't needed. */
function PickTiles({ rec }: { rec: Recommendation }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {rec.parts.map((p) => {
        const pick = p.options.find((o) => o.label.kind === "in-stack");
        return (
          <li
            key={p.partId}
            className={cn(
              "flex flex-col gap-1 rounded-xl border bg-background/70 px-4 py-3",
              !p.needed && "border-dashed bg-transparent",
            )}
          >
            <span className="text-xs font-medium text-muted-foreground">{partName(p.partId, true)}</span>
            {p.needed && pick ? (
              <>
                <a href={`#part-${p.partId}`} className="font-semibold leading-tight hover:underline">
                  {optionName(pick.id)}
                </a>
                <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{p.chosenType ? optionName(p.chosenType) : " "}</span>
                  <span className="tabular-nums">{fmt(pick.cand)}</span>
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold leading-tight text-muted-foreground">Not needed</span>
                <span className="text-xs text-muted-foreground">{p.notNeeded?.text}</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Close calls, picks moved by the stack, raised priorities and notes: everything to read before deciding. */
function ThingsToKnow({ rec }: { rec: Recommendation }) {
  const items: { icon: typeof InfoIcon; tone: "info" | "warning"; title: string; body: React.ReactNode }[] = [];
  for (const cc of rec.closeCalls) {
    const alt = PART_ORDER.filter((p) => cc.picks[p] && cc.picks[p] !== rec.score.stack.picks[p]);
    items.push({
      icon: ScaleIcon,
      tone: "info",
      title: `Close call: ${alt.map((p) => optionName(cc.picks[p]!)).join(" + ")}`,
      body: (
        <>
          A stack with {alt.map((p) => optionName(cc.picks[p]!)).join(" and ")} scores {fmt(cc.score)}, only{" "}
          {fmt(cc.gap)} {Math.round(cc.gap) === 1 ? "point" : "points"} behind. {optionName(cc.best)} is the best{" "}
          {partName(cc.partId, true).toLowerCase()} on its own, so it&apos;s worth a look.
        </>
      ),
    });
  }
  for (const a of rec.adjusted)
    items.push({
      icon: ArrowRightLeftIcon,
      tone: "info",
      title: `${optionName(a.pick)} instead of ${optionName(a.best)} (${partName(a.partId, true).toLowerCase()})`,
      body: (
        <>
          {optionName(a.best)} ranks first on its own, but the stack needs {optionName(a.pick)}: {a.reason}
        </>
      ),
    });
  for (const t of rec.ties)
    items.push({
      icon: ScaleIcon,
      tone: "info",
      title: `A tie: ${t.options.map(optionName).join(" and ")}`,
      body: (
        <>
          They score the same. {optionName(t.pick)} is picked by{" "}
          {t.reason === "stack score"
            ? "the stack it makes"
            : t.reason === "sum of final"
              ? "the stack's total score"
              : "the knowledge base's order"}
          .
        </>
      ),
    });
  for (const r of rec.raised)
    items.push({
      icon: InfoIcon,
      tone: "info",
      title: `${criterionName(r.criterion)} counted as ${LEVEL_LABELS[r.used]}, not ${LEVEL_LABELS[r.chosen]}`,
      body: r.reason,
    });
  for (const n of rec.notes)
    items.push({
      icon: TriangleAlertIcon,
      tone: "warning",
      title: n.points ? `Note (${n.points} points)` : "Note",
      body: n.text,
    });
  if (items.length === 0) return null;
  return (
    <Section id="know-heading" title="Things to know" description="Read these before you decide.">
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((it, i) => (
          <li
            key={i}
            className={cn(
              "flex gap-3 rounded-xl border p-4 text-sm",
              it.tone === "warning" ? "bg-warning-muted" : "bg-card",
            )}
          >
            <it.icon
              className={cn("mt-0.5 size-4 shrink-0", it.tone === "warning" ? "text-warning" : "text-info")}
              aria-hidden
            />
            <span className="space-y-1">
              <span className="block font-medium">{it.title}</span>
              <span className="block text-muted-foreground">{it.body}</span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RulesApplied({ rec }: { rec: Recommendation }) {
  const fired = rec.score.firedRules;
  return (
    <Collapsible>
      <CollapsibleTrigger className="group flex items-center gap-1 text-lg font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <ChevronRightIcon className="size-5 transition-transform group-data-[state=open]:rotate-90" aria-hidden />
        How this was worked out
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-6 pt-3 text-sm">
        <p className="max-w-prose text-muted-foreground">
          Each option has 1–5 scores per criterion from the knowledge base (v{rec.kbVersion}), each with a source. Your
          priorities weight them into a base score out of 100; the rules below add or remove points (at most{" "}
          {kb.meta.caps.rules}), and team skills add up to {kb.meta.caps.skillsMax}. Approaches are ranked first, then
          the products, and finally the best combination that works together is picked. Same answers, same result.
        </p>
        <div className="space-y-2">
          <h3 className="font-medium">Rules that applied ({fired.length})</h3>
          <ul className="space-y-1.5">
            {fired.map((f) => (
              <li key={`${f.id}-${f.branch}`} className="flex gap-3">
                <span className="w-10 shrink-0 font-mono text-xs text-muted-foreground">{f.id}</span>
                <span>{f.explanation}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h3 className="font-medium">Weights used</h3>
          <ul className="flex flex-wrap gap-1.5">
            {kb.criteria.map((c) => (
              <li key={c.id} className="rounded-full border px-2.5 py-0.5 text-xs">
                {c.name}: <span className="font-medium">{LEVEL_LABELS[rec.score.effectiveWeights[c.id] ?? "low"]}</span>
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ResultView({
  rec,
  example,
  onEdit,
  onStartOver,
  actions,
}: {
  rec: Recommendation;
  /** Set when this result is one of the home page's examples. */
  example?: string;
  onEdit: () => void;
  onStartOver: () => void;
  /** Extra header actions (share and save). */
  actions?: React.ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const needed = rec.parts.filter((p) => p.needed);
  const notNeeded = rec.parts.filter((p) => !p.needed);
  const summary = needed
    .map((p) => p.options.find((o) => o.label.kind === "in-stack")?.id)
    .filter((x): x is string => !!x)
    .map(optionName);

  return (
    <article aria-labelledby="result-heading" className="space-y-12">
      {example && (
        <Alert variant="info" className="no-print">
          <CompassIcon aria-hidden />
          <AlertTitle>Example: {example}</AlertTitle>
          <AlertDescription>
            <p>This result comes from ready-made answers. Change them to fit your project, or start from scratch.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={onStartOver}>
                Start my own
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                Edit these answers
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <header className="space-y-6 rounded-2xl border bg-gradient-to-br from-brand-muted via-card to-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Your recommended stack</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1
                id="result-heading"
                ref={headingRef}
                tabIndex={-1}
                className="text-3xl font-semibold tracking-tight text-balance outline-none sm:text-4xl"
              >
                {summary.join(" + ")}
              </h1>
              <FitBadge fit={rec.fit} className="bg-background/60" />
            </div>
            <p className="max-w-prose text-muted-foreground">
              The best-scoring combination that works together for your answers
              {notNeeded.length > 0 &&
                `; no ${notNeeded.map((p) => partName(p.partId, true).toLowerCase()).join(" or ")} needed`}
              . Every part&apos;s full ranking and the reasons are below.
            </p>
          </div>
          <ScoreDial score={rec.stackScore} />
        </div>
        <PickTiles rec={rec} />
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="outline" onClick={onEdit}>
            <PencilIcon aria-hidden /> Edit answers
          </Button>
          <Button variant="outline" onClick={onStartOver}>
            <RotateCcwIcon aria-hidden /> Start over
          </Button>
          {actions}
        </div>
      </header>

      <ThingsToKnow rec={rec} />

      <div className="space-y-12">
        {needed.map((p) => (
          <PartSection key={p.partId} part={p} rec={rec} />
        ))}
      </div>

      {notNeeded.length > 0 && (
        <Section id="not-needed-heading" title="Not needed for this project">
          <ul className="space-y-2 text-sm">
            {notNeeded.map((p) => (
              <li key={p.partId} className="flex gap-3">
                <CircleSlashIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  <span className="font-medium">{partName(p.partId)}: </span>
                  <span className="text-muted-foreground">{p.notNeeded?.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <RulesApplied rec={rec} />
    </article>
  );
}
