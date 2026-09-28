"use server";

import { refresh } from "next/cache";
import { deleteChat as removeChat } from "@/lib/chat/store";
import { requireCase } from "@/lib/session";

/** Deletes one of the case's chats, with its messages, for both partners. */
export async function deleteChat(chatId: string) {
  const { caseId } = await requireCase();
  if (typeof chatId !== "string") return;
  await removeChat(chatId, caseId);
  refresh();
}
