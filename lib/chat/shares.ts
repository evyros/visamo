import "server-only";
import { randomBytes } from "node:crypto";
import { cache } from "react";
import { and, asc, eq, gt, isNull, sql } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { db } from "@/lib/db";
import { chat, chatMessage, chatShare } from "@/lib/db/schema";
import { site } from "@/lib/site";
import { shareDays, type ShareDuration } from "./share-options";
import type { ChatRole } from "./store";

// Public links to a chat (chat_share). Either partner can share one of the
// case's chats, and anyone with the link can read it at
// app.visamo.co.il/shared/<token>, without anyone's name, until it expires or
// the chat is deleted. There's no stopping a link: deleting the chat does
// that. The page shows the chat as it is now, so messages sent after sharing
// show too. Callers check the chat is the case's (inCase in lib/chat/store.ts).

export type ShareLink = { url: string; expiresAt: Date };

const DAY_MS = 24 * 60 * 60 * 1000;

const linkOf = ({ token, expiresAt }: { token: string; expiresAt: Date }): ShareLink => ({
  url: new URL(`/shared/${token}`, site.appUrl).toString(),
  expiresAt,
});

/** The chat's link that still works: at most one. */
const working = (chatId: string, caseId: string) =>
  and(
    eq(chatShare.chatId, chatId),
    eq(chatShare.caseId, caseId),
    isNull(chatShare.revokedAt),
    gt(chatShare.expiresAt, sql`now()`),
  );

/** The chat's working link, or null. */
export async function activeShare(chatId: string, caseId: string) {
  const [row] = await db
    .select({ token: chatShare.token, expiresAt: chatShare.expiresAt })
    .from(chatShare)
    .where(working(chatId, caseId))
    .limit(1);
  return row ? linkOf(row) : null;
}

/** A new link to the chat, replacing the one that works now. `locale` is the app's language as it's shared. */
export async function createShare(
  chatId: string,
  caseId: string,
  userId: string,
  duration: ShareDuration,
  locale: Locale,
) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + shareDays[duration] * DAY_MS);
  await db.batch([
    db.update(chatShare).set({ revokedAt: new Date() }).where(working(chatId, caseId)),
    db.insert(chatShare).values({ id: crypto.randomUUID(), chatId, caseId, token, createdBy: userId, locale, expiresAt }),
  ]);
  return linkOf({ token, expiresAt });
}

export type SharedMessage = { id: string; role: ChatRole; content: string };

/**
 * The chat a link opens, if the link still works and the chat isn't deleted.
 * Only what the public page shows: the title, the messages (never who wrote
 * them), and the language it was shared in.
 */
export const findSharedChat = cache(async (token: string) => {
  const [row] = await db
    .select({ chatId: chat.id, title: chat.title, locale: chatShare.locale })
    .from(chatShare)
    .innerJoin(chat, eq(chat.id, chatShare.chatId))
    .where(
      and(
        eq(chatShare.token, token),
        isNull(chatShare.revokedAt),
        gt(chatShare.expiresAt, sql`now()`),
        isNull(chat.deletedAt),
      ),
    )
    .limit(1);
  if (!row) return null;
  const messages = await db
    .select({ id: chatMessage.id, role: chatMessage.role, content: chatMessage.content })
    .from(chatMessage)
    .where(eq(chatMessage.chatId, row.chatId))
    .orderBy(asc(chatMessage.createdAt));
  return { title: row.title, locale: row.locale, messages: messages as SharedMessage[] };
});
