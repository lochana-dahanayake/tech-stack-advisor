import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/modules/**/*.ts"],
      exclude: ["src/modules/**/data/**"],
      thresholds: {
        "src/modules/scoring/**": { lines: 95, branches: 90, functions: 95, statements: 95 },
        lines: 80,
      },
    },
  },
});
