import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Tech Stack Advisor keeps, what the optional AI explanation sends, and to whom.",
};

const link = "underline underline-offset-4";

/** Checked against the providers' own pages (docs/RESEARCH.md §9). */
const CHECKED = "9 November 2026";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-muted-foreground">
          Short version: no accounts, no cookies, no analytics. The recommendation is worked out in your browser. Only
          the optional AI explanation sends anything to a server, and you can turn it off.
        </p>
      </div>

      <section aria-labelledby="answers" className="space-y-2">
        <h2 id="answers" className="text-xl font-semibold">
          Your answers
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The stack, rankings and comparison come from a rule engine that runs in your browser. Your answers stay in
            this browser tab (session storage): a refresh keeps them, a new visit starts fresh, and &ldquo;Start
            over&rdquo; deletes them.
          </li>
          <li>
            &ldquo;Copy link&rdquo; puts your answers in the part of the link after the &ldquo;#&rdquo;, which browsers
            don&apos;t send to our server. Anyone you give the link to can see the answers. Your notes and your AI
            choice are never put in a link.
          </li>
          <li>&ldquo;Download Markdown&rdquo; and &ldquo;Print&rdquo; happen in your browser.</li>
        </ul>
      </section>

      <section aria-labelledby="ai" className="space-y-2">
        <h2 id="ai" className="text-xl font-semibold">
          The AI explanation (optional)
        </h2>
        <p>
          When AI explanations are turned on for this site, the result page asks our server for a short explanation in
          plain words. The result page says when they are off.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium">What is sent:</span> your answers and the notes you typed on the last step,
            plus the rule engine&apos;s result. Before the notes leave our server, obvious email addresses, phone
            numbers, links with tokens and key-like strings are replaced with &ldquo;[redacted]&rdquo;. That is a safety
            net, not a guarantee, so please don&apos;t put passwords, personal or confidential details in your notes.
            Nothing that identifies you (no IP address, no cookie) is put in the AI request.
          </li>
          <li>
            <span className="font-medium">To whom:</span> first Google Gemini; if it is slow or busy, Groq. Both are
            used on their free tiers.
          </li>
          <li>
            <span className="font-medium">How they use it</span> (from their terms, checked {CHECKED}): Google says
            content sent to its unpaid Gemini API is used to improve its products and may be read by human reviewers.
            Groq says it doesn&apos;t keep requests by default, but may log them for up to 30 days to fix reliability
            problems or investigate abuse.
          </li>
          <li>
            <span className="font-medium">Turning it off:</span> tick &ldquo;Don&apos;t use AI for this request&rdquo;
            under the notes box. Then nothing is sent to our server or to an AI service; the result is the same rule
            result, without the explanation.
          </li>
          <li>
            <span className="font-medium">What the AI can change:</span> at most three small score adjustments (±5
            points) to options already in the top five of a part, each with a reason you can see. The rule engine then
            puts the stack together again; the AI never picks it or builds the comparison.
          </li>
        </ul>
      </section>

      <section aria-labelledby="server" className="space-y-2">
        <h2 id="server" className="text-xl font-semibold">
          What our server keeps
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Logs hold only which AI service answered, how long it took and whether it worked: never your notes or the
            AI&apos;s text.
          </li>
          <li>
            An answer for exactly the same answers and notes is reused for up to 30 days, so identical requests
            don&apos;t use the AI again. It is stored under a scrambled key (a hash), with no notes.
          </li>
          <li>
            To stop one visitor using up the shared free AI quota, the server counts requests per scrambled IP address
            (a hash, not the address) for up to a day.
          </li>
          <li>
            The site is hosted on Vercel, which handles the network requests like any web host (
            <a href="https://vercel.com/legal/privacy-policy" className={link}>
              Vercel privacy policy
            </a>
            ).
          </li>
        </ul>
      </section>

      <section aria-labelledby="terms" className="space-y-2">
        <h2 id="terms" className="text-xl font-semibold">
          The providers&apos; own terms
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <a href="https://ai.google.dev/gemini-api/terms" className={link}>
              Gemini API Additional Terms of Service
            </a>{" "}
            and the{" "}
            <a href="https://policies.google.com/privacy" className={link}>
              Google Privacy Policy
            </a>
          </li>
          <li>
            <a href="https://console.groq.com/docs/your-data" className={link}>
              Groq: your data
            </a>{" "}
            and the{" "}
            <a href="https://groq.com/privacy-policy" className={link}>
              Groq Privacy Policy
            </a>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          More about the project on the{" "}
          <Link href="/about" className={link}>
            About page
          </Link>
          ; how the AI is bounded is in the{" "}
          <a
            href="https://github.com/lochana-dahanayake/tech-stack-advisor/blob/main/docs/AI_INTEGRATION.md"
            className={link}
          >
            AI design notes
          </a>
          .
        </p>
      </section>
    </div>
  );
}
