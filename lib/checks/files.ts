import "server-only";
import { get } from "@vercel/blob";
import sharp from "sharp";
import type { ContentPart } from "@/lib/chat/openrouter";
import { filePath } from "@/lib/files/storage";
import { loadPdfium } from "@/lib/files/thumbnail";

// An item's files, made ready for the checker: read from the Blob store,
// PDFs opened with PDFium (a damaged or password-protected one is caught
// here, before the model is paid for), images downscaled.

/** Most pages one check sends, across the item's files; an image is one page. */
export const MAX_CHECK_PAGES = 20;
/** Most bytes one check sends, below the model providers' request limits. */
const MAX_CHECK_BYTES = 24 * 1024 * 1024;
/** Longest image side sent: enough to read small print on a phone photo. */
const IMAGE_SIDE = 2000;

type CheckFile = { id: string; slot: string; name: string; contentType: string };

export type PreparedFiles =
  /** `pages` and `bytes` are what's sent, after images are downscaled. */
  | { ok: true; parts: ContentPart[]; pages: number; bytes: number }
  /** A file that can't be opened: the check's result is "unreadable", and isn't counted. */
  | { ok: false; unreadable: string }
  | { ok: false; error: "tooManyPages" | "tooLarge" };

const dataUrl = (type: string, bytes: Uint8Array) => `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;

async function read(caseId: string, fileId: string) {
  const blob = await get(filePath(caseId, fileId), { access: "private" });
  if (blob?.statusCode !== 200) throw new Error(`File ${fileId} is missing from the store`);
  return new Uint8Array(await new Response(blob.stream).arrayBuffer());
}

/** The PDF's page count, or null when it can't be opened (damaged, or password-protected). */
async function pdfPages(bytes: Uint8Array) {
  try {
    const document = await (await loadPdfium()).loadDocument(bytes);
    try {
      return document.getPageCount();
    } finally {
      document.destroy();
    }
  } catch {
    return null;
  }
}

async function downscaled(bytes: Uint8Array) {
  try {
    // .rotate() applies a phone photo's orientation.
    return await sharp(bytes, { failOn: "error" })
      .rotate()
      .resize({ width: IMAGE_SIDE, height: IMAGE_SIDE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return null;
  }
}

/** The files as the model's content: each labelled (its name, and whether it's the translation), then the file. */
export async function prepareFiles(caseId: string, files: CheckFile[]): Promise<PreparedFiles> {
  const parts: ContentPart[] = [];
  let pages = 0;
  let bytes = 0;
  for (const [index, file] of files.entries()) {
    const content = await read(caseId, file.id);
    const what = file.slot === "translation" ? "the translation" : "the document itself";
    parts.push({ type: "text", text: `File ${index + 1} of ${files.length}: "${file.name}" (${what})` });

    if (file.contentType === "application/pdf") {
      const count = await pdfPages(content);
      if (count === null) return { ok: false, unreadable: file.name };
      pages += count;
      bytes += content.length;
      parts.push({ type: "file", file: { filename: `file-${index + 1}.pdf`, file_data: dataUrl(file.contentType, content) } });
    } else {
      const image = await downscaled(content);
      if (!image) return { ok: false, unreadable: file.name };
      pages += 1;
      bytes += image.length;
      parts.push({ type: "image_url", image_url: { url: dataUrl("image/jpeg", image) } });
    }
    if (pages > MAX_CHECK_PAGES) return { ok: false, error: "tooManyPages" };
    if (bytes > MAX_CHECK_BYTES) return { ok: false, error: "tooLarge" };
  }
  return { ok: true, parts, pages, bytes };
}
