"use client";

import Link from "next/link";
import { MAX_NOTES_LENGTH } from "@/modules/scoring";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { FormState } from "./form-state";

/**
 * Step 4's free-text notes, the privacy notice and the "Don't use AI" opt-out (AI_INTEGRATION §9). Only the AI
 * reads the notes; the rule engine never does.
 */
export function NotesField({ form, onChange }: { form: FormState; onChange: (f: FormState) => void }) {
  const left = MAX_NOTES_LENGTH - form.notes.length;
  return (
    <div className="space-y-2 border-t pt-6">
      <label htmlFor="notes" className="font-medium">
        Anything else we should know? (optional)
      </label>
      <p id="notes-help" className="text-sm text-muted-foreground">
        Only the AI explanation reads this; the ranking comes from your answers above.
      </p>
      <textarea
        id="notes"
        value={form.notes}
        maxLength={MAX_NOTES_LENGTH}
        rows={4}
        onChange={(e) => onChange({ ...form, notes: e.target.value })}
        placeholder="For example: we already run MySQL; the app must work offline in the field; our host is a university server."
        aria-describedby="notes-help notes-count notes-privacy"
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <p id="notes-privacy" className="max-w-prose text-muted-foreground">
          {form.useAi ? (
            <>
              Your answers and notes are sent to an AI service (Google Gemini or Groq) to write a plain-language
              explanation. Free AI services may use this text to improve their products, so please don&apos;t include
              passwords, personal or confidential details.{" "}
            </>
          ) : (
            <>AI is off for this request: nothing is sent to an AI service. </>
          )}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy
          </Link>
        </p>
        <p id="notes-count" className={cn("tabular-nums text-muted-foreground", left < 50 && "text-warning")}>
          {left} characters left
        </p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Checkbox id="no-ai" checked={!form.useAi} onCheckedChange={(v) => onChange({ ...form, useAi: v !== true })} />
        <label htmlFor="no-ai" className="text-sm">
          Don&apos;t use AI for this request
        </label>
      </div>
    </div>
  );
}
