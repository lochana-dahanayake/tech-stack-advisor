import type { KnowledgeBase } from "@/modules/knowledge-base";
import { score, type PartResult } from "@/modules/scoring";
import { golden, probes, teamLanguagePick, type Scenario } from "./golden";
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
  // Historic variants replay the scenario inputs of their time (variants.ts, inputs).
  const inputOf = (s: Scenario) => (variant.inputs ? variant.inputs(s) : s.input);
  const out = [`Variant: ${variantName}: ${variant.description}. KB ${k.meta.kbVersion}.`, ""];
  const hasFrontend = k.parts.some((p) => p.id === "frontend");
  const hasHosting = k.parts.some((p) => p.id === "hosting");
  // Stack columns: the parts this KB variant has, in a fixed order (older variants print fewer).
  const cols = ["frontend", "backend", "database", "hosting", "language"].filter(
    (id) => (id !== "frontend" || hasFrontend) && (id !== "hosting" || hasHosting),
  );
  for (const part of ["database", "backend"] as const) {
    out.push(`## ${part}`, "| Scenario | Types | Products |", "|---|---|---|");
    for (const s of [...golden, ...probes]) {
      const r = score(inputOf(s), k);
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
        const pick = teamLanguagePick(r, inputOf(s), k);
        const row = p.products.find((x) => x.id === pick);
        products = `${top}; team language: ${pick} ${row ? f(row.cand) : ""}`;
      }
      out.push(`| ${s.id} ${s.title} | ${types(p)} | ${products} |`);
    }
    out.push("");
  }
  // Added 2026-11-08: the frontend (Part 4) and hosting (Part 5) parts, only for KB variants that have them.
  for (const extra of ["frontend", "hosting"].filter((id) => cols.includes(id))) {
    out.push(`## ${extra}`, "| Scenario | Types | Products (final) |", "|---|---|---|");
    for (const s of [...golden, ...probes]) {
      const p = score(inputOf(s), k).parts[extra]!;
      const products = p.needed
        ? p.products
            .slice(0, 4)
            .map((x) => `${x.id} ${f(x.cand)}`)
            .join(", ")
        : "—";
      out.push(`| ${s.id} ${s.title} | ${types(p)} | ${products} |`);
    }
    out.push("");
  }
  // Added 2026-10-24 (Part 3): the language part and the assembled stack (step 6). Earlier log entries used the
  // "team language" stand-in above instead.
  out.push("## language", "| Scenario | Languages (final) |", "|---|---|");
  for (const s of [...golden, ...probes]) {
    const p = score(inputOf(s), k).parts.language;
    if (!p) continue;
    out.push(
      `| ${s.id} ${s.title} | ${p.needed ? p.products.map((x) => `${x.id} ${f(x.final)}`).join(", ") : `not needed (${p.notNeededBy})`} |`,
    );
  }
  out.push(
    "",
    "## stack",
    `| Scenario | Stack (${cols.join(" · ")}) | Score | Adjusted | Ties (step 6.6) | Close call (step 6.7) |${hasHosting ? " Notes |" : ""}`,
    `|---|---|---|---|---|---|${hasHosting ? "---|" : ""}`,
  );
  for (const s of [...golden, ...probes]) {
    const st = score(inputOf(s), k).stack;
    const pick = (id: string) => st.picks[id] ?? "—";
    const adj = st.adjusted.map((a) => `${a.partId}: ${a.best} → ${a.pick} (${a.relation})`).join("; ") || "—";
    const ties =
      st.ties.map((t) => `${t.partId}: ${t.options.join(" = ")} → ${t.pick} (${t.reason})`).join("; ") || "—";
    const close =
      st.closeCalls
        .map((c) => `${cols.map((id) => c.picks[id] ?? "—").join(" · ")} ${f(c.score)} (−${f(c.gap)})`)
        .join("; ") || "—";
    out.push(
      `| ${s.id} ${s.title} | ${cols.map(pick).join(" · ")} | ${f(st.score)} | ${adj}${st.conflict ? ` CONFLICT: ${st.conflict}` : ""} | ${ties} | ${close} |${hasHosting ? ` ${st.relationNotes.map((n) => n.id + (n.points ? ` ${n.points}` : "")).join(", ") || "—"} |` : ""}`,
    );
  }
  out.push("");
  return out.join("\n");
}
