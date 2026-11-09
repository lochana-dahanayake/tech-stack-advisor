import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "What's new",
  description: "Release notes for Tech Stack Advisor: what changed in each version and why.",
};

/** Release notes in plain words. Keep in step with docs/ROADMAP.md and the `version` in package.json. */
const releases = [
  {
    version: "0.6",
    date: "2026-11-09",
    title: "What you mention, and stacks you know",
    tag: "Preview",
    items: [
      "Mention a tool in your notes (Supabase, WordPress, Docker, Prisma, Postgres, …) and the result answers it in a line, with or without AI.",
      "If your stack is a well-known one (T3, MERN, LAMP, …), the result says so, for orientation only.",
      "A few pairings that are known to work well together (Next.js on Vercel, Django with PostgreSQL) get a small bonus that can settle a near-tie, never more.",
    ],
  },
  {
    version: "0.5",
    date: "2026-11-09",
    title: "Fairer scores, live on the web",
    tag: "Preview",
    items: [
      "Live at tech-stack-advisor-one.vercel.app, with the source code public on GitHub.",
      "Hosting: how far each provider scales now comes from its own documentation, and Render is scored on its paid plans like Railway (its free plan's sleep is a separate rule). The two often tie now, and the result says so. A heavy-load API now gets a cloud provider.",
      "Frontend: package counts from npm and the frameworks' own docs replace guesses. Next.js is no longer offered as a single-page-app framework (its single-page mode leaves out its server features), so Vue is the usual pick for an app that runs in the browser.",
      "Languages: no language leads on a score nobody has sourced yet.",
      "Budget answers name rough amounts ($0, up to about $25, $25–$100, more than $100 a month).",
      "A new check makes sure no score rests on a vendor's word about itself without a written rule for turning that into a number.",
    ],
  },
  {
    version: "0.4",
    date: "2026-11-09",
    title: "In plain words (AI, optional)",
    tag: "Preview",
    items: [
      "An optional AI explanation of your stack in plain words, with what to watch out for. It runs on free AI services (Google Gemini, then Groq) and the result page says when it is off.",
      "A notes box on the last step for things the questions don't cover. Only the AI reads it; the ranking still comes from your answers.",
      "The AI may nudge up to three options by at most 5 points each, with a reason you can see. The rule engine then rebuilds the stack, so the AI can only tip a close call, never pick the stack.",
      "A “Don't use AI for this request” box, and a Privacy page that says what is sent where.",
    ],
  },
  {
    version: "0.3",
    date: "2026-11-09",
    title: "Share, must-use picks and the full method",
    tag: "Preview",
    items: [
      "Share & save: copy a link that reopens your result (your answers travel in the link, never to our server), download Markdown with a link back, or print.",
      "Must use: on step 3, pick a language, framework, database or host you have to use. It always stays in your stack, and the result says what it costs: its rank, any rule it overrides, or a clash with another must-use.",
      "Coming from Architecture Advisor: a link with your architecture style starts the form with it, and the result says which picks it nudged.",
      "A “How it works” page with the steps, the formula, the fairness rules, every rule and source, and how often facts are re-checked, plus an About page.",
      "Accessibility checks on every page in light and dark mode, which fixed a contrast issue on button hover and the stack card's markup.",
    ],
  },
  {
    version: "0.2",
    date: "2026-11-09",
    title: "The advisor you can use",
    tag: "Preview",
    items: [
      "A home page with a real example result, worked out by the same engine the advisor uses.",
      "A four-step form: your project, your team, budget and rules, and what matters most. Your stack appears beside it and updates as you answer.",
      "Answers that raise a priority say so (“Implied: at least High, from ‘Money or strict consistency’”).",
      "The result: your stack with a score ring, close calls and other things to know, every part ranked with the reasons, and the top three compared, with the date each fact was checked.",
      "Download a result as Markdown to paste into a design document, an ADR or a pull request, or print it.",
    ],
  },
  {
    version: "0.1",
    date: "2026-11-08",
    title: "Knowledge base and rule engine",
    tag: "No app yet",
    items: [
      "Five parts of a stack: language, frontend, backend, database and hosting, with 44 frameworks and products scored on 16 criteria.",
      "Every score says where it comes from (a book, official docs, a benchmark, a developer survey or general knowledge) and when it was checked; a top or bottom score needs real evidence, and free tiers come from the vendors' own pages.",
      "A deterministic engine: approaches first, then products, team skills in their own capped bucket, then the best combination that works together.",
      "13 test scenarios written up front, from a student portfolio to a high-throughput API, all passing.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">What&apos;s new</h1>
        <p className="text-muted-foreground">What changed in each version of Tech Stack Advisor.</p>
      </header>
      <ol className="relative space-y-10 border-l pl-6">
        {releases.map((r, i) => (
          <li key={r.version} className="relative space-y-3">
            <span
              className={`absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-background ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`}
              aria-hidden
            />
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                v{r.version} · {r.title}
              </h2>
              <Badge variant={i === 0 ? "default" : "secondary"}>{r.tag}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <time dateTime={r.date}>{r.date}</time>
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm">
              {r.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
