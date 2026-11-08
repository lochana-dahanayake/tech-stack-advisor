"use client";

import { useState } from "react";
import { CalendarClockIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { kb, licenceBadge, productCriteria } from "@/modules/knowledge-base";
import type { OptionView, PartView, Recommendation, StackLabel } from "@/modules/recommendation";
import { fitFor } from "@/modules/scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { FitBadge, ScoreBar } from "./fit";
import { criterionName, fmt, LEVEL_LABELS, optionName, partName, signed } from "./format";
import { labelText } from "./labels";

const SHOWN = 5;
const opt = (id: string) => kb.options.find((o) => o.id === id);

function LabelBadge({ label }: { label: StackLabel }) {
  const variant = label.kind === "in-stack" ? "default" : label.kind === "fits" ? "secondary" : "outline";
  return (
    <Badge
      variant={variant}
      className={cn(label.kind !== "in-stack" && label.kind !== "fits" && "text-muted-foreground")}
    >
      {labelText(label)}
    </Badge>
  );
}

/** One option's "why": its share of the score per priority, then rule and skill points, then dated facts. */
function OptionDetails({ o, partId }: { o: OptionView; partId: string }) {
  const option = opt(o.id);
  return (
    <div className="space-y-4 pt-3 text-sm">
      {option?.summary && <p className="text-muted-foreground">{option.summary}</p>}
      {o.why.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-medium">How the base score of {fmt(o.base)} is made</p>
          <ul className="space-y-1.5">
            {o.why.map((w) => (
              <li key={w.criterion} className="grid grid-cols-[1fr_auto_3rem] items-center gap-3">
                <span>
                  {criterionName(w.criterion)} <span className="text-muted-foreground">({LEVEL_LABELS[w.level]})</span>
                </span>
                <span className="text-muted-foreground tabular-nums" aria-label={`${w.value} out of 5`}>
                  {"●".repeat(w.value)}
                  <span className="opacity-25">{"●".repeat(5 - w.value)}</span>
                </span>
                <span className="text-right tabular-nums">+{fmt(w.points)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {o.adjustments.length > 0 && (
        <ul className="space-y-1.5">
          {o.adjustments.map((a, i) => (
            <li key={i} className="flex gap-3">
              <span className={cn("w-10 shrink-0 font-medium tabular-nums", a.points < 0 && "text-destructive")}>
                {signed(a.points)}
              </span>
              <span>
                {a.text}
                {a.id && <span className="text-muted-foreground"> (rule {a.id})</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {o.cand !== o.final && (
        <p className="text-muted-foreground">
          Ranked at {fmt(o.cand)} rather than {fmt(o.final)}: its approach scores {fmt(o.final - o.cand)} points below
          the {partName(partId).toLowerCase()} approach that fits you best.
        </p>
      )}
      {(option?.licence || o.facts.length > 0) && (
        <ul className="space-y-1 text-muted-foreground">
          {option?.licence && !option.licence.notAPackage && (
            <li>
              Licence: {option.licence.spdx} ({licenceBadge(option)})
            </li>
          )}
          {o.facts.map((f) => (
            <li key={f.id}>
              {f.text} <CheckedOn date={f.checked} stale={f.stale} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CheckedOn({ date, stale }: { date: string; stale?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs whitespace-nowrap", stale && "text-warning")}>
      <CalendarClockIcon className="size-3" aria-hidden />
      checked {date}
      {stale && " (due for a re-check)"}
    </span>
  );
}

function RankedOptions({ part }: { part: PartView }) {
  const [all, setAll] = useState(false);
  const shown = all ? part.options : part.options.slice(0, SHOWN);
  return (
    <div className="space-y-2">
      <ol className="divide-y rounded-xl border bg-card">
        {shown.map((o) => (
          <li key={o.id}>
            <details className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none flex-col gap-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <ChevronRightIcon
                      className="size-4 text-muted-foreground transition-transform group-open:rotate-90"
                      aria-hidden
                    />
                    <span className="w-5 text-sm text-muted-foreground tabular-nums">{o.rank}.</span>
                    <span className={cn("font-medium", o.label.kind === "in-stack" && "text-primary")}>
                      {optionName(o.id)}
                    </span>
                    <LabelBadge label={o.label} />
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">{fmt(o.cand)}</span>
                </span>
                <ScoreBar value={o.cand} fit={fitFor(o.cand)} className="ml-13" />
              </summary>
              <div className="ml-13">
                <OptionDetails o={o} partId={part.partId} />
              </div>
            </details>
          </li>
        ))}
      </ol>
      {part.options.length > SHOWN && (
        <Button variant="ghost" size="sm" onClick={() => setAll((a) => !a)} aria-expanded={all}>
          <ChevronDownIcon className={cn("transition-transform", all && "rotate-180")} aria-hidden />
          {all ? "Show fewer" : `Show all ${part.options.length}`}
        </Button>
      )}
    </div>
  );
}

/** The top three side by side on the priorities that count most, with licences and dated facts. */
function Comparison({ part, rec }: { part: PartView; rec: Recommendation }) {
  const cols = part.options.slice(0, 3);
  if (cols.length < 2) return null;
  const criteria = rec.topCriteria.filter((c) => opt(cols[0]!.id)?.scores[c]);
  // Your priorities at Medium or above first; topped up with the part's other criteria so there's always a comparison.
  const others = productCriteria(kb, part.partId).filter((c) => !criteria.includes(c));
  const rows = [...criteria, ...others].slice(0, Math.max(criteria.length, 5));
  const hosting = part.partId === "hosting";
  return (
    <Table>
      <caption className="mt-2 text-left text-xs text-muted-foreground">
        Scores 1–5 from the knowledge base, each with a source. Your priorities at Medium or above come first.
      </caption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-48">
            <span className="sr-only">Criterion</span>
          </TableHead>
          {cols.map((o) => (
            <TableHead key={o.id} scope="col">
              {optionName(o.id)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((c) => {
          const best = Math.max(...cols.map((o) => opt(o.id)?.scores[c]?.value ?? 0));
          return (
            <TableRow key={c}>
              <TableHead scope="row" className="font-normal text-muted-foreground">
                {criterionName(c)}
              </TableHead>
              {cols.map((o) => {
                const v = opt(o.id)?.scores[c]?.value;
                return (
                  <TableCell key={o.id} className={cn("tabular-nums", v === best && "font-semibold")}>
                    {v ?? "–"} / 5
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
        <TableRow>
          <TableHead scope="row" className="font-normal text-muted-foreground">
            Licence
          </TableHead>
          {cols.map((o) => {
            const option = opt(o.id);
            return (
              <TableCell key={o.id} className="whitespace-normal">
                {option?.licence && !option.licence.notAPackage
                  ? `${option.licence.spdx} (${licenceBadge(option)})`
                  : "–"}
              </TableCell>
            );
          })}
        </TableRow>
        {hosting && (
          <TableRow>
            <TableHead scope="row" className="font-normal text-muted-foreground">
              Free tier
            </TableHead>
            {cols.map((o) => {
              const tier = opt(o.id)?.freeTier;
              return (
                <TableCell key={o.id} className="min-w-48 align-top whitespace-normal">
                  {tier ? (
                    <span className="space-y-1">
                      <span className="block">{tier.summary}</span>
                      <CheckedOn date={tier.checked} />
                    </span>
                  ) : (
                    "None"
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        )}
        <TableRow>
          <TableHead scope="row" className="font-normal text-muted-foreground">
            Scores checked
          </TableHead>
          {cols.map((o) => (
            <TableCell key={o.id}>
              <CheckedOn date={o.scoresChecked} />
            </TableCell>
          ))}
        </TableRow>
      </TableBody>
    </Table>
  );
}

function groupByReason(items: { id: string; reason: string }[]): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const e of items) groups.set(e.reason, [...(groups.get(e.reason) ?? []), e.id]);
  return [...groups];
}

export function PartSection({ part, rec }: { part: PartView; rec: Recommendation }) {
  const headingId = `part-${part.partId}`;
  const pick = part.options.find((o) => o.label.kind === "in-stack");
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id={headingId} className="text-xl font-semibold tracking-tight">
            {partName(part.partId)}
          </h2>
          {part.chosenType && (
            <p className="text-sm text-muted-foreground">
              Best approach: <span className="font-medium text-foreground">{optionName(part.chosenType)}</span>{" "}
              <span className="tabular-nums">({fmt(part.types[0]?.final ?? 0)})</span>
              {part.typeCloseCall && (
                <>
                  {" "}
                  · close call with {optionName(part.typeCloseCall)}{" "}
                  <span className="tabular-nums">
                    ({fmt(part.types.find((t) => t.id === part.typeCloseCall)?.final ?? 0)})
                  </span>
                </>
              )}
            </p>
          )}
        </div>
        {pick && <FitBadge fit={fitFor(pick.cand)} />}
      </div>
      <RankedOptions part={part} />
      <details className="group rounded-xl border bg-card px-4 py-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
          <ChevronRightIcon className="size-4 transition-transform group-open:rotate-90" aria-hidden />
          Compare the top {Math.min(3, part.options.length)}
        </summary>
        <div className="pt-3">
          <Comparison part={part} rec={rec} />
        </div>
      </details>
      {part.excluded.length > 0 && (
        <div className="space-y-1.5 text-sm">
          <p className="font-medium">Ruled out</p>
          <ul className="space-y-1.5 text-muted-foreground">
            {groupByReason(part.excluded).map(([reason, ids]) => (
              <li key={reason}>
                <span className="text-foreground">{ids.map(optionName).join(", ")}</span>: {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
