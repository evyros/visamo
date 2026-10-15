import { cleanBody } from "./rules";

// What the recommendation letter says, in reading order. The PDF
// (lib/letters/pdf.ts) sets it, and the friend's preview shows it, so they
// match word for word. Only the address, subject and signature block are
// ours; the body is the friend's, as they wrote it.

export type LetterContent = {
  names: [string, string];
  writer: { name: string; idNumber: string; phone: string };
  /** The friend's letter, paragraphs separated by line breaks. */
  body: string;
  date: Date;
};

/** "ו" joins a Hebrew name directly, and a Latin one with a hyphen: "דנה ומרקו", "דנה ו-Marco". */
function andName(name: string) {
  return /^[\u0590-\u05FF]/.test(name) ? `ו${name}` : `ו-${name}`;
}

export function letterDate(date: Date) {
  return new Intl.DateTimeFormat("he-IL", { dateStyle: "long", timeZone: "Asia/Jerusalem" }).format(date);
}

/** The letter's text, in reading order. Shared with the friend's preview, so it shows what the PDF will say. */
export function letterText({ names, writer, body, date }: LetterContent) {
  return {
    date: letterDate(date),
    to: ["לכבוד", "משרד הפנים"],
    subject: `הנדון: מכתב המלצה עבור ${coupleNames(names)}`,
    // On page 1, boxed: clerks often read only the first page.
    attachment: "מצ״ב: צילום תעודת זהות בעמוד האחרון",
    paragraphs: cleanBody(body)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean),
    regards: "בברכה,",
    signedBy: [writer.name, `ת"ז ${writer.idNumber}`, `טלפון ${writer.phone}`],
    idCardTitle: `צילום תעודת הזהות של ${writer.name}`,
  };
}

/** The PDF's file name: "מכתב המלצה - יוסי לוי.pdf", without anything that could break a path or a header. */
export function letterFileName(writer: string) {
  return `מכתב המלצה - ${writer.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")}.pdf`;
}

/** Both partners, as one phrase: "דנה ומרקו", "דנה ו-Marco" in Hebrew, "Dana and Marco" in English. */
export function coupleNames(names: readonly string[], locale: "he" | "en" = "he") {
  return locale === "he" ? `${names[0]} ${andName(names[1])}` : `${names[0]} and ${names[1]}`;
}
