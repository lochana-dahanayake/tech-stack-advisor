import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "What's new",
  description: "Release notes for Tech Stack Advisor: what changed in each version and why.",
};

/** Release notes in plain words. Keep in step with docs/ROADMAP.md and the `version` in package.json. */
const releases = [
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
