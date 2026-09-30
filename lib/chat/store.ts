import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { casePerson, cases, chat, chatMessage } from "@/lib/db/schema";
import type { Plan } from "./plans";

// Chats, and the message balance (lib/credits.ts spends it). Chats belong to
// the case: both partners see them all. A chat is only ever read with the
// case's id, so no one can open a chat from another case.

export type ChatRole = "user" | "assistant";

/** The case's plan and the messages it has left. */
export async function chatBalance(caseId: string) {
  const [row] = await db
    .select({ plan: cases.plan, messagesLeft: cases.messagesLeft })
    .from(cases)
    .where(eq(cases.id, caseId))
    .limit(1);
  return { plan: (row?.plan ?? "free") as Plan, messagesLeft: row?.messagesLeft ?? 0 };
}

/** The case's chats, latest first, for the sidebar. */
export async function listChats(caseId: string) {
  return db
    .select({ id: chat.id, title: chat.title })
    .from(chat)
    .where(eq(chat.caseId, caseId))
    .orderBy(desc(chat.updatedAt));
}

/** Whether the chat is the case's. */
export async function inCase(chatId: string, caseId: string) {
  const [row] = await db
    .select({ id: chat.id })
    .from(chat)
    .where(and(eq(chat.id, chatId), eq(chat.caseId, caseId)))
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

/** A chat's messages, oldest first; null if it isn't the case's. */
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

export async function deleteChat(chatId: string, caseId: string) {
  await db.delete(chat).where(and(eq(chat.id, chatId), eq(chat.caseId, caseId)));
}
