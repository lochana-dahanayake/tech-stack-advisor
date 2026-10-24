import type { KnowledgeBase } from "@/modules/knowledge-base";
import { score, type PartResult } from "@/modules/scoring";
import { golden, probes, teamLanguagePick } from "./golden";
import { variants } from "./variants";

const f = (x: number) => x.toFixed(1);

function types(p: PartResult): string {
  if (!p.needed) return `not needed (${p.notNeededBy})`;
  return p.types.map((t) => `${t.id} ${f(t.final)}`).join("; ") + (p.closeCall ? ` (close call: ${p.closeCall})` : "");
}

/** The calibration tables of KNOWLEDGE_BASE_DRAFT §5/§10 for one KB variant, as markdown. */
export function calibrationTables(variantName: string, kb: KnowledgeBase): string {
  const variant = variants[variantName];
  if (!variant) throw new Error(`unknown variant ${variantName}; one of ${Object.keys(variants).join(", ")}`);
  const k = variant.apply(kb);
  const out = [`Variant: ${variantName}: ${variant.description}. KB ${k.meta.kbVersion}.`, ""];
  for (const part of ["database", "backend"] as const) {
    out.push(`## ${part}`, "| Scenario | Types | Products |", "|---|---|---|");
    for (const s of [...golden, ...probes]) {
      const r = score(s.input, k);
      const p = r.parts[part]!;
      let products = "—";
      if (p.needed && part === "database") {
        products = p.products
          .filter((x) => x.types.includes(p.chosenType!))
          .slice(0, 3)
          .map((x) => `${x.id} ${f(x.final)}`)
          .join(", ");
      } else if (p.needed) {
        const top = p.products
          .slice(0, 3)
          .map((x) => `${x.id} ${f(x.cand)}`)
          .join(", ");
        const pick = teamLanguagePick(r, s.input, k);
        const row = p.products.find((x) => x.id === pick);
        products = `${top}; team language: ${pick} ${row ? f(row.cand) : ""}`;
      }
      out.push(`| ${s.id} ${s.title} | ${types(p)} | ${products} |`);
    }
    out.push("");
  }
  return out.join("\n");
}
