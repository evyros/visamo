import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import bidiFactory from "bidi-js";
import { PDFDocument, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { letterText, type LetterContent } from "./text";

// The recommendation letter as a PDF, built in memory and never saved: page 1
// (and more if it runs long) is the letter in Hebrew, signed; the last page is
// the writer's ID card: a photo, set under a title, or a scan's first page as
// it is. The friend's letter goes in as they wrote it,
// under a fixed address and subject, and above their signature and details.
//
// pdf-lib draws text left to right only, so each line is wrapped in reading
// order and then put in display order with the Unicode bidi algorithm: Hebrew
// runs right to left, and Latin names and numbers inside it keep their order.

export type LetterInput = LetterContent & {
  /** PNG, drawn on the friend's screen. */
  signature: Uint8Array;
  /** A JPEG, already shrunk and re-encoded on the server, or a scanned PDF. */
  idCard: { kind: "image" | "pdf"; bytes: Uint8Array };
};

const bidi = bidiFactory();
const fonts = join(process.cwd(), "assets/fonts");

const PAGE = { width: 595.28, height: 841.89 }; // A4
const MARGIN = 64;
const TEXT_WIDTH = PAGE.width - MARGIN * 2;
const SIZE = 12;
const LEADING = SIZE * 1.7;
const PARAGRAPH_GAP = SIZE * 0.8;
const INK = rgb(0.06, 0.16, 0.27);
const MUTED = rgb(0.33, 0.38, 0.43);
const NOTICE = rgb(0.91, 0.94, 0.92);

/** Drops characters the font can't draw (emoji, mostly), so none print as empty boxes. */
function drawable(font: PDFFont, text: string) {
  const supported = new Set(font.getCharacterSet());
  return [...text]
    .filter((ch) => supported.has(ch.codePointAt(0)!) || /\s/.test(ch))
    .join("")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** A paragraph's lines, each in display order, wrapped to `width`. */
export function rtlLines(font: PDFFont, text: string, size: number, width: number) {
  const paragraph = drawable(font, text);
  if (!paragraph) return [];
  const levels = bidi.getEmbeddingLevels(paragraph, "rtl");
  const measure = (from: number, to: number) => font.widthOfTextAtSize(paragraph.slice(from, to), size);

  // Greedy wrapping on spaces, in reading order. A word wider than the line
  // (a long link, say) is cut where it fills the line.
  const lines: [number, number][] = [];
  let start = 0;
  while (start < paragraph.length) {
    let end = paragraph.length;
    if (measure(start, end) > width) {
      end = start;
      let space = paragraph.indexOf(" ", start);
      while (space !== -1 && measure(start, space) <= width) {
        end = space;
        space = paragraph.indexOf(" ", space + 1);
      }
      if (end === start) {
        end = start + 1;
        while (end < paragraph.length && measure(start, end + 1) <= width) end++;
      }
    }
    lines.push([start, end]);
    start = end;
    while (paragraph[start] === " ") start++;
  }

  // The reordered string is the whole paragraph with this line's characters
  // put in display order, so the line is cut back out of it.
  return lines.map(([from, to]) => bidi.getReorderedString(paragraph, levels, from, to - 1).slice(from, to));
}

/**
 * The font's own layout reverses any text it takes for Hebrew, which would
 * undo the bidi reordering above. Every string drawn is already in display
 * order, so the layout is told to keep it left to right.
 */
function keepDisplayOrder(font: PDFFont) {
  type Layout = (text: string, features?: unknown, script?: string, language?: string, direction?: string) => unknown;
  const fontkitFont = (font as unknown as { embedder: { font: { layout: Layout } } }).embedder.font;
  const layout = fontkitFont.layout.bind(fontkitFont);
  fontkitFont.layout = (text, features) => layout(text, features, undefined, undefined, "ltr");
  return font;
}

type Fonts = { regular: PDFFont; bold: PDFFont };

/** Writes right-aligned lines down the page, starting new pages as it fills them. */
class Writer {
  page: PDFPage;
  y: number;

  constructor(
    private doc: PDFDocument,
    private fonts: Fonts,
  ) {
    this.page = this.newPage();
    this.y = PAGE.height - MARGIN;
  }

  private newPage() {
    const page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - MARGIN;
    return page;
  }

  /** Room for `height` more points on this page, or a new page. */
  ensure(height: number) {
    if (this.y - height < MARGIN) this.page = this.newPage();
  }

  paragraph(text: string, { bold = false, gap = PARAGRAPH_GAP, color = INK } = {}) {
    const font = bold ? this.fonts.bold : this.fonts.regular;
    for (const line of rtlLines(font, text, SIZE, TEXT_WIDTH)) this.line(line, font, color);
    this.y -= gap;
  }

  /** One line, already in display order, right-aligned. */
  line(line: string, font = this.fonts.regular, color = INK) {
    this.ensure(LEADING);
    this.y -= LEADING;
    const x = PAGE.width - MARGIN - font.widthOfTextAtSize(line, SIZE);
    this.page.drawText(line, { x, y: this.y + (LEADING - SIZE) / 2, size: SIZE, font, color });
  }

  /** Bold text in a box, so it stands out from the letter. */
  notice(text: string) {
    const font = this.fonts.bold;
    const pad = 10;
    const lines = rtlLines(font, text, SIZE, TEXT_WIDTH - pad * 2);
    const height = lines.length * LEADING + pad * 2;
    this.ensure(height);
    const top = this.y;
    this.page.drawRectangle({ x: MARGIN, y: top - height, width: TEXT_WIDTH, height, color: NOTICE, borderColor: INK, borderWidth: 1.5 });
    this.y -= pad;
    for (const line of lines) {
      this.y -= LEADING;
      const x = PAGE.width - MARGIN - pad - font.widthOfTextAtSize(line, SIZE);
      this.page.drawText(line, { x, y: this.y + (LEADING - SIZE) / 2, size: SIZE, font, color: INK });
    }
    this.y = top - height - LEADING;
  }

  /** One line at the left margin: the date, as Hebrew letters set it. */
  leftLine(text: string) {
    const [line] = rtlLines(this.fonts.regular, text, SIZE, TEXT_WIDTH);
    this.y -= LEADING;
    this.page.drawText(line, { x: MARGIN, y: this.y + (LEADING - SIZE) / 2, size: SIZE, font: this.fonts.regular, color: MUTED });
  }
}

export async function buildLetterPdf(input: LetterInput) {
  const text = letterText(input);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`מכתב המלצה - ${input.writer.name}`);
  doc.setCreator("Visamo");
  doc.setProducer("Visamo");
  doc.setLanguage("he");

  const [regularBytes, boldBytes] = await Promise.all([
    readFile(join(fonts, "Rubik-Regular.ttf")),
    readFile(join(fonts, "Rubik-SemiBold.ttf")),
  ]);
  const fontsUsed: Fonts = {
    regular: keepDisplayOrder(await doc.embedFont(regularBytes, { subset: true })),
    bold: keepDisplayOrder(await doc.embedFont(boldBytes, { subset: true })),
  };

  // The letter.
  const w = new Writer(doc, fontsUsed);
  w.leftLine(text.date);
  w.y -= LEADING;
  for (const line of text.to) w.paragraph(line, { gap: 0 });
  w.y -= LEADING;
  w.paragraph(text.subject, { bold: true, gap: PARAGRAPH_GAP });
  w.notice(text.attachment);
  const signature = await doc.embedPng(input.signature);
  // About the size of a pen signature: fitted in 130 × 48 points.
  const sigScale = Math.min(130 / signature.width, 48 / signature.height);
  const sigWidth = signature.width * sigScale;
  const sigHeight = signature.height * sigScale;
  // The gap before it, "בברכה,", the signature and the lines under it.
  const signatureBlock = LEADING * 2 + 8 + sigHeight + LEADING * text.signedBy.length;

  // The body. Its last two lines go to a new page together with the
  // signature block when they don't all fit, so the signature is never on a
  // page of its own.
  const body = text.paragraphs.map((paragraph) => rtlLines(fontsUsed.regular, paragraph, SIZE, TEXT_WIDTH));
  const total = body.reduce((n, lines) => n + lines.length, 0);
  let drawn = 0;
  for (const lines of body) {
    for (const line of lines) {
      if (drawn === Math.max(0, total - 2)) w.ensure((total - drawn) * LEADING + PARAGRAPH_GAP + signatureBlock);
      w.line(line);
      drawn++;
    }
    w.y -= PARAGRAPH_GAP;
  }
  w.y -= LEADING;

  // The signature block stays together on one page.
  w.ensure(signatureBlock - LEADING);
  w.paragraph(text.regards, { gap: 4 });
  w.y -= sigHeight;
  w.page.drawImage(signature, { x: PAGE.width - MARGIN - sigWidth, y: w.y, width: sigWidth, height: sigHeight });
  w.y -= 4;
  text.signedBy.forEach((line, i) => w.paragraph(line, { bold: i === 0, gap: 0, color: i === 0 ? INK : MUTED }));

  if (input.idCard.kind === "pdf") {
    await addScanPage(doc, input.idCard.bytes);
    return doc.save();
  }

  // The ID card photo, on a page of its own, as large as fits.
  const id = new Writer(doc, fontsUsed);
  id.paragraph(text.idCardTitle, { bold: true, gap: LEADING });
  const card = await doc.embedJpg(input.idCard.bytes);
  const scale = Math.min(TEXT_WIDTH / card.width, (id.y - MARGIN) / card.height, 1);
  const cardWidth = card.width * scale;
  const cardHeight = card.height * scale;
  id.page.drawImage(card, { x: (PAGE.width - cardWidth) / 2, y: id.y - cardHeight, width: cardWidth, height: cardHeight });

  return doc.save();
}

/**
 * A scan's first page as the letter's last page, as it is. It's drawn onto a
 * new page rather than copied, so only what's visible comes along (no form
 * fields, links or the file's details), and scaled down only if it's bigger
 * than A4, turned the way it's shown when it's set to show turned.
 */
async function addScanPage(doc: PDFDocument, bytes: Uint8Array) {
  const source = await PDFDocument.load(bytes, { updateMetadata: false });
  const sourcePage = source.getPage(0);
  const turn = ((sourcePage.getRotation().angle % 360) + 360) % 360;
  const [scan] = await doc.embedPdf(source, [0]);
  const sideways = turn === 90 || turn === 270;
  const width = sideways ? scan.height : scan.width;
  const height = sideways ? scan.width : scan.height;
  const [maxWidth, maxHeight] = width > height ? [PAGE.height, PAGE.width] : [PAGE.width, PAGE.height];
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  const page = doc.addPage([width * scale, height * scale]);
  const w = scan.width * scale;
  const h = scan.height * scale;
  // The page's turn is clockwise; drawing turns counterclockwise around the
  // drawing's corner, so each turn moves that corner to keep the page in view.
  const placed = { 0: { x: 0, y: 0 }, 90: { x: 0, y: w }, 180: { x: w, y: h }, 270: { x: h, y: 0 } }[turn] ?? { x: 0, y: 0 };
  page.drawPage(scan, { ...placed, width: w, height: h, rotate: degrees(-turn) });
}
