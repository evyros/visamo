import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { casePerson, cases, chat, chatMessage } from "@/lib/db/schema";

// Chats, and the message balance (lib/credits.ts spends it). Chats belong to
// the case: both partners see them all. A chat is only ever read with the
// case's id, so no one can open a chat from another case. A deleted chat is
// only hidden: it's gone for both partners, and kept for the admin panel
// (lib/admin-chats.ts).

export type ChatRole = "user" | "assistant";

/** Whether the case has bought anything, and the messages it has left. */
export async function chatBalance(caseId: string) {
  const [row] = await db
    .select({ paid: cases.paid, messagesLeft: cases.messagesLeft })
    .from(cases)
    .where(eq(cases.id, caseId))
    .limit(1);
  return { paid: row?.paid ?? false, messagesLeft: row?.messagesLeft ?? 0 };
}

/** The case's chats, latest first, for the sidebar. */
export async function listChats(caseId: string) {
  return db
    .select({ id: chat.id, title: chat.title })
    .from(chat)
    .where(and(eq(chat.caseId, caseId), isNull(chat.deletedAt)))
    .orderBy(desc(chat.updatedAt));
}

/** Whether the chat is the case's, and not deleted. */
export async function inCase(chatId: string, caseId: string) {
  const [row] = await db
    .select({ id: chat.id })
    .from(chat)
    .where(and(eq(chat.id, chatId), eq(chat.caseId, caseId), isNull(chat.deletedAt)))
    .limit(1);
  return !!row;
}

export type StoredMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** Who wrote it, for a user message; null for answers, or a deleted account. */
  userId: string | null;
  /** Their name in the case. */
  name: string | null;
};

/** A chat's messages, oldest first; null if it isn't the case's, or was deleted. */
export async function chatMessages(chatId: string, caseId: string): Promise<StoredMessage[] | null> {
  if (!(await inCase(chatId, caseId))) return null;
  const rows = await db
    .select({
      id: chatMessage.id,
      role: chatMessage.role,
      content: chatMessage.content,
      userId: chatMessage.userId,
      name: casePerson.name,
    })
    .from(chatMessage)
    .leftJoin(casePerson, eq(casePerson.userId, chatMessage.userId))
    .where(eq(chatMessage.chatId, chatId))
    .orderBy(asc(chatMessage.createdAt));
  return rows as StoredMessage[];
}

/** Hides the chat from both partners; its messages are kept. */
export async function deleteChat(chatId: string, caseId: string, userId: string) {
  await db
    .update(chat)
    .set({ deletedAt: new Date(), deletedBy: userId })
    .where(and(eq(chat.id, chatId), eq(chat.caseId, caseId), isNull(chat.deletedAt)));
}
