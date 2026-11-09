"use client";

import { useId, useState } from "react";
import { ChevronDownIcon, FileTextIcon, LinkIcon, PrinterIcon, Share2Icon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import type { Recommendation } from "@/modules/recommendation";
import type { UserInput } from "@/modules/scoring";
import { encodeShareHash } from "@/components/form/share-link";
import { Button } from "@/components/ui/button";
import { APP_VERSION } from "@/lib/version";
import { resultToMarkdown } from "./markdown";

function download(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** The /advisor URL that reopens this result (the answers are in the hash, which never reaches the server). */
const shareUrl = (input: UserInput) => `${window.location.origin}${window.location.pathname}${encodeShareHash(input)}`;

/** "Copy link": copies a URL that reopens this result; shows the link to copy by hand if the clipboard is blocked. */
function CopyLink({ input }: { input: UserInput }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(input));
      setState("copied");
    } catch {
      setState("failed");
    }
  };
  return (
    <>
      <Button variant="ghost" onClick={() => void copy()}>
        <LinkIcon aria-hidden /> {state === "copied" ? "Link copied" : "Copy link"}
      </Button>
      <p className="sr-only" aria-live="polite">
        {state === "copied" ? "Link copied." : ""}
      </p>
      {state !== "idle" && (
        <div className="order-last basis-full space-y-1 px-2 pb-1 text-sm text-muted-foreground">
          {state === "failed" && (
            <label className="block space-y-1">
              <span>Your browser blocked copying. Copy this link instead:</span>
              <input
                readOnly
                value={shareUrl(input)}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-md border bg-background px-2 py-1 font-mono text-xs text-foreground"
              />
            </label>
          )}
          <p>The link holds your answers, so anyone you send it to sees this same result.</p>
        </div>
      )}
    </>
  );
}

/**
 * "Share & save" (sibling pattern): copy link, Markdown and print behind one toggle that opens inline below the
 * header buttons, so the header leads with the next step and no positioning library is shipped for a menu.
 */
export function ExportActions({ rec, input, date }: { rec: Recommendation; input: UserInput; date: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <Button
        variant="outline"
        className="group"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <Share2Icon aria-hidden /> Share &amp; save
        <ChevronDownIcon className="transition-transform group-aria-expanded:rotate-180" aria-hidden />
      </Button>
      <div id={id} hidden={!open} className="basis-full">
        <div className="flex flex-wrap gap-2 rounded-lg bg-muted/50 p-2">
          <CopyLink input={input} />
          <Button
            variant="ghost"
            onClick={() =>
              download(
                resultToMarkdown(rec, input, kb, { date, appVersion: APP_VERSION, link: shareUrl(input) }),
                `tech-stack-${date}.md`,
              )
            }
          >
            <FileTextIcon aria-hidden /> Download Markdown
          </Button>
          <Button variant="ghost" onClick={() => window.print()}>
            <PrinterIcon aria-hidden /> Print
          </Button>
        </div>
      </div>
    </>
  );
}
