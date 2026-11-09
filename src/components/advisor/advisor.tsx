"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CircleAlertIcon, CompassIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import { buildRecommendation, type AiBlock } from "@/modules/recommendation";
import { checkInput, score, type UserInput } from "@/modules/scoring";
import { AdvisorForm } from "@/components/form/advisor-form";
import {
  clearSavedForm,
  emptyForm,
  fromInput,
  isStyle,
  loadSavedForm,
  saveForm,
  toUserInput,
  type FormState,
  type StepId,
} from "@/components/form/form-state";
import { presets, type Preset } from "@/components/form/presets";
import { decodeShareHash } from "@/components/form/share-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AiPanel = dynamic(() => import("@/components/result/ai-panel").then((m) => m.AiPanel));

const ExportActions = dynamic(() => import("@/components/result/export-actions").then((m) => m.ExportActions));

// The result view is only needed after submit, so it loads in its own chunk.
const ResultView = dynamic(() => import("@/components/result/result-view").then((m) => m.ResultView), {
  loading: () => <p role="status">Preparing your result…</p>,
});

type View = "form" | "result";

const AI_OK = new Set<AiBlock["status"]>(["ok", "cached"]);

/** Asks the server for the AI block. Any network or server error reads as "unavailable": the rule result stays. */
async function fetchAi(input: UserInput, signal: AbortSignal): Promise<AiBlock> {
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ input }),
      signal,
    });
    if (!res.ok) return { status: "unavailable", adjustments: [] };
    return ((await res.json()) as { ai: AiBlock }).ai;
  } catch {
    return { status: "unavailable", adjustments: [] };
  }
}

interface Notice {
  tone: "warning" | "info";
  title: string;
  text: string;
}

const NOTICES = {
  broken: {
    tone: "warning",
    title: "We couldn't open that link",
    text: "It may be cut off or made by an older version of the app. You can start again below.",
  },
  partial: {
    tone: "warning",
    title: "Some answers in that link need checking",
    text: "The questions have changed since the link was made. We kept every answer that still fits; please check the rest.",
  },
  unknownStyle: {
    tone: "warning",
    title: "We didn't recognise the architecture style in that link",
    text: "You can still pick one on step 3 (Budget and rules).",
  },
} satisfies Record<string, Notice>;

/** The `?style=` hand-off from Architecture Advisor (Q2). */
const styleNotice = (id: string): Notice => ({
  tone: "info",
  title: `Architecture style from Architecture Advisor: ${kb.meta.architectureStyles.styles.find((s) => s.id === id)?.name ?? id}`,
  text: "It nudges a few picks. Answer the questions below to get your stack; you can change or remove the style on step 3.",
});

/** Today in the visitor's calendar, for "due for a re-check" on dated facts (the recommendation module stays pure). */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * The /advisor page: a 4-step form → result. `?new` (the home page's main button) always starts fresh;
 * `?example=<id>` opens one of the examples' results; `?style=<id>` (from Architecture Advisor, Q2) starts a form
 * with that architecture style; a share link (`#a=…`, share-link.ts) opens the answers it holds. Answers are kept
 * for this tab only (form-state.ts); the result is recomputed from them, so a refresh shows the same result.
 */
export function Advisor() {
  const [view, setView] = useState<View>("form");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState<StepId>(1);
  const [loaded, setLoaded] = useState(false);
  const [example, setExample] = useState<Preset>();
  const [notice, setNotice] = useState<Notice>();
  /** The AI block for one request key (input + retry count); while the key differs, the panel shows "pending". */
  const [ai, setAi] = useState<{ key: string; block: AiBlock }>();
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (loaded) saveForm({ form, step, view, example: example?.id }, kb);
  }, [form, step, view, example, loaded]);

  const showResult = useCallback(() => {
    setView("result");
    window.scrollTo({ top: 0 });
  }, []);

  /** A shared link (#a=…) wins over saved answers. The hash is removed once read, so a refresh uses the saved copy. */
  const openSharedLink = useCallback(() => {
    const link = decodeShareHash(window.location.hash, kb);
    if (link.status === "none") return false;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    clearSavedForm();
    setExample(undefined);
    if (link.status === "ok") {
      setNotice(undefined);
      setForm(link.form);
      setStep(4);
      showResult();
    } else {
      setForm(link.status === "partial" ? link.form : emptyForm());
      setStep(link.status === "partial" ? link.step : 1);
      setView("form");
      setNotice(NOTICES[link.status]);
      window.scrollTo({ top: 0 });
    }
    return true;
  }, [showResult]);

  /** `?new`, `?example=<id>` and `?style=<id>` are read once and then removed, so a refresh keeps what's on screen. */
  const openFromQuery = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const style = params.get("style");
    if (!params.has("new") && !params.has("example") && style === null) return false;
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    clearSavedForm();
    const preset = presets.find((p) => p.id === params.get("example"));
    const f = preset ? fromInput(preset.input) : emptyForm(); // ?new or an unknown example: a blank form
    if (style !== null && isStyle(style, kb)) f.style = style;
    setNotice(style === null ? undefined : isStyle(style, kb) ? styleNotice(style) : NOTICES.unknownStyle);
    setForm(f);
    setExample(preset);
    if (preset) {
      setStep(4);
      showResult();
    } else {
      setStep(1);
      setView("form");
    }
    return true;
  }, [showResult]);

  // Restore after hydration (browser storage isn't available while prerendering).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time sync from the URL or session storage */
    if (!openSharedLink() && !openFromQuery()) {
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
    // A link pasted into the address bar while /advisor is open only changes the hash.
    const onHashChange = () => void openSharedLink();
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [openSharedLink, openFromQuery]);

  const reset = () => {
    clearSavedForm();
    setNotice(undefined);
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
    return { input, date, rules: score(input, kb) };
  }, [form, view]);

  const aiKey = result && form.useAi ? `${retries}:${JSON.stringify(result.input)}` : undefined;
  useEffect(() => {
    if (!aiKey || !result) return;
    const controller = new AbortController();
    void fetchAi(result.input, controller.signal).then((block) => {
      if (!controller.signal.aborted) setAi({ key: aiKey, block });
    });
    return () => controller.abort();
  }, [aiKey, result]);

  /**
   * The result on screen. With AI adjustments the same pure engine re-runs with them (the server did the same); if
   * its stack differs from the one the server explained (a version skew), the AI part is dropped, never the result.
   */
  const shown = useMemo(() => {
    if (!result) return undefined;
    const rulesRec = () => buildRecommendation(result.input, result.rules, kb, result.date);
    const block: AiBlock | undefined = !form.useAi
      ? { status: "skipped", adjustments: [] }
      : ai?.key === aiKey
        ? ai?.block
        : undefined;
    if (!block || !AI_OK.has(block.status) || block.adjustments.length === 0)
      return { rec: rulesRec(), ai: block, changes: [] };
    const deltas = Object.fromEntries(block.adjustments.map((a) => [a.optionId, a.delta]));
    let adjusted;
    try {
      adjusted = score(result.input, kb, deltas);
    } catch {
      adjusted = undefined;
    }
    const picks = adjusted?.stack.picks;
    const same =
      picks &&
      block.stack &&
      Object.keys(picks).length === Object.keys(block.stack).length &&
      Object.entries(picks).every(([p, id]) => block.stack![p] === id);
    if (!adjusted || !same)
      return { rec: rulesRec(), ai: { status: "unavailable", adjustments: [] } as AiBlock, changes: [] };
    const reasons = Object.fromEntries(block.adjustments.map((a) => [a.optionId, `AI: ${a.reason}`]));
    const changes = Object.entries(adjusted.stack.picks)
      .filter(([p, id]) => result.rules.stack.picks[p] !== id)
      .map(([partId, after]) => ({ partId, before: result.rules.stack.picks[partId]!, after }));
    return { rec: buildRecommendation(result.input, adjusted, kb, result.date, reasons), ai: block, changes };
  }, [result, ai, aiKey, form.useAi]);

  if (!loaded) return <p role="status">Loading…</p>;

  const noticeBox = notice && (
    <Alert variant={notice.tone} role={notice.tone === "warning" ? "alert" : "status"} className="mb-6">
      {notice.tone === "warning" ? <CircleAlertIcon aria-hidden /> : <CompassIcon aria-hidden />}
      <AlertTitle>{notice.title}</AlertTitle>
      <AlertDescription>{notice.text}</AlertDescription>
    </Alert>
  );

  if (view === "result" && result && shown)
    return (
      <>
        {noticeBox}
        <ResultView
          rec={shown.rec}
          actions={<ExportActions rec={shown.rec} input={result.input} date={result.date} />}
          ai={
            <AiPanel
              ai={shown.ai}
              pending={!shown.ai}
              changes={shown.changes}
              onRetry={() => setRetries((n) => n + 1)}
            />
          }
          aiChanged={shown.changes.length > 0}
          example={example?.title}
          onEdit={() => {
            setExample(undefined);
            setView("form");
            setStep(4);
            window.scrollTo({ top: 0 });
          }}
          onStartOver={reset}
        />
      </>
    );

  return (
    <>
      {noticeBox}
      <AdvisorForm
        form={form}
        step={step}
        onFormChange={(f) => {
          setExample(undefined);
          setForm(f);
        }}
        onStepChange={setStep}
        onSubmit={() => {
          setNotice(undefined);
          showResult();
        }}
        onStartOver={reset}
      />
    </>
  );
}
