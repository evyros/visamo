import { isPhone } from "@/lib/contact";

// Recommendation letters, written by a couple's friends on the website
// (app/[lang]/letter/[token]). The rules here are checked in the browser for
// quick feedback and again on the server, which builds the PDF from the same
// answers (lib/letters/pdf.ts). The letter, ID card and signature are never
// stored; the stats keep who sent it and when (lib/letters/events.ts).

/** The letter's body, as the friend writes it: usually about 3 paragraphs. */
export const BODY_MIN = 150;
export const BODY_MAX = 2500;
export const NAME_MAX = 60;
export const EMAIL_MAX = 254;

/** The ID card photo after the browser shrinks it, and the server's cap for it. */
export const ID_IMAGE_LONG_SIDE = 1600;
export const ID_IMAGE_MAX_BYTES = 1.5 * 1024 * 1024;
/**
 * A scanned ID card as a PDF, which goes up as it is: the browser can't
 * shrink it. With the rest of the form it stays under Vercel's 4.5MB a request.
 */
export const ID_PDF_MAX_BYTES = 3.5 * 1024 * 1024;

/** A PDF by its type or name, in the browser (the server checks the bytes). */
export function isPdfFile(file: File) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}
export const SIGNATURE_MAX_BYTES = 200 * 1024;

/** How many letters, and how many invite emails, one request can send. */
export const LETTERS_PER_REQUEST = 20;
export const INVITES_PER_REQUEST = 10;

/** A request's link: 16 random bytes, base64url. */
export const letterTokenPattern = /^[A-Za-z0-9_-]{22}$/;

/**
 * A person's name as it goes into the letter and the emails: letters in any
 * script, with spaces, hyphens, apostrophes and dots. No digits, so it can't
 * carry a link or a phone number into an email.
 */
export function isPersonName(value: string) {
  return value.length >= 2 && value.length <= NAME_MAX && /^\p{L}[\p{L}\p{M}\s'’".\-]*$/u.test(value);
}

export function isEmail(value: string) {
  return value.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** An Israeli ID number: up to 9 digits, with its check digit. */
export function isIsraeliId(value: string) {
  if (!/^\d{5,9}$/.test(value)) return false;
  const id = value.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const n = Number(id[i]) * ((i % 2) + 1);
    sum += n > 9 ? n - 9 : n;
  }
  return sum % 10 === 0 && id !== "000000000";
}

export { isPhone };

/** Trimmed, with Windows line breaks and runs of blank lines tidied. */
export function cleanBody(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type BodyProblem = "required" | "tooShort" | "tooLong";

/** What's wrong with the letter's body, or null. */
export function bodyProblem(text: string): BodyProblem | null {
  const length = cleanBody(text).length;
  if (length === 0) return "required";
  if (length < BODY_MIN) return "tooShort";
  return length > BODY_MAX ? "tooLong" : null;
}

/** "d***@gmail.com": enough for a friend to recognise the address, not to copy it. */
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}
