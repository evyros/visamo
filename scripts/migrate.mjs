// Applies pending migrations from drizzle/ to the database.
//
// `npm run build` runs this first. It only migrates on Vercel production
// builds: preview builds share the dev database, and a branch's migration
// shouldn't land there before it's merged. Local builds skip it too.
//
// `npm run db:migrate` passes --local to migrate the database in .env.local.
//
// Applied migrations are recorded in drizzle.__drizzle_migrations, so only
// newer files run. They run in one transaction: if any fails, none apply and
// the build stops before shipping code against a half-migrated schema.

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

const local = process.argv.includes("--local");

if (!local && process.env.VERCEL_ENV !== "production") {
  console.log("migrate: skipped (not a Vercel production build)");
  process.exit(0);
}

if (local) {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // Missing file: the URL comes from the other file or the shell.
    }
  }
}

// Direct connection: schema changes shouldn't go through the pooler.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("migrate: DATABASE_URL_UNPOOLED or DATABASE_URL must be set");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log(`migrate: up to date (${new URL(url).host})`);
} finally {
  await pool.end();
}
