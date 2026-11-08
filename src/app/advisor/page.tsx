import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ConstructionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Advisor" };

/** Placeholder until the form (Phase 3, step 2) and the result page (step 3) land. */
export default function AdvisorPage() {
  return (
    <section className="mx-auto max-w-xl space-y-5 rounded-2xl border bg-card p-8 text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-brand-muted text-primary">
        <ConstructionIcon className="size-5" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">The advisor form is being built</h1>
      <p className="text-muted-foreground">
        The rule engine and knowledge base are done; the questions and the full result page come next.
      </p>
      <Button asChild variant="outline">
        <Link href="/">
          <ArrowLeftIcon aria-hidden /> Back to the home page
        </Link>
      </Button>
    </section>
  );
}
