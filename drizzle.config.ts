import { defineConfig } from "drizzle-kit";

// `npm run db:push` syncs lib/db/schema.ts to the Neon database in DATABASE_URL.
// Next loads .env.local on its own; drizzle-kit needs it spelled out.
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: DATABASE_URL comes from the shell or CI.
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
