import "server-only";
import { and, asc, count, desc, eq, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";
import { chat, chatMessage, user } from "./db/schema";

// A case's chats for the admin panel: all of them, deleted ones included,
// where the app shows only what's current (lib/chat/store.ts).

const starter = alias(user, "starter");
const remover = alias(user, "remover");
const author = alias(user, "author");

/** A message's id on its chat's page. */
export const messageId = (id: string) => `message-${id}`;

/** A chat's page, and a message on it. */
export const chatHref = (userId: string, chatId: string, message?: string) =>
  `/users/${userId}/chats/${chatId}${message ? `#${messageId(message)}` : ""}`;

/** A chat's title, or what stands in for one before it's written. */
export const chatTitle = (chat: { title: string | null }) => chat.title ?? "Untitled chat";

/** Chats with who started and who deleted them, and how many messages they have, latest first. */
async function chats(where: SQL | undefined) {
  const messages = db
    .select({ chatId: chatMessage.chatId, count: count().as("count") })
    .from(chatMessage)
    .innerJoin(chat, eq(chat.id, chatMessage.chatId))
    .where(where)
    .groupBy(chatMessage.chatId)
    .as("messages");
  const rows = await db
    .select({
      chat,
      createdByName: starter.name,
      deletedByName: remover.name,
      messages: messages.count,
    })
    .from(chat)
    .leftJoin(starter, eq(starter.id, chat.createdBy))
    .leftJoin(remover, eq(remover.id, chat.deletedBy))
    .leftJoin(messages, eq(messages.chatId, chat.id))
    .where(where)
    .orderBy(desc(chat.updatedAt));
  return rows.map(({ chat, createdByName, deletedByName, messages }) => ({
    ...chat,
    createdByName,
    deletedByName,
    messages: messages ?? 0,
  }));
}

/** Every chat of the case, latest first. */
export const allCaseChats = (caseId: string) => chats(eq(chat.caseId, caseId));

export type AdminChat = Awaited<ReturnType<typeof allCaseChats>>[number];

/** One of the case's chats, deleted or not, with its messages oldest first; null if it isn't the case's. */
export async function caseChat(caseId: string, chatId: string) {
  const [found] = await chats(and(eq(chat.caseId, caseId), eq(chat.id, chatId)));
  if (!found) return null;
  const messages = await db
    .select({
      id: chatMessage.id,
      role: chatMessage.role,
      content: chatMessage.content,
      createdAt: chatMessage.createdAt,
      authorName: author.name,
    })
    .from(chatMessage)
    .leftJoin(author, eq(author.id, chatMessage.userId))
    .where(eq(chatMessage.chatId, chatId))
    .orderBy(asc(chatMessage.createdAt));
  return { chat: found, messages };
}
