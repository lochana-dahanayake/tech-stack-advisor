/**
 * Fitness functions for module boundaries (ARCHITECTURE.md §2, sibling ADR-004).
 * Allowed: app → components → recommendation → scoring → knowledge-base.
 * app/api → ai, platform, recommendation, scoring, knowledge-base; ai → recommendation, scoring, knowledge-base,
 * platform; platform → nothing of ours (Phase 4, AI_INTEGRATION §12).
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
      name: "ai-boundary",
      comment: "The AI module uses the pure modules and platform only: never UI code (AI_INTEGRATION §12).",
      severity: "error",
      from: { path: "^src/modules/ai/" },
      to: { path: "^src/modules/", pathNot: ["^src/modules/(ai|recommendation|scoring|knowledge-base|platform)/"] },
    },
    {
      name: "platform-is-a-leaf",
      comment: "Platform (env, store, rate limits) depends on none of our modules.",
      severity: "error",
      from: { path: "^src/modules/platform/" },
      to: { path: "^src/", pathNot: "^src/modules/platform/" },
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
      comment:
        "Components and pages never import server-only modules (platform, the AI layer). AI types live in recommendation.",
      severity: "error",
      from: { path: "^src/(components|lib)/|^src/app/(?!api/)" },
      to: { path: ["^src/modules/platform/", "^src/modules/ai/", "node_modules/server-only/"] },
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
