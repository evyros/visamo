import "server-only";
import { PDFiumLibrary } from "@hyzyla/pdfium";
import sharp, { type Sharp } from "sharp";
import type { AcceptedType } from "./rules";

// Thumbnails, made on the server so they don't depend on the user's phone:
// images with sharp, PDFs by rendering the first page with PDFium (Chrome's
// PDF engine, as WebAssembly). The original is never changed.

/** Display width is about half this, so it's sharp on high-density screens. */
const WIDTH = 320;

let pdfium: Promise<PDFiumLibrary> | undefined;

/** PDFium, loaded once per server instance. Also used by the document checker. */
export function loadPdfium() {
  pdfium ??= PDFiumLibrary.init();
  return pdfium;
}

async function firstPage(pdf: Uint8Array): Promise<Sharp> {
  const document = await (await loadPdfium()).loadDocument(pdf);
  try {
    const page = document.getPage(0);
    // Twice the width, then downscaled by sharp, for crisper text. A scale
    // keeps the page's shape; a width alone would stretch it.
    const scale = (WIDTH * 2) / page.getOriginalSize().originalWidth;
    const bitmap = await page.render({ scale, render: "bitmap" });
    return sharp(Buffer.from(bitmap.data), { raw: { width: bitmap.width, height: bitmap.height, channels: 4 } });
  } finally {
    document.destroy();
  }
}

/**
 * A small JPEG of the file, or null when it can't be made (a damaged or
 * password-protected PDF, an unreadable image). The upload still counts.
 */
export async function makeThumbnail(file: Uint8Array, type: AcceptedType): Promise<Buffer | null> {
  try {
    // .rotate() applies a phone photo's orientation.
    const image = type === "application/pdf" ? await firstPage(file) : sharp(file, { failOn: "error" }).rotate();
    return await image
      .flatten({ background: "#ffffff" })
      .resize({ width: WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 75 })
      .toBuffer();
  } catch (error) {
    console.error("makeThumbnail failed", error);
    return null;
  }
}
