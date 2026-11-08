"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, ChevronDownIcon, CircleAlertIcon, RotateCcwIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import { checkInput, score } from "@/modules/scoring";
import { StackCard } from "@/components/result/stack-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioCard, RadioGroup, SegmentedControl, SegmentedControlItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  frameworkOptions,
  LEVEL_OPTIONS,
  SKILL_OPTIONS,
  STEP_QUESTIONS,
  STEPS,
  toUserInput,
  type FormState,
  type StepId,
} from "./form-state";
import { impliedLevels, type ImpliedLevel } from "./implied";
import { QuestionField } from "./question-field";

const STEP_INTROS: Record<StepId, string> = {
  1: "What you're building and what its data looks like. Skip anything you don't know: unanswered counts as “Not sure”.",
  2: "Your team and your timeline. Skills count in their own capped bucket, so they help a familiar tool without hiding a better one.",
  3: "What you can spend on running it, and any rules you have to follow.",
  4: "Rate how much each quality matters. Anything you leave alone counts as Low; some are already raised by your answers.",
};

const languages = kb.options.filter((o) => o.part === "language");
const frameworks = frameworkOptions(kb);
const frameworkPoints = kb.skills.find((s) => "knownFramework" in s.when)?.productPoints ?? 0;
const levelLabel = (id: string) => LEVEL_OPTIONS.find((l) => l.id === id)?.label ?? id;

export function AdvisorForm({
  form,
  step,
  onFormChange,
  onStepChange,
  onSubmit,
  onStartOver,
}: {
  form: FormState;
  step: StepId;
  onFormChange: (f: FormState) => void;
  onStepChange: (s: StepId) => void;
  onSubmit: () => void;
  onStartOver: () => void;
}) {
  const [attempted, setAttempted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const input = useMemo(() => toUserInput(form), [form]);
  const { issues, warnings } = useMemo(() => checkInput(input, kb), [input]);
  // The engine is fast (a few ms), so the side panel and the "implied" badges are recomputed on every change.
  const result = useMemo(() => score(input, kb), [input]);
  const implied = useMemo(() => impliedLevels(input, result, kb), [input, result]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const goTo = (s: StepId) => {
    onStepChange(s);
    window.scrollTo({ top: 0 });
  };

  const next = () => {
    if (step < 4) return goTo((step + 1) as StepId);
    if (issues.length > 0) return setAttempted(true);
    onSubmit();
  };

  const setAnswer = (id: string, v: string | string[]) =>
    onFormChange({ ...form, answers: { ...form.answers, [id]: v } });

  const current = STEPS[step - 1]!;
  const started =
    step > 1 ||
    form.knownFrameworks.length > 0 ||
    form.goal !== "ship" ||
    [form.answers, form.weights, form.skills].some((o) => Object.keys(o).length > 0);
  const ready = issues.length === 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-labelledby="step-heading" className="min-w-0 space-y-6">
        <div className="space-y-2">
          <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Step {step} of {STEPS.length}
            </p>
            {started && <StartOver onConfirm={onStartOver} />}
          </div>
          <Progress value={(step / STEPS.length) * 100} aria-label={`Step ${step} of ${STEPS.length}`} />
          <ol className="hidden gap-4 text-sm sm:flex" aria-label="Steps">
            {STEPS.map((s) => (
              <li key={s.id} aria-current={s.id === step ? "step" : undefined}>
                <button
                  type="button"
                  onClick={() => goTo(s.id)}
                  className={s.id === step ? "font-medium" : "text-muted-foreground hover:text-foreground"}
                >
                  {s.id}. {s.short}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-1">
          <h1
            id="step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-semibold tracking-tight outline-none"
          >
            {current.title}
          </h1>
          <p className="text-muted-foreground">{STEP_INTROS[step]}</p>
          {step === 1 && (
            <p className="text-sm text-muted-foreground">
              Want to see what you get first?{" "}
              <Link href="/#examples" className="underline underline-offset-4 hover:text-foreground">
                Open an example
              </Link>
              .
            </p>
          )}
        </div>

        {attempted && issues.length > 0 && (
          <Alert variant="destructive" role="alert">
            <CircleAlertIcon aria-hidden />
            <AlertTitle>One thing before we can rank</AlertTitle>
            <AlertDescription>
              {issues.map((i) => (
                <span key={i.code}>{i.message}</span>
              ))}
              <Button variant="link" className="h-auto p-0" onClick={() => goTo(1)}>
                Go to “What are you building?”
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          {STEP_QUESTIONS[step].map((qid) => {
            const q = kb.questions.find((x) => x.id === qid)!;
            return (
              <QuestionField key={qid} question={q} value={form.answers[qid]} onChange={(v) => setAnswer(qid, v)} />
            );
          })}
          {step === 2 && <TeamSkills form={form} onChange={onFormChange} />}
          {step === 4 && (
            <Priorities
              form={form}
              implied={implied}
              warning={warnings[0]?.message}
              onChange={(weights) => onFormChange({ ...form, weights })}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => goTo((step - 1) as StepId)} disabled={step === 1}>
            <ArrowLeftIcon aria-hidden />
            Back
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {step < 4 && ready && (
              <Button variant="ghost" onClick={onSubmit}>
                See my stack now
              </Button>
            )}
            <Button size="lg" onClick={next}>
              {step < 4 ? "Next" : "See my stack"}
              <ArrowRightIcon aria-hidden />
            </Button>
          </div>
        </div>
      </section>

      <aside aria-label="Your stack so far" className="lg:sticky lg:top-20 lg:self-start">
        {ready ? (
          <StackCard
            compact
            result={result}
            label={<span className="text-foreground">Your stack so far</span>}
            footer={<span className="text-xs text-muted-foreground">Updates as you answer</span>}
          />
        ) : (
          <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Your stack so far</p>
            <p className="mt-1">
              Answer “What are you building?” (or set a priority to High) and your stack appears here, updating as you
              go.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function TeamSkills({ form, onChange }: { form: FormState; onChange: (f: FormState) => void }) {
  const toggleFramework = (id: string) =>
    onChange({
      ...form,
      knownFrameworks: form.knownFrameworks.includes(id)
        ? form.knownFrameworks.filter((x) => x !== id)
        : frameworks.filter((f) => f.id === id || form.knownFrameworks.includes(f.id)).map((f) => f.id),
    });
  return (
    <>
      <div className="space-y-2.5">
        <div className="space-y-0.5">
          <h3 className="font-medium">Languages your team knows</h3>
          <p className="text-sm text-muted-foreground">
            “Strong” means someone could build the whole thing in it today. Leave the rest at None.
          </p>
        </div>
        <ul className="divide-y rounded-lg border">
          {languages.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span id={`skill-${l.id}`} className="text-sm font-medium">
                {l.name}
              </span>
              <SegmentedControl
                value={form.skills[l.id] ?? "none"}
                onValueChange={(v) => {
                  const skills = { ...form.skills, [l.id]: v as "some" | "strong" };
                  if (v === "none") delete skills[l.id]; // unset = None, so the input stays minimal
                  onChange({ ...form, skills });
                }}
                aria-labelledby={`skill-${l.id}`}
                className="w-full sm:w-64"
              >
                {SKILL_OPTIONS.map((s) => (
                  <SegmentedControlItem key={s.id} value={s.id} className="basis-0">
                    {s.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2.5">
        <div className="space-y-0.5">
          <h3 className="font-medium">Frameworks your team knows</h3>
          <p className="text-sm text-muted-foreground">
            Optional. Each one you pick gets {frameworkPoints} points (all skill bonuses together are capped at{" "}
            {kb.meta.caps.skillsMax}).
          </p>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Frameworks your team knows">
          {frameworks.map((f) => {
            const on = form.knownFrameworks.includes(f.id);
            return (
              <li key={f.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleFramework(f.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {f.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2.5">
        <h3 id="goal-label" className="font-medium">
          What should the stack do for your team?
        </h3>
        <RadioGroup
          value={form.goal}
          onValueChange={(v) => onChange({ ...form, goal: v as FormState["goal"] })}
          aria-labelledby="goal-label"
          className="grid gap-2 sm:grid-cols-2"
        >
          <RadioCard
            value="ship"
            label="Use what we know"
            description="Ship with familiar tools. Skills count fully."
          />
          <RadioCard
            value="learn"
            label="Learn something new"
            description="Skills count half as much and easy-to-learn tools get a boost."
          />
        </RadioGroup>
      </div>
    </>
  );
}

function Priorities({
  form,
  implied,
  warning,
  onChange,
}: {
  form: FormState;
  implied: Record<string, ImpliedLevel>;
  warning?: string;
  onChange: (weights: FormState["weights"]) => void;
}) {
  const advanced = kb.criteria.filter((c) => c.visibility === "advanced");
  const [showAll, setShowAll] = useState(advanced.some((c) => form.weights[c.id] !== undefined));
  // Hidden priorities still show when an answer raised them, so the raise is never invisible.
  const visible = kb.criteria.filter((c) => showAll || c.visibility === "default" || implied[c.id]);
  const hidden = advanced.filter((c) => !visible.includes(c));
  return (
    <div className="space-y-4">
      {warning && (
        <p role="status" className="rounded-md bg-warning-muted px-3 py-2 text-sm">
          {warning}
        </p>
      )}
      <ul className="divide-y">
        {visible.map((c) => {
          const raised = implied[c.id];
          return (
            <li key={c.id} className="grid gap-2 py-3 md:grid-cols-[1fr_auto] md:items-center md:gap-6">
              <div className="space-y-1">
                <span id={`crit-${c.id}`} className="font-medium">
                  {c.name}
                </span>
                <p className="text-sm text-muted-foreground">{c.short}</p>
                {raised && (
                  <Badge variant={raised.overrides ? "warning" : "info"} className="text-left whitespace-normal">
                    {raised.overrides ? "Raised to" : "Implied:"} at least {levelLabel(raised.level)}
                    {raised.from.length > 0 && <> (from “{raised.from.join("”, “")}”)</>}
                  </Badge>
                )}
              </div>
              <SegmentedControl
                value={form.weights[c.id] ?? "low"}
                onValueChange={(v) => onChange({ ...form.weights, [c.id]: v as FormState["weights"][string] })}
                aria-labelledby={`crit-${c.id}`}
                className="md:w-[30rem]"
              >
                {LEVEL_OPTIONS.map((l) => (
                  <SegmentedControlItem key={l.id} value={l.id}>
                    {l.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            </li>
          );
        })}
      </ul>
      {hidden.length > 0 && (
        <div className="space-y-1">
          <Button variant="outline" onClick={() => setShowAll(true)} aria-describedby="more-priorities">
            <ChevronDownIcon aria-hidden />
            More priorities
          </Button>
          <p id="more-priorities" className="text-sm text-muted-foreground">
            {hidden.map((c) => c.name).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

/** "Start over" clears every answer, so it asks once, inline (no browser dialog). */
function StartOver({ onConfirm }: { onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <Button variant="ghost" size="sm" onClick={() => setAsking(true)}>
        <RotateCcwIcon aria-hidden /> Start over
      </Button>
    );
  return (
    <p role="group" aria-label="Start over?" className="flex items-center gap-2 text-sm">
      Clear all answers?
      <Button variant="destructive" size="sm" onClick={onConfirm}>
        Yes, start over
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setAsking(false)}>
        Cancel
      </Button>
    </p>
  );
}
