import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { loadMessages } from "@/i18n/messages";
import { adminEmail } from "./admin";
import { db } from "./db";
import { cases } from "./db/schema";
import { documentTitle } from "./documents/titles";
import { sendAdminNotice } from "./email";
import { site } from "./site";

// Emails to the admin about something to do in the admin panel.

/**
 * Marks the case's first upload, and returns whether this one was it: only
 * one upload can mark it, even when both partners upload at once.
 */
export async function markFirstUpload(caseId: string) {
  // updated_at stays: this isn't a change to the case's details.
  const [marked] = await db
    .update(cases)
    .set({ firstUploadAt: new Date(), updatedAt: sql`${cases.updatedAt}` })
    .where(and(eq(cases.id, caseId), isNull(cases.firstUploadAt)))
    .returning({ id: cases.id });
  return !!marked;
}

/**
 * Tells the admin a case uploaded its first file, so they can check its
 * documents (the free check, lib/checks/free.ts). Never throws: it's sent
 * after the upload's answer.
 */
export async function notifyFirstUpload(uploader: { id: string; name: string; email: string }, documentKey: string) {
  const to = adminEmail();
  if (!to) return;
  try {
    const texts = (await loadMessages("en")).app.documents;
    const document = documentTitle(documentKey, texts, "en") ?? documentKey;
    await sendAdminNotice({
      to,
      subject: `First upload: ${uploader.name || uploader.email}`,
      lines: [`${uploader.name || "A user"} (${uploader.email}) uploaded their first file.`, `Document: ${document}`],
      url: `${site.adminUrl}/users/${uploader.id}/documents`,
    });
  } catch (error) {
    console.error("notifyFirstUpload failed", uploader.id, error);
  }
}
