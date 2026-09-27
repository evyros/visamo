import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Neon over HTTP: no connection pool to manage in serverless functions. It
// doesn't support interactive transactions, so the auth adapter runs its
// multi-step writes one after another (see lib/auth.ts).

type Database = NeonHttpDatabase<typeof schema>;
let instance: Database | undefined;

function connect(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");
  return drizzle(neon(url), { schema });
}

// Connects on first use, so `next build` doesn't need DATABASE_URL.
export const db = new Proxy({} as Database, {
  get(_, key) {
    instance ??= connect();
    const value = Reflect.get(instance, key);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
