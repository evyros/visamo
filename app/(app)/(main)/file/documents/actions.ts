"use server";

import { del, get, put } from "@vercel/blob";
import { and, count, eq, isNull } from "drizzle-orm";
import { caseDocuments, caseFiles } from "@/lib/case-documents";
import { db } from "@/lib/db";
import { caseFile } from "@/lib/db/schema";
import { MAX_FILE_BYTES, MAX_FILES_PER_DOCUMENT, sniffType } from "@/lib/files/rules";
import { filePath, thumbnailPath } from "@/lib/files/storage";
import { makeThumbnail } from "@/lib/files/thumbnail";
import { fileView, type FileView } from "@/lib/files/view";
import { recordEvent } from "@/lib/events";
import { requireCase } from "@/lib/session";

// Uploading a file for a document, in three steps:
//   1. startUpload: the server picks the file's id and path.
//   2. The browser uploads straight to the Blob store (api/files/upload).
//   3. finishUpload: the server checks the file, records it and makes its
//      thumbnail. Safe to call again for the same file (a retry).

export type UploadError = "notAllowed" | "tooMany" | "missing" | "type" | "size" | "generic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Whether the case's list has this item. */
async function allowed(caseId: string, documentKey: string): Promise<boolean> {
  return (await caseDocuments(caseId)).list.some((d) => d.key === documentKey);
}

export async function startUpload(documentKey: string): Promise<{ fileId: string; pathname: string } | { error: UploadError }> {
  const { caseId } = await requireCase();
  if (!(await allowed(caseId, documentKey))) return { error: "notAllowed" };
  const [{ files }] = await db
    .select({ files: count() })
    .from(caseFile)
    .where(and(eq(caseFile.caseId, caseId), eq(caseFile.documentKey, documentKey), isNull(caseFile.deletedAt)));
  if (files >= MAX_FILES_PER_DOCUMENT) return { error: "tooMany" };
  const fileId = crypto.randomUUID();
  return { fileId, pathname: filePath(caseId, fileId) };
}

async function readAll(stream: ReadableStream<Uint8Array>, limit: number): Promise<Uint8Array | null> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = stream.getReader();
  for (let part = await reader.read(); !part.done; part = await reader.read()) {
    size += part.value.length;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(part.value);
  }
  return Buffer.concat(chunks);
}

async function viewOf(caseId: string, fileId: string) {
  const row = (await caseFiles(caseId)).find((f) => f.id === fileId);
  return row && fileView(row);
}

export async function finishUpload(input: {
  fileId: string;
  documentKey: string;
  name: string;
}): Promise<{ file: FileView } | { error: UploadError }> {
  const { user, caseId } = await requireCase();
  const { fileId, documentKey } = input;
  if (typeof fileId !== "string" || !UUID.test(fileId)) return { error: "notAllowed" };

  // Already finished: a retry after the answer got lost.
  const done = await viewOf(caseId, fileId);
  if (done) return { file: done };
  if (!(await allowed(caseId, documentKey))) return { error: "notAllowed" };

  const path = filePath(caseId, fileId);
  try {
    // Straight from storage: it was only just written.
    const blob = await get(path, { access: "private", useCache: false });
    if (blob?.statusCode !== 200) return { error: "missing" };
    const bytes = await readAll(blob.stream, MAX_FILE_BYTES);
    // The browser's claimed type and size aren't trusted: check the contents.
    const type = bytes && sniffType(bytes);
    if (!bytes || !type) {
      // Rejected, so it never became a file: nothing to keep.
      await del(path);
      return { error: bytes ? "type" : "size" };
    }

    const thumbnail = await makeThumbnail(bytes, type);
    if (thumbnail) {
      await put(thumbnailPath(caseId, fileId), thumbnail, {
        access: "private",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    }
    const name = (typeof input.name === "string" ? input.name.trim() : "").slice(0, 200) || "file";
    // The event takes the file's id, so a retry racing this one doesn't log it twice.
    await db.batch([
      db
        .insert(caseFile)
        .values({
          id: fileId,
          caseId,
          documentKey,
          contentType: type,
          size: bytes.length,
          name,
          hasThumbnail: !!thumbnail,
          uploadedBy: user.id,
        })
        .onConflictDoNothing(),
      recordEvent(caseId, user.id, { type: "file.uploaded", data: { documentKey, name } }, fileId),
    ]);
  } catch (error) {
    console.error("finishUpload failed", error);
    return { error: "generic" };
  }
  const file = await viewOf(caseId, fileId);
  return file ? { file } : { error: "generic" };
}

export async function deleteFile(fileId: string): Promise<{ error?: "generic" }> {
  const { user, caseId } = await requireCase();
  const [file] = await db
    .select({
      id: caseFile.id,
      documentKey: caseFile.documentKey,
      name: caseFile.name,
    })
    .from(caseFile)
    .where(and(eq(caseFile.id, fileId), eq(caseFile.caseId, caseId), isNull(caseFile.deletedAt)))
    .limit(1);
  if (!file) return {};
  try {
    // Only hidden: the file stays in the store and the database, with the checks that saw it (see caseFile).
    const { documentKey, name } = file;
    await db.batch([
      db.update(caseFile).set({ deletedAt: new Date(), deletedBy: user.id }).where(eq(caseFile.id, fileId)),
      recordEvent(caseId, user.id, { type: "file.deleted", data: { documentKey, name } }),
    ]);
  } catch (error) {
    console.error("deleteFile failed", error);
    return { error: "generic" };
  }
  return {};
}
