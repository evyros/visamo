import { writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { buildLetterPdf, rtlLines, type LetterInput } from "./pdf";
import { BODY_MAX } from "./rules";
import { letterText } from "./text";

async function sampleInput(): Promise<LetterInput> {
  // A busy photo-sized image, so the size check means something.
  const noise = Buffer.alloc(1600 * 1000 * 3);
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 2654435761) % 251;
  const idCard = await sharp(noise, { raw: { width: 1600, height: 1000, channels: 3 } })
    .jpeg({ quality: 80 })
    .toBuffer();
  const signature = await sharp(
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200"><path d="M20 150 C 120 20, 220 180, 320 60 S 520 160, 580 40" stroke="#0f2a44" stroke-width="6" fill="none"/></svg>'),
  )
    .png()
    .toBuffer();
  return {
    names: ["דנה כהן", "Marco Rossi"],
    writer: { name: "יוסי לוי", idNumber: "123456782", phone: "050-1234567" },
    body: [
      "אני חבר קרוב של דנה כבר 15 שנה, מאז שלמדנו יחד בתיכון בחיפה.",
      "פגשתי אותם לראשונה יחד כשהם הגיעו לארץ בפסח 2022, בארוחת החג אצל ההורים של דנה (Haifa).",
      Array(3)
        .fill("ביקרתי אותם בדירה שלהם בתל אביב פעמים רבות, חגגנו יחד את ראש השנה ואת יום ההולדת ה-30 של דנה, וראיתי איך הם מנהלים בית משותף.")
        .join(" "),
      "ראיתי אותם יחד בחתונה של אחי באוגוסט 2023, ובטיול משותף לגליל. הם זוג אוהב ויציב 😊",
    ].join("\n\n"),
    signature: new Uint8Array(signature),
    idCard: { kind: "image", bytes: new Uint8Array(idCard) },
    date: new Date("2026-10-15T10:00:00Z"),
  };
}

describe("the recommendation letter PDF", () => {
  it("is the letter and the ID card, small enough to send", async () => {
    const pdf = await buildLetterPdf(await sampleInput());
    if (process.env.LETTER_PDF_OUT) await writeFile(process.env.LETTER_PDF_OUT, pdf);
    const doc = await PDFDocument.load(pdf);
    expect(doc.getPageCount()).toBe(2);
    expect(pdf.byteLength).toBeLessThan(1024 * 1024);
  });

  it("puts a scanned ID card's first page in as it is, scaled down only to fit A4", async () => {
    // A scan of A4 with the card in a corner, a second page that mustn't come
    // along, and a page bigger than A4 turned sideways in its file.
    const scan = async (size: [number, number], turn = 0) => {
      const doc = await PDFDocument.create();
      const page = doc.addPage(size);
      page.drawRectangle({ x: 40, y: size[1] - 200, width: 240, height: 150, borderColor: rgb(0, 0, 0), borderWidth: 2 });
      page.setRotation(degrees(turn));
      doc.addPage(size);
      return new Uint8Array(await doc.save());
    };
    const input = await sampleInput();

    const a4 = await PDFDocument.load(await buildLetterPdf({ ...input, idCard: { kind: "pdf", bytes: await scan([595.28, 841.89]) } }));
    expect(a4.getPageCount()).toBe(2);
    expect(a4.getPage(1).getSize()).toEqual({ width: 595.28, height: 841.89 });

    const small = await PDFDocument.load(await buildLetterPdf({ ...input, idCard: { kind: "pdf", bytes: await scan([300, 200]) } }));
    expect(small.getPage(1).getSize()).toEqual({ width: 300, height: 200 });

    const turned = await buildLetterPdf({ ...input, idCard: { kind: "pdf", bytes: await scan([841.89, 1190.55], 90) } });
    if (process.env.LETTER_PDF_OUT) await writeFile(process.env.LETTER_PDF_OUT.replace(".pdf", "-turned.pdf"), turned);
    const { width, height } = (await PDFDocument.load(turned)).getPage(1).getSize();
    // Shown sideways, it's landscape: scaled to fit A4 that way.
    expect(width).toBeCloseTo(841.89, 0);
    expect(height).toBeCloseTo(595.28, 0);
  });

  it("fits the longest letter on 2 pages, with the ID card on page 3", async () => {
    const sentence = "ביקרתי אותם בדירה שלהם בתל אביב פעמים רבות, וחגגנו יחד את החגים. ";
    const body = Array.from({ length: 12 }, () => sentence.repeat(4)).join("\n").slice(0, BODY_MAX);
    const pdf = await buildLetterPdf({ ...(await sampleInput()), body });
    expect((await PDFDocument.load(pdf)).getPageCount()).toBeLessThanOrEqual(3);
  });

  it("is addressed to Misrad Hapnim, and says on page 1 where the ID card is", () => {
    const text = letterText({ names: ["דנה", "מרקו"], writer: { name: "יוסי לוי", idNumber: "1", phone: "1" }, body: "", date: new Date() });
    expect(text.to).toEqual(["לכבוד", "משרד הפנים"]);
    expect(text.attachment).toBe("מצ״ב: צילום תעודת זהות בעמוד האחרון");
  });

  it("joins the couple's names with ו, and a hyphen before a Latin name", () => {
    const base = { writer: { name: "א", idNumber: "1", phone: "1" }, body: "", date: new Date() };
    expect(letterText({ ...base, names: ["דנה", "מרקו"] }).subject).toContain("דנה ומרקו");
    expect(letterText({ ...base, names: ["דנה", "Marco"] }).subject).toContain("דנה ו-Marco");
  });

  it("puts Hebrew right to left and keeps Latin words and numbers in their order", async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    // Helvetica can't draw Hebrew, so only the Latin survives: the order is what's checked.
    expect(rtlLines(font, "Marco Rossi 2021", 12, 500)).toEqual(["Marco Rossi 2021"]);
  });
});
