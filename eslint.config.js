import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "references/**",
    "docs/**",
    "test-results/**",
    // Local agent tooling (graft index, Claude Code helpers), not app code.
    ".claude/**",
    "graft/**",
  ]),
  prettier,
  {
    // Fitness function (same as Architecture Advisor): the engine and the data it reads stay pure
    // (no clock, randomness, network, browser state or framework code).
    files: ["src/modules/scoring/**", "src/modules/knowledge-base/**", "src/modules/recommendation/**"],
    rules: {
      "no-restricted-globals": [
        "error",
        ...[
          "fetch",
          "Date",
          "window",
          "document",
          "localStorage",
          "sessionStorage",
          "setTimeout",
          "setInterval",
          "crypto",
          "process",
        ].map((name) => ({
          name,
          message: "Pure modules must not use the clock, randomness, network or runtime state.",
        })),
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "Pure modules must be deterministic." },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["react", "react-dom", "next", "next/*", "node:*"], message: "The engine stays framework-free." },
          ],
        },
      ],
    },
  },
]);
