import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // server-only throws outside a React Server build; in unit tests it is a no-op.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/modules/**/*.ts"],
      exclude: ["src/modules/**/data/**"],
      thresholds: {
        "src/modules/ai/**": { lines: 90 },
        "src/modules/scoring/**": { lines: 95, branches: 90, functions: 95, statements: 95 },
        lines: 80,
      },
    },
  },
});
