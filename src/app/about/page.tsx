import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "What Tech Stack Advisor is, what it does with your answers, and its limits.",
};

const link = "underline underline-offset-4";

export default function AboutPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>

      <section aria-labelledby="what" className="space-y-2">
        <h2 id="what" className="text-xl font-semibold">
          What this is
        </h2>
        <p>
          A free tool that helps students and small teams choose a tech stack: a language, frontend, backend, database
          and hosting that work together. A rule engine built on published books, official docs and developer surveys
          ranks the options; the{" "}
          <Link href="/methodology" className={link}>
            methodology page
          </Link>{" "}
          shows every rule, source and date it uses.
        </p>
        <p>
          It is the companion of{" "}
          <a href="https://architecture-advisor-pink.vercel.app" className={link}>
            Architecture Advisor
          </a>
          , which helps choose an architecture style. A style chosen there can be carried over here and nudges a few
          picks.
        </p>
      </section>

      <section aria-labelledby="privacy" className="space-y-2">
        <h2 id="privacy" className="text-xl font-semibold">
          Your answers
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>No accounts, no cookies, no analytics.</li>
          <li>
            The result is worked out in your browser. Your answers stay in this browser tab (session storage), so a
            refresh keeps them and a new visit starts fresh. &ldquo;Start over&rdquo; deletes them.
          </li>
          <li>
            &ldquo;Copy link&rdquo; puts your answers in the part of the link after the &ldquo;#&rdquo;. Browsers
            don&apos;t send that part to our server, but anyone you give the link to can see the answers.
          </li>
          <li>
            The plain-words AI explanation is optional. The{" "}
            <Link href="/privacy" className={link}>
              privacy page
            </Link>{" "}
            says exactly what it sends, to whom, and how to turn it off.
          </li>
        </ul>
      </section>

      <section aria-labelledby="limits" className="space-y-2">
        <h2 id="limits" className="text-xl font-semibold">
          Limits
        </h2>
        <p>
          The result is a starting point for a conversation, not a final answer. Tools change quickly, so every fact
          shows the date it was checked; your own context and your team matter more than any general score.
        </p>
      </section>

      <section aria-labelledby="source" className="space-y-2">
        <h2 id="source" className="text-xl font-semibold">
          Open source
        </h2>
        <p>
          The code and the knowledge base are public on{" "}
          <a href="https://github.com/lochana-dahanayake/tech-stack-advisor" className={link}>
            GitHub
          </a>
          , so you can check all of this yourself. What changed in each version is in the{" "}
          <Link href="/changelog" className={link}>
            changelog
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
