import type { StackLabel } from "@/modules/recommendation";
import { optionName, orList } from "./format";

/** An option's place against the chosen stack, in words (result page and Markdown export). */
export function labelText(label: StackLabel): string {
  switch (label.kind) {
    case "in-stack":
      return label.locked ? "Must use (your choice)" : "In your stack";
    case "fits":
      return "Also fits";
    case "needs":
      return `Needs ${orList(label.ids)}`;
    case "clashes":
      return `Doesn't fit with ${optionName(label.with)}`;
  }
}
