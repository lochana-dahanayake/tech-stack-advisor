"use client";

import { useId } from "react";
import type { Question } from "@/modules/knowledge-base";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioCard, RadioGroup, SegmentedControl, SegmentedControlItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/**
 * One KB question. Options with hints are radio cards (the hint is an example on screen); short ones are a
 * segmented control; multi-select questions are checkbox cards. Unanswered counts as "Not sure".
 */
export function QuestionField({
  question: q,
  value,
  onChange,
}: {
  question: Question;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;
  const hint = (o: string) => q.hints?.[o];
  return (
    <div className="space-y-2.5">
      <div className="space-y-0.5">
        <h3 id={labelId} className="font-medium">
          {q.text}
        </h3>
        {q.help && (
          <p id={helpId} className="text-sm text-muted-foreground">
            {q.help}
          </p>
        )}
      </div>
      {q.kind === "multi" ? (
        <div role="group" aria-labelledby={labelId} className="grid gap-2 sm:grid-cols-2">
          {q.options.map((o) => {
            const list = Array.isArray(value) ? value : [];
            const checked = list.includes(o);
            const boxId = `${id}-${o}`;
            return (
              <label
                key={o}
                htmlFor={boxId}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-input p-3 transition-colors hover:bg-muted/50",
                  checked && "border-primary bg-primary/5 inset-ring-1 inset-ring-primary",
                )}
              >
                <Checkbox
                  id={boxId}
                  checked={checked}
                  className="mt-0.5"
                  onCheckedChange={(c) =>
                    onChange(c ? q.options.filter((x) => x === o || list.includes(x)) : list.filter((x) => x !== o))
                  }
                />
                <span className="space-y-0.5">
                  <span className="block text-sm font-medium">{q.labels[o]}</span>
                  {hint(o) && <span className="block text-sm text-muted-foreground">{hint(o)}</span>}
                </span>
              </label>
            );
          })}
        </div>
      ) : q.options.some(hint) ? (
        <RadioGroup
          value={typeof value === "string" ? value : ""}
          onValueChange={onChange}
          aria-labelledby={labelId}
          aria-describedby={q.help ? helpId : undefined}
          className="grid gap-2 sm:grid-cols-2"
        >
          {q.options.map((o) => (
            <RadioCard key={o} value={o} label={q.labels[o] ?? o} description={hint(o)} />
          ))}
        </RadioGroup>
      ) : (
        <SegmentedControl
          value={typeof value === "string" ? value : ""}
          onValueChange={onChange}
          aria-labelledby={labelId}
          aria-describedby={q.help ? helpId : undefined}
          className="w-full sm:w-fit"
        >
          {q.options.map((o) => (
            <SegmentedControlItem key={o} value={o}>
              {q.labels[o]}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      )}
    </div>
  );
}
