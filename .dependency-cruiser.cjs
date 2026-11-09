/**
 * Fitness functions for module boundaries (ARCHITECTURE.md §2, sibling ADR-004).
 * Allowed: app → components → recommendation → scoring → knowledge-base.
 * `ai/` and `platform/` (Phase 4) get their own rules when they exist; the rules below already keep them
 * out of the pure modules.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "kb-is-a-leaf",
      comment: "The knowledge base depends on nothing but Zod.",
      severity: "error",
      from: { path: "^src/modules/knowledge-base/" },
      to: { pathNot: ["^src/modules/knowledge-base/", "node_modules/zod/"] },
    },
    {
      name: "scoring-is-pure",
      comment: "The engine imports only the knowledge base: no React, Next, network, AI or platform code.",
      severity: "error",
      from: { path: "^src/modules/scoring/" },
      to: { pathNot: ["^src/modules/(scoring|knowledge-base)/", "node_modules/zod/"] },
    },
    {
      name: "recommendation-boundary",
      comment: "Builds the result object from the engine and KB only.",
      severity: "error",
      from: { path: "^src/modules/recommendation/" },
      to: { pathNot: ["^src/modules/(recommendation|scoring|knowledge-base)/", "node_modules/zod/"] },
    },
    {
      name: "modules-dont-import-ui",
      comment: "Domain modules never depend on the UI layer.",
      severity: "error",
      from: { path: "^src/modules/" },
      to: { path: "^src/(app|components|lib)/" },
    },
    {
      name: "no-server-code-in-client",
      comment: "Components and pages never import server-only modules (platform, AI providers).",
      severity: "error",
      from: { path: "^src/(components|lib)/|^src/app/(?!api/)" },
      to: { path: ["^src/modules/platform/", "^src/modules/ai/providers/", "node_modules/server-only/"] },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
    exclude: { path: "\\.next" },
  },
};
