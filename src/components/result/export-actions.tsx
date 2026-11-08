"use client";

import { FileTextIcon, PrinterIcon } from "lucide-react";
import { kb } from "@/modules/knowledge-base";
import type { Recommendation } from "@/modules/recommendation";
import type { UserInput } from "@/modules/scoring";
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

/** "Download Markdown" (for a design doc, ADR or pull request) and "Print". */
export function ExportActions({ rec, input, date }: { rec: Recommendation; input: UserInput; date: string }) {
  return (
    <>
      <Button
        variant="outline"
        onClick={() =>
          download(resultToMarkdown(rec, input, kb, { date, appVersion: APP_VERSION }), `tech-stack-${date}.md`)
        }
      >
        <FileTextIcon aria-hidden /> Download Markdown
      </Button>
      <Button variant="ghost" onClick={() => window.print()}>
        <PrinterIcon aria-hidden /> Print
      </Button>
    </>
  );
}
