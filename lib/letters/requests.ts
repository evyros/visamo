import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { db } from "@/lib/db";
import { letterRequest } from "@/lib/db/schema";
import { localePath, site } from "@/lib/site";
import { INVITES_PER_REQUEST, LETTERS_PER_REQUEST, letterTokenPattern } from "./rules";
import type { LetterSource } from "./tracking";

// A couple's request for recommendation letters: their names, where letters
// go, and how many have been sent. The website makes one per form submitted
// (app/[lang]/tools/recommendation-letter); its id is the link for friends.

export type LetterRequest = typeof letterRequest.$inferSelect;

export async function createLetterRequest({
  names,
  email,
  locale,
  source,
}: {
  names: [string, string];
  /** Where letters are emailed; null for a couple who gave none. */
  email: string | null;
  locale: Locale;
  source: LetterSource;
}) {
  const id = randomBytes(16).toString("base64url");
  await db.insert(letterRequest).values({ id, names, email: email?.toLowerCase() ?? null, locale, source });
  return id;
}

export async function findLetterRequest(id: string): Promise<LetterRequest | null> {
  if (!letterTokenPattern.test(id)) return null;
  const [row] = await db.select().from(letterRequest).where(eq(letterRequest.id, id)).limit(1);
  return row ?? null;
}

/**
 * The friend's page. Always Hebrew: the writers are Israelis, and the letter
 * is in Hebrew. Invite emails mark it ?via=email, for the stats.
 */
export function letterUrl(id: string, via?: "email") {
  const url = new URL(localePath("he", `/letter/${id}`), site.url);
  if (via) url.searchParams.set("via", via);
  return url.toString();
}

/**
 * Takes one of the request's letters or invites before sending it, so two
 * sends at once can't pass the cap. False when it's used up. A send that
 * fails gives it back (`release`).
 */
export async function reserve(id: string, kind: "letter" | "invite", count = 1) {
  const column = kind === "letter" ? letterRequest.lettersSent : letterRequest.invitesSent;
  const cap = kind === "letter" ? LETTERS_PER_REQUEST : INVITES_PER_REQUEST;
  const updated = await db
    .update(letterRequest)
    .set(kind === "letter" ? { lettersSent: sql`${column} + ${count}` } : { invitesSent: sql`${column} + ${count}` })
    .where(and(eq(letterRequest.id, id), sql`${column} + ${count} <= ${cap}`))
    .returning({ id: letterRequest.id });
  return updated.length > 0;
}

export async function release(id: string, kind: "letter" | "invite", count = 1) {
  const column = kind === "letter" ? letterRequest.lettersSent : letterRequest.invitesSent;
  await db
    .update(letterRequest)
    .set(kind === "letter" ? { lettersSent: sql`${column} - ${count}` } : { invitesSent: sql`${column} - ${count}` })
    .where(eq(letterRequest.id, id));
}
