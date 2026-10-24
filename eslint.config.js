import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";

export default tseslint.config(
  { ignores: ["node_modules/**", "coverage/**", "references/**", "docs/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    // Fitness function (same as Architecture Advisor): the engine and the data it reads stay pure
    // (no clock, randomness, network or runtime state).
    files: ["src/modules/scoring/**", "src/modules/knowledge-base/**"],
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
);
