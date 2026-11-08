"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { kb } from "@/modules/knowledge-base";
import { buildRecommendation } from "@/modules/recommendation";
import { checkInput, score } from "@/modules/scoring";
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

const ExportActions = dynamic(() => import("@/components/result/export-actions").then((m) => m.ExportActions));

// The result view is only needed after submit, so it loads in its own chunk.
const ResultView = dynamic(() => import("@/components/result/result-view").then((m) => m.ResultView), {
  loading: () => <p role="status">Preparing your result…</p>,
});

type View = "form" | "result";

/** Today in the visitor's calendar, for "due for a re-check" on dated facts (the recommendation module stays pure). */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * The /advisor page: a 4-step form → result. `?new` (the home page's main button) always starts fresh;
 * `?example=<id>` opens one of the examples' results. Answers are kept for this tab only (form-state.ts); the
 * result is recomputed from them, so a refresh shows the same result.
 */
export function Advisor() {
  const [view, setView] = useState<View>("form");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<StepId>(1);
  const [loaded, setLoaded] = useState(false);
  const [example, setExample] = useState<Preset>();

  useEffect(() => {
    if (loaded) saveForm({ form, step, view, example: example?.id }, kb);
  }, [form, step, view, example, loaded]);

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
        setExample(presets.find((p) => p.id === saved.example));
        if (saved.view === "result" && checkInput(toUserInput(saved.form), kb).issues.length === 0) setView("result");
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

  const result = useMemo(() => {
    if (view !== "result") return undefined;
    const input = toUserInput(form);
    const date = today();
    return { input, date, rec: buildRecommendation(input, score(input, kb), kb, date) };
  }, [form, view]);

  if (!loaded) return <p role="status">Loading…</p>;

  if (view === "result" && result)
    return (
      <ResultView
        rec={result.rec}
        actions={<ExportActions rec={result.rec} input={result.input} date={result.date} />}
        example={example?.title}
        onEdit={() => {
          setExample(undefined);
          setView("form");
          setStep(4);
          window.scrollTo({ top: 0 });
        }}
        onStartOver={reset}
      />
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
