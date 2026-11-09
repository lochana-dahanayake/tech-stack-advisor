"use client";

import { InfoIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import type { AiBlock } from "@/modules/recommendation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { optionName, partName, signed } from "./format";
import { Section } from "./section";

const MESSAGES: Partial<Record<AiBlock["status"], { title: string; body: string; retry?: boolean }>> = {
  disabled: {
    title: "AI explanation not enabled yet",
    body: "This version gives rule-based results only. The stack, rankings and reasons on this page are complete and come from our rule engine.",
  },
  skipped: {
    title: "AI turned off for this request",
    body: "You chose not to use AI, so nothing was sent anywhere. The stack on this page comes from our rule engine and is complete.",
  },
  unavailable: {
    title: "The AI explanation isn't available right now",
    body: "The stack and rankings on this page come from our rule engine and are complete.",
    retry: true,
  },
  rate_limited: {
    title: "You've reached the AI limit for now",
    body: "Rule-based results still work. Try the AI explanation again later.",
  },
};

/** "glossary:supabase" / "option:mongodb" → the KB's name for it. */
const mentionName = (key: string) => {
  const [kind, id = ""] = key.split(":");
  return kind === "glossary" ? (kb.glossary.find((g) => g.id === id)?.name ?? id) : optionName(id);
};

/** One short line for screen readers when the AI part settles. */
export function aiAnnouncement(ai: AiBlock): string {
  return MESSAGES[ai.status]?.title ?? (ai.explanation ? "AI explanation ready." : "");
}

/** A part whose pick the AI's adjustments changed: what the rule engine picked and what the stack uses now. */
export interface AiStackChange {
  partId: string;
  before: string;
  after: string;
}

/**
 * "In plain words (AI)". Every non-ok state is neutral (never red): the rule result is always complete. AI text is
 * rendered as plain text only.
 */
export function AiPanel({
  ai,
  pending,
  changes,
  onRetry,
}: {
  ai?: AiBlock;
  pending: boolean;
  /** Set when the adjustments changed the stack (the server re-ran assembly). */
  changes: AiStackChange[];
  onRetry: () => void;
}) {
  return (
    <Section
      id="ai-heading"
      title="In plain words (AI)"
      description="An optional explanation written by an AI from our rule engine's result."
    >
      <AiBody ai={ai} pending={pending} changes={changes} onRetry={onRetry} />
    </Section>
  );
}

function AiBody({
  ai,
  pending,
  changes,
  onRetry,
}: {
  ai?: AiBlock;
  pending: boolean;
  changes: AiStackChange[];
  onRetry: () => void;
}) {
  if (pending || !ai)
    return (
      <div role="status" className="space-y-3 rounded-xl border bg-card p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <SparklesIcon className="size-4" aria-hidden /> Writing an explanation… (usually 3–10 seconds)
        </p>
        {[100, 92, 80].map((w) => (
          <div key={w} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
        ))}
      </div>
    );
  const message = MESSAGES[ai.status];
  if (message)
    return (
      <Alert variant="info">
        <InfoIcon aria-hidden />
        <AlertTitle>{message.title}</AlertTitle>
        <AlertDescription>
          <p>{message.body}</p>
          {message.retry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="no-print mt-2">
              <RefreshCwIcon aria-hidden /> Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  const e = ai.explanation;
  if (!e) return null;
  return (
    <div className="space-y-5 rounded-xl border bg-card p-4 text-sm sm:p-6">
      {changes.length > 0 && (
        <Alert variant="info">
          <SparklesIcon aria-hidden />
          <AlertTitle>AI changed the stack</AlertTitle>
          <AlertDescription>
            {changes.map((c) => (
              <p key={c.partId}>
                Our rule engine picked {optionName(c.before)} for the {partName(c.partId, true).toLowerCase()}; after
                the AI&apos;s small adjustment the stack uses {optionName(c.after)}. The stack is still put together by
                the rule engine, with the same compatibility rules.
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}
      <p className="text-base">{e.summary}</p>
      <ul className="space-y-2">
        {e.stack.map((s) => (
          <li key={s.partId}>
            <span className="font-medium">
              {partName(s.partId, true)}: {optionName(s.optionId)}.{" "}
            </span>
            <span className="text-muted-foreground">{s.why}</span>
          </li>
        ))}
      </ul>
      {e.cautions.length > 0 && (
        <div className="space-y-1">
          <h3 className="font-medium">Watch out for</h3>
          <ul className="list-disc space-y-1 pl-5">
            {e.cautions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {ai.adjustments.length > 0 && (
        <div className="space-y-1">
          <h3 className="font-medium">Score adjustments by the AI (at most ±5 points each)</h3>
          <ul className="space-y-1">
            {ai.adjustments.map((a) => (
              <li key={a.optionId} className="flex gap-3">
                <span className="w-10 shrink-0 font-medium tabular-nums">{signed(a.delta)}</span>
                <span>
                  <span className="font-medium">{optionName(a.optionId)}: </span>
                  {a.reason}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {e.mentions.length > 0 && (
        <div className="space-y-1">
          <h3 className="font-medium">About what you mentioned</h3>
          <ul className="space-y-1">
            {e.mentions.map((m) => (
              <li key={m.id}>
                <span className="font-medium">{mentionName(m.id)}: </span>
                <span className="text-muted-foreground">{m.answer}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {e.notesUsed.length > 0 && <p className="text-muted-foreground">From your notes: {e.notesUsed.join("; ")}</p>}
      <p className="text-xs text-muted-foreground">
        {ai.provider && <>Explanation by {ai.provider}. </>}
        {ai.reuse && <>Reused from an identical earlier request. </>}
        AI text can be wrong; the scores, rankings and table come from the rule engine.
      </p>
    </div>
  );
}
