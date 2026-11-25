import "server-only";
import { PDFiumLibrary, type PDFiumDocument } from "@hyzyla/pdfium";
import sharp, { type Sharp } from "sharp";
import type { AcceptedType } from "./rules";

// Thumbnails, made on the server so they don't depend on the user's phone:
// images with sharp, PDFs by rendering the first page with PDFium (Chrome's
// PDF engine, as WebAssembly). The original is never changed. A PDF's page
// count is read here too, while it's open.

/** Display width is about half this, so it's sharp on high-density screens. */
const WIDTH = 320;

let pdfium: Promise<PDFiumLibrary> | undefined;

/** PDFium, loaded once per server instance. Also used by the document checker. */
export function loadPdfium() {
  pdfium ??= PDFiumLibrary.init();
  return pdfium;
}

async function firstPage(document: PDFiumDocument): Promise<Sharp> {
  const page = document.getPage(0);
  // Twice the width, then downscaled by sharp, for crisper text. A scale
  // keeps the page's shape; a width alone would stretch it.
  const scale = (WIDTH * 2) / page.getOriginalSize().originalWidth;
  const bitmap = await page.render({ scale, render: "bitmap" });
  return sharp(Buffer.from(bitmap.data), { raw: { width: bitmap.width, height: bitmap.height, channels: 4 } });
}

/** A small JPEG of the image, or null when it can't be made. */
async function shrink(image: () => Sharp | Promise<Sharp>): Promise<Buffer | null> {
  try {
    return await (await image())
      .flatten({ background: "#ffffff" })
      .resize({ width: WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();
  } catch (error) {
    console.error("makeThumbnail failed", error);
    return null;
  }
}

export type Thumbnail = {
  /** A small JPEG, or null when it can't be made (an unreadable image, a PDF page that won't render). */
  thumbnail: Buffer | null;
  /** A PDF's page count; 1 for an image. Null when the file can't be opened (a damaged or password-protected PDF). */
  pages: number | null;
};

/**
 * The file's thumbnail and page count, from one opening of the file. Never
 * throws: the upload still counts without them.
 */
export async function makeThumbnail(file: Uint8Array, type: AcceptedType): Promise<Thumbnail> {
  if (type !== "application/pdf") {
    // .rotate() applies a phone photo's orientation.
    const thumbnail = await shrink(() => sharp(file, { failOn: "error" }).rotate());
    return { thumbnail, pages: thumbnail ? 1 : null };
  }
  let document: PDFiumDocument;
  try {
    document = await (await loadPdfium()).loadDocument(file);
  } catch (error) {
    console.error("makeThumbnail failed", error);
    return { thumbnail: null, pages: null };
  }
  try {
    // Counted before rendering, so a PDF whose first page won't render still has it.
    const pages = document.getPageCount();
    return { thumbnail: await shrink(() => firstPage(document)), pages };
  } finally {
    document.destroy();
  }
}
