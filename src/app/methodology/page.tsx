import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { kb, listSources, type Effect, type Reference, type Source } from "@/modules/knowledge-base";
import { criterionName, LEVEL_LABELS, optionName, partName } from "@/components/result/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Tech Stack Advisor ranks frameworks and builds a stack: the steps, the formula, the fairness rules, every rule and source, and when facts are re-checked.",
};

const refs = new Map(kb.references.map((r) => [r.id, r]));
const sources = listSources(kb);
const citations = new Map<string, number>();
for (const { source } of sources)
  if (source.kind === "book" || source.kind === "ref") citations.set(source.ref, (citations.get(source.ref) ?? 0) + 1);
const byKind = (k: Source["kind"]) => sources.filter((s) => s.source.kind === k).length;

/** Every dated score and fact, for the "last checked" range. */
const checkedDates = kb.options
  .flatMap((o) => [...Object.values(o.scores).map((s) => s.checked), ...o.facts.map((f) => f.checked)])
  .sort();

const REFERENCE_KINDS: { kind: Reference["kind"]; title: string; note?: string }[] = [
  { kind: "book", title: "Books" },
  { kind: "article", title: "Research and articles" },
  { kind: "survey", title: "Surveys and field data" },
  { kind: "benchmark", title: "Benchmarks", note: "A rough signal only, never the whole performance score." },
  { kind: "docs", title: "Standards and independent docs" },
  {
    kind: "vendor",
    title: "The projects' and vendors' own pages",
    note: "Used only for their own facts (a licence, a version, a free tier), never to show that one beats another.",
  },
];

const RULE_GROUPS: { prefix: string; title: string }[] = [
  { prefix: "S", title: "Your situation" },
  { prefix: "B", title: "Backend" },
  { prefix: "D", title: "Database" },
  { prefix: "K", title: "Hosting" },
  { prefix: "A", title: "Architecture style (from Architecture Advisor)" },
];

const FACT_KINDS: Record<string, string> = {
  pricing: "Prices, free tiers and limits",
  "release-status": "Beta or generally available",
  version: "Current versions",
  support: "Support and end-of-life dates",
  licence: "Licences",
  ownership: "Who owns or maintains it",
  usage: "Usage figures",
  score: "Evidence behind a score",
};

function sourceText(s: Source): string {
  switch (s.kind) {
    case "book":
      return `${refs.get(s.ref)?.citation ?? s.ref}${s.locator ? `, ${s.locator}` : ""}`;
    case "ref":
      return refs.get(s.ref)?.citation ?? s.ref;
    case "general":
      return s.reviewed ? "General knowledge (reviewed)" : "General knowledge (to review)";
    case "design":
      // The note is for maintainers (it names test scenarios); the repo has it.
      return "Design choice of this tool";
  }
}

function effectText(e: Effect): string {
  switch (e.type) {
    case "modify":
      return `${optionName(e.target)} ${e.points > 0 ? "+" : "−"}${Math.abs(e.points)}`;
    case "exclude":
      return `${optionName(e.target)} ruled out`;
    case "floor":
      return `${criterionName(e.criterion)} at least ${LEVEL_LABELS[e.level]}`;
    case "not-needed":
      return `no ${partName(e.part, true).toLowerCase()} needed`;
    case "note":
      return "shows a note";
  }
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-semibold tracking-tight">
      {children}
    </h2>
  );
}

function RuleCard({
  id,
  name,
  text,
  effects,
  from,
}: {
  id: string;
  name: string;
  text: string;
  effects: string;
  from: string;
}) {
  return (
    <li className="rounded-lg border p-4 text-sm">
      <p className="font-medium">
        <span className="font-mono text-xs text-muted-foreground">{id}</span> {name}
      </p>
      {text && <p className="text-muted-foreground">{text}</p>}
      {effects && <p className="mt-1">Effect: {effects}</p>}
      <p className="mt-1 text-xs text-muted-foreground">Source: {from}</p>
    </li>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon className="size-4 transition-transform group-open:rotate-90" aria-hidden />
        {title} <span className="text-sm font-normal text-muted-foreground">({count})</span>
      </summary>
      <ul className="grid gap-3 px-4 pb-4 md:grid-cols-2">{children}</ul>
    </details>
  );
}

export default function MethodologyPage() {
  const products = kb.options.filter((o) => o.level === "product");
  return (
    <div className="max-w-4xl space-y-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
        <p className="text-lg text-muted-foreground">
          A small, deterministic rule engine ranks {products.length} frameworks and products across {kb.parts.length}{" "}
          parts of a stack and puts together the best combination that works. The same answers always give the same
          result. This page is generated from the same knowledge base the engine uses (v{kb.meta.kbVersion}).
        </p>
      </header>

      <section aria-labelledby="pipeline" className="space-y-3">
        <H2 id="pipeline">The steps</H2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Priorities.</strong> Each of the {kb.criteria.length} criteria (qualities such as cost, performance
            or how easy it is to learn) gets a weight from the level you chose. Ones you leave alone count as Low.
          </li>
          <li>
            <strong>Minimum levels.</strong> Some answers raise a priority: a chat app makes real-time at least High. If
            that overrides a level you set yourself, the result says so.
          </li>
          <li>
            <strong>Which parts you need.</strong> A portfolio needs no database and no backend; an API needs no web
            frontend. A part that isn&apos;t needed is left out, with the reason.
          </li>
          <li>
            <strong>Approaches first.</strong> In each part the approaches are ranked (for example relational, document
            or graph databases), then the products within them, so a popular product can&apos;t hide that its whole
            approach is a poor fit.
          </li>
          <li>
            <strong>Rules and team skills.</strong> Rules add or remove points for situations an average can&apos;t
            capture, or rule an option out. Skills your team already has count in their own, separately capped bucket,
            so a familiar tool wins close calls without hiding a better one.
          </li>
          <li>
            <strong>The stack.</strong> The top five of each part are combined; combinations that can&apos;t work
            together (Django needs Python, GitHub Pages can&apos;t run a backend) are dropped, and the best average
            wins. When another stack is less than {kb.meta.closeCallPoints} points behind, the result shows it as a
            close call.
          </li>
          <li>
            <strong>Must use and architecture style.</strong> A part you mark as &ldquo;Must use&rdquo; always keeps
            your choice; any rule it overrides is shown, never applied silently. A style from{" "}
            <a href="https://architecture-advisor-pink.vercel.app" className="underline underline-offset-4">
              Architecture Advisor
            </a>{" "}
            nudges a few picks by small amounts.
          </li>
          <li>
            <strong>AI (optional, not enabled yet).</strong> An AI model may later explain the result in plain words and
            nudge a few options by up to ±{kb.meta.caps.ai} points, always with a visible reason. It never builds the
            comparison and the app works fully without it.
          </li>
        </ol>
      </section>

      <section aria-labelledby="formula" className="space-y-3">
        <H2 id="formula">The formula</H2>
        <pre tabIndex={0} className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          {`average = Σ weight[c] × score[option][c] / Σ weight[c]        (scores 1–5)
base    = (average − 1) / 4 × 100                             (0–100)
final   = base + rules (±${kb.meta.caps.rules} at most) + team skills (${kb.meta.caps.skillsMin} to +${kb.meta.caps.skillsMax})
stack   = average of the picks' scores across the parts you need`}
        </pre>
        <Table>
          <TableHeader>
            <TableRow>
              {Object.keys(kb.meta.levels).map((l) => (
                <TableHead key={l} scope="col">
                  {LEVEL_LABELS[l]}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {Object.entries(kb.meta.levels).map(([l, w]) => (
                <TableCell key={l} className="tabular-nums">
                  weight {w}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
        <p className="text-sm text-muted-foreground">
          Critical is 5, not 4, on purpose: one must-have should clearly outweigh several High ones. Fit labels: 75 and
          up strong fit, 60–74.9 good fit, 45–59.9 possible fit, below 45 weak fit.
        </p>
      </section>

      <section aria-labelledby="fairness" className="space-y-3">
        <H2 id="fairness">Fairness rules</H2>
        <p>Every score and rule follows these rules, and automated tests check the ones a computer can check.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Every score has a source:</strong> a book, a published reference, general knowledge (flagged for
            review), or a stated design choice. A top or bottom score (5 or 1) needs a book or published source; until
            it has one it is held at 3 and marked as unsourced.
          </li>
          <li>
            <strong>Comparisons need two independent sources,</strong> or a written rubric based on a public measure
            (for example survey usage bands). One source isn&apos;t enough to say one tool is better than another.
          </li>
          <li>
            <strong>Vendors only speak for themselves.</strong> A project&apos;s own page can prove its own licence,
            version or free tier, never that it beats a rival.
          </li>
          <li>
            <strong>Popularity isn&apos;t quality.</strong> Survey usage feeds only the community score (help, hiring),
            not performance or ease of learning on its own.
          </li>
          <li>
            <strong>No bonus for being new.</strong> Maturity rewards a track record; tools popular with enthusiasts are
            cross-checked against broad surveys.
          </li>
          <li>
            <strong>Your team&apos;s skills are capped</strong> at +{kb.meta.caps.skillsMax} points and kept apart from
            the rule points, so they help a familiar tool without burying a better fit.
          </li>
        </ul>
      </section>

      <section aria-labelledby="sources" className="space-y-3">
        <H2 id="sources">Sources</H2>
        <p>
          The knowledge base cites its sources {sources.length} times: {byKind("book")} times a book, {byKind("ref")}{" "}
          times a published reference, {byKind("general")} times general knowledge and {byKind("design")} times a design
          choice of this tool (checked with test scenarios).
        </p>
        <div className="space-y-5">
          {REFERENCE_KINDS.map(({ kind, title, note }) => {
            const list = kb.references.filter((r) => r.kind === kind);
            if (list.length === 0) return null;
            return (
              <div key={kind} className="space-y-1.5">
                <h3 className="font-medium">{title}</h3>
                {note && <p className="text-sm text-muted-foreground">{note}</p>}
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {list.map((r) => (
                    <li key={r.id}>
                      {r.url ? (
                        <a href={r.url} className="underline underline-offset-4">
                          {r.citation}
                        </a>
                      ) : (
                        r.citation
                      )}{" "}
                      <span className="text-muted-foreground">
                        (cited {citations.get(r.id) ?? 0} {citations.get(r.id) === 1 ? "time" : "times"})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="refresh" className="space-y-3">
        <H2 id="refresh">How fresh the facts are</H2>
        <p>
          Versions, licences and free tiers change, so every score and fact carries the date it was checked
          {checkedDates.length > 0 && (
            <>
              {" "}
              (currently between {checkedDates[0]} and {checkedDates[checkedDates.length - 1]})
            </>
          )}
          . The result shows that date, and marks a fact as &ldquo;due for a re-check&rdquo; once it is older than the
          window below. The whole knowledge base is reviewed every three months.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Kind of fact</TableHead>
              <TableHead scope="col">Re-check after</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(kb.meta.staleAfterDays).map(([kind, days]) => (
              <TableRow key={kind}>
                <TableCell className="whitespace-normal">{FACT_KINDS[kind] ?? kind}</TableCell>
                <TableCell className="tabular-nums">{days} days</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section aria-labelledby="rules" className="space-y-3">
        <H2 id="rules">Every rule</H2>
        <p className="text-sm text-muted-foreground">
          A rule&apos;s points on one option add up to at most ±{kb.meta.caps.rules}.
        </p>
        <div className="space-y-3">
          {RULE_GROUPS.map(({ prefix, title }) => {
            const rules = kb.rules.filter((r) => r.id.startsWith(prefix));
            if (rules.length === 0) return null;
            return (
              <Group key={prefix} title={title} count={rules.length}>
                {rules.map((r) => (
                  <RuleCard
                    key={r.id}
                    id={r.id}
                    name={r.name}
                    text={r.explanation}
                    effects={[
                      ...r.effects.map(effectText),
                      ...(r.otherwise ? [`otherwise ${r.otherwise.map(effectText).join(", ")}`] : []),
                    ].join(", ")}
                    from={r.sources.map(sourceText).join("; ")}
                  />
                ))}
              </Group>
            );
          })}
          <Group title="Team skills" count={kb.skills.length}>
            {kb.skills.map((t) => (
              <RuleCard
                key={t.id}
                id={t.id}
                name={t.name}
                text=""
                effects=""
                from={t.sources.map(sourceText).join("; ")}
              />
            ))}
          </Group>
        </div>
      </section>

      <section aria-labelledby="limits" className="space-y-3">
        <H2 id="limits">Limits</H2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Scores describe typical use. Your team and your context can beat them or fall short of them.</li>
          <li>
            Version {kb.meta.kbVersion} ranks five parts. ORMs, authentication, queues and mobile apps come later (see
            the{" "}
            <Link href="/changelog" className="underline underline-offset-4">
              changelog
            </Link>
            ).
          </li>
          <li>The result is a starting point for a decision, not a replacement for your own judgement.</li>
        </ul>
      </section>
    </div>
  );
}
