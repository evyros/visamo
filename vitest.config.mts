import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for code with no framework in it (lib, and the evals' grading). `npm test`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./lib/files/testing/server-only.ts", import.meta.url)),
    },
  },
  test: { include: ["lib/**/*.test.ts", "evals/**/*.test.ts"] },
});
