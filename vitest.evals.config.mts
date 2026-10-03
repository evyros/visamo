import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The evals (evals/): the document check and the chat run against the real
// models, graded against cases a person approved. They cost money and take
// minutes, so they're apart from `npm test`. `npm run eval:checks`.

// The evals' own OpenRouter key, OPENROUTER_API_KEY_EVALS, so their spend is
// apart from the app's: it replaces OPENROUTER_API_KEY, which lib/chat/openrouter.ts
// reads, and the app's key is never used.
for (const file of [".env.local", ".env.development"]) if (existsSync(file)) process.loadEnvFile(file);
const key = process.env.OPENROUTER_API_KEY_EVALS;
if (!key) throw new Error("OPENROUTER_API_KEY_EVALS is not set: add it to .env.local.");
process.env.OPENROUTER_API_KEY = key;

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "server-only": fileURLToPath(new URL("./lib/files/testing/server-only.ts", import.meta.url)),
    },
  },
  test: {
    include: ["evals/**/*.eval.ts"],
    env: { OPENROUTER_API_KEY: key },
    testTimeout: 15 * 60_000,
    hookTimeout: 60_000,
    maxConcurrency: Number(process.env.EVAL_CONCURRENCY ?? 4),
  },
});
