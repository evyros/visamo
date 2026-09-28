import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests for code with no framework in it (lib/documents). `npm test`.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["lib/**/*.test.ts"] },
});
