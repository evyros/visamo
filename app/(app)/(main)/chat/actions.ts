"use server";

import { refresh } from "next/cache";
import { getAppLocale } from "@/i18n/app-locale";
import { isShareDuration, type ShareDuration } from "@/lib/chat/share-options";
import { activeShare, createShare } from "@/lib/chat/shares";
import { inCase, deleteChat as removeChat } from "@/lib/chat/store";
import { requireCase } from "@/lib/session";

/** Deletes one of the case's chats, with its messages, for both partners. */
export async function deleteChat(chatId: string) {
  const { user, caseId } = await requireCase();
  if (typeof chatId !== "string") return;
  await removeChat(chatId, caseId, user.id);
  refresh();
}

/** The public link to one of the case's chats that works now, or null. */
export async function chatShareLink(chatId: string) {
  const { caseId } = await requireCase();
  if (typeof chatId !== "string" || !(await inCase(chatId, caseId))) return null;
  return activeShare(chatId, caseId);
}

/** A new public link to one of the case's chats, replacing the one it has. Null if the chat isn't theirs. */
export async function shareChat(chatId: string, duration: ShareDuration) {
  const { user, caseId } = await requireCase();
  if (typeof chatId !== "string" || !isShareDuration(duration) || !(await inCase(chatId, caseId))) return null;
  return createShare(chatId, caseId, user.id, duration, await getAppLocale());
}
