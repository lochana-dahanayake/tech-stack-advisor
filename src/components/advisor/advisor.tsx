"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PencilIcon, RotateCcwIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import { score } from "@/modules/scoring";
import { AdvisorForm } from "@/components/form/advisor-form";
import {
  clearSavedForm,
  emptyForm,
  fromInput,
  loadSavedForm,
  saveForm,
  toUserInput,
  type FormState,
  type StepId,
} from "@/components/form/form-state";
import { presets, type Preset } from "@/components/form/presets";
import { StackCard } from "@/components/result/stack-card";
import { Button } from "@/components/ui/button";

type View = "form" | "result";

/**
 * The /advisor page: a 4-step form → result. `?new` (the home page's main button) always starts fresh;
 * `?example=<id>` opens one of the examples' results. Answers are kept for this tab only (form-state.ts).
 */
export function Advisor() {
  const [view, setView] = useState<View>("form");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<StepId>(1);
  const [loaded, setLoaded] = useState(false);
  const [example, setExample] = useState<Preset>();

  useEffect(() => {
    if (loaded) saveForm({ form, step }, kb);
  }, [form, step, loaded]);

  const showResult = useCallback(() => {
    setView("result");
    window.scrollTo({ top: 0 });
  }, []);

  /** `?new` and `?example=<id>` are read once and then removed, so a refresh keeps what's on screen. */
  const openFromQuery = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("new") && !params.has("example")) return false;
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    clearSavedForm();
    const preset = presets.find((p) => p.id === params.get("example"));
    if (!preset) return true; // ?new, or an unknown example: a blank form.
    setForm(fromInput(preset.input));
    setStep(4);
    setExample(preset);
    showResult();
    return true;
  }, [showResult]);

  // Restore after hydration (browser storage isn't available while prerendering).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL or session storage */
    if (!openFromQuery()) {
      const saved = loadSavedForm(kb);
      if (saved) {
        setForm(saved.form);
        setStep(saved.step);
      }
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [openFromQuery]);

  const reset = () => {
    clearSavedForm();
    setForm(emptyForm());
    setStep(1);
    setExample(undefined);
    setView("form");
    window.scrollTo({ top: 0 });
  };

  const result = useMemo(() => score(toUserInput(form), kb), [form]);

  if (!loaded) return <p role="status">Loading…</p>;

  if (view === "result")
    return (
      <section aria-labelledby="result-heading" className="mx-auto max-w-xl space-y-6">
        <div className="space-y-1">
          {example && <p className="text-sm font-medium text-primary">Example · {example.title}</p>}
          <h1 id="result-heading" className="text-3xl font-semibold tracking-tight">
            Your recommended stack
          </h1>
          <p className="text-muted-foreground">
            The best-scoring combination for your answers. The full breakdown, with the ranked options for each part and
            the reasons, is on its way.
          </p>
        </div>
        <StackCard result={result} label="Recommended stack" />
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setExample(undefined);
              setView("form");
            }}
          >
            <PencilIcon aria-hidden /> Edit answers
          </Button>
          <Button variant="ghost" onClick={reset}>
            <RotateCcwIcon aria-hidden /> Start over
          </Button>
        </div>
      </section>
    );

  return (
    <AdvisorForm
      form={form}
      step={step}
      onFormChange={(f) => {
        setExample(undefined);
        setForm(f);
      }}
      onStepChange={setStep}
      onSubmit={showResult}
      onStartOver={reset}
    />
  );
}
