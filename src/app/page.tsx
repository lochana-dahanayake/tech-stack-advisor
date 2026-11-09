import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CircleCheckIcon,
  LayersIcon,
  MessageSquareTextIcon,
  UsersIcon,
} from "lucide-react";
import { kb, listSources } from "@/modules/knowledge-base";
import { score } from "@/modules/scoring";
import { presets } from "@/components/form/presets";
import { StackCard } from "@/components/result/stack-card";
import { Button } from "@/components/ui/button";

const products = kb.options.filter((o) => o.level === "product");
const sourceCount = new Set(
  listSources(kb).flatMap(({ source }) => (source.kind === "book" || source.kind === "ref" ? [source.ref] : [])),
).size;

const steps = [
  {
    icon: MessageSquareTextIcon,
    title: "Describe your project",
    body: "What you're building, your data, budget and deadline. Every question has a “Not sure” option.",
  },
  {
    icon: UsersIcon,
    title: "Add your team's skills",
    body: "Languages and frameworks your team already knows count, in their own capped bucket, so a familiar tool wins close calls without hiding better ones.",
  },
  {
    icon: LayersIcon,
    title: "Get a whole stack",
    body: `${products.length} products across ${kb.parts.length} parts are ranked, then combined into a stack that works together, with the reasons and close calls shown.`,
  },
];

const stats = [
  { value: products.length, label: "frameworks and products" },
  { value: kb.criteria.length, label: "criteria" },
  { value: sourceCount, label: "cited sources" },
  { value: `v${kb.meta.kbVersion}`, label: "knowledge base" },
];

const promises = ["Free, no account", "Same answers, same result", "Every fact sourced and dated"];

/** A real result for the "Real-time chat app" example, computed at build time by the same engine the advisor uses. */
function ResultPreview() {
  const preset = presets[0]!;
  return (
    <Link
      href={`/advisor?example=${preset.id}`}
      className="group block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <StackCard
        result={score(preset.input, kb)}
        className="transition-colors group-hover:border-primary/40"
        label={
          <>
            Example result · <span className="text-foreground">{preset.title}</span>
          </>
        }
        footer={
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            See the full result
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        }
      />
    </Link>
  );
}

export default function Home() {
  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pt-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border bg-brand-muted px-3 py-1 text-xs font-medium text-primary">
            <BookOpenIcon className="size-3.5" aria-hidden /> Built on books, official docs and developer surveys
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Which tech stack fits your project and your team?
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Answer a few short questions and get a language, frontend, backend, database and hosting that work together,
            ranked for your project and the skills your team already has, with the reasons explained.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              {/* ?new always opens a blank form, even if this tab has answers from earlier. */}
              <Link href="/advisor?new">
                Start a new recommendation <ArrowRightIcon aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#examples">See examples</Link>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {promises.map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5">
                <CircleCheckIcon className="size-4 text-fit-strong" aria-hidden /> {p}
              </li>
            ))}
          </ul>
        </div>
        <ResultPreview />
      </section>

      <section aria-label="What the advice is built on" className="rounded-2xl border bg-muted/30">
        <dl className="grid grid-cols-2 sm:grid-cols-4 sm:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse items-center gap-1 px-4 py-5 text-center">
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className="text-2xl font-semibold tracking-tight tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="examples" aria-labelledby="examples-heading" className="space-y-5">
        <div className="space-y-1">
          <h2 id="examples-heading" className="text-2xl font-semibold tracking-tight">
            Or explore an example
          </h2>
          <p className="text-muted-foreground">
            Each one opens a finished recommendation. You can change any answer to make it your own.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((p) => (
            <li key={p.id}>
              <Link
                href={`/advisor?example=${p.id}`}
                className="group flex h-full flex-col gap-1.5 rounded-xl border bg-card px-5 py-4 outline-none transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:hover:translate-y-0"
              >
                <span className="flex items-center justify-between gap-2 leading-tight font-medium">
                  {p.title}
                  <ArrowRightIcon
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden
                  />
                </span>
                <span className="text-sm text-muted-foreground">{p.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="how" aria-labelledby="how-heading" className="space-y-5">
        <h2 id="how-heading" className="text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="space-y-3 rounded-xl border bg-card p-5">
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-muted text-primary">
                  <s.icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-medium text-muted-foreground">Step {i + 1}</span>
              </span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <CalendarCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          Versions, licences and free tiers change, so every such fact carries the date it was last checked, and the
          knowledge base is refreshed every three months.{" "}
          <Link href="/methodology" className="font-medium text-primary underline-offset-4 hover:underline">
            Read the full methodology
          </Link>
          .
        </p>
      </section>

      <section
        aria-labelledby="cta-heading"
        className="flex flex-col items-start gap-5 rounded-2xl border bg-gradient-to-br from-brand-muted via-card to-card p-8 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1.5">
          <h2 id="cta-heading" className="text-2xl font-semibold tracking-tight">
            Ready to choose your stack?
          </h2>
          <p className="text-muted-foreground">A few minutes, no account, and it works with AI turned off.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/advisor?new">
            Start now <ArrowRightIcon aria-hidden />
          </Link>
        </Button>
      </section>
    </div>
  );
}
