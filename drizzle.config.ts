import { defineConfig } from "drizzle-kit";

// `npm run db:generate` writes a migration to drizzle/ from changes to
// lib/db/schema.ts; scripts/migrate.mjs applies them. Studio connects directly.
// Next loads .env.local and .env on its own; drizzle-kit needs them spelled
// out. Like Next, .env.local wins, since loadEnvFile keeps values already set.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // Missing file: DATABASE_URL comes from the other file, the shell or CI.
  }
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)!,
  },
});
