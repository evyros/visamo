"use server";

import { headers } from "next/headers";
import { isLocale, locales } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages";
import { CONTACT_MAX_FILES, CONTACT_MAX_TOTAL_BYTES, isContactAttachment, isPhone } from "@/lib/contact";
import { sendSupportTicket, sendTicketConfirmation } from "@/lib/email";

// The contact form posts here. After a Turnstile check, the message goes by
// email to the support inbox, with the sender's email as Reply-To, and the
// sender gets a confirmation with the ticket number. Nothing is stored: the
// support email is the ticket. The email is whatever the visitor typed, since
// the website can't see app sign-ins.

const MAX_LENGTH = { name: 200, email: 254, message: 10_000 };

export type ContactResult = { ok: true; ticket: string } | { ok: false; error: "verify" | "failed" };

export async function sendContactMessage(data: FormData): Promise<ContactResult> {
  const value = (key: string) => {
    const v = data.get(key);
    return typeof v === "string" ? v.trim() : "";
  };

  const language = value("language");
  if (!isLocale(language)) return { ok: false, error: "failed" };
  const name = value("name");
  const email = value("email");
  const phone = value("phone");
  const reason = value("reason");
  const message = value("message");
  const files = data.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);

  const { reasons } = (await loadMessages(language)).contact.form;
  const valid =
    name.length > 0 &&
    name.length <= MAX_LENGTH.name &&
    email.length <= MAX_LENGTH.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    (!phone || isPhone(phone)) &&
    reasons.includes(reason) &&
    message.length > 0 &&
    message.length <= MAX_LENGTH.message &&
    files.length <= CONTACT_MAX_FILES &&
    files.every(isContactAttachment) &&
    files.reduce((sum, f) => sum + f.size, 0) <= CONTACT_MAX_TOTAL_BYTES;
  if (!valid) return { ok: false, error: "failed" };

  if (!(await passedTurnstile(value("cf-turnstile-response")))) return { ok: false, error: "verify" };

  // The name and type say "image", but only the file's first bytes prove it.
  const attachments = [];
  for (const file of files) {
    const content = Buffer.from(await file.arrayBuffer());
    const contentType = imageType(content);
    if (!contentType) return { ok: false, error: "failed" };
    attachments.push({ filename: safeFilename(file.name, attachments.length + 1), content, contentType });
  }

  const ticket = ticketId();
  try {
    await sendSupportTicket({
      ticket,
      fields: [
        ["Ticket", ticket],
        ["Name", name],
        ["Email", email],
        ...(phone ? [["Phone", phone] as [string, string]] : []),
        ["Topic", reason],
        ["Language", locales[language].nativeName],
        ["Sent", new Date().toLocaleString("en-GB", { timeZone: "Asia/Jerusalem" }) + " (Israel)"],
      ],
      message,
      replyTo: email,
      attachments,
    });
  } catch (error) {
    console.error("sendContactMessage:", error);
    return { ok: false, error: "failed" };
  }

  // The message reached us, so a failed confirmation doesn't fail the form.
  try {
    await sendTicketConfirmation({ to: email, ticket, locale: language });
  } catch (error) {
    console.error("sendContactMessage: confirmation", ticket, error);
  }
  return { ok: true, ticket };
}

/** Cloudflare's server-side check of the widget's token. Each token works once. */
async function passedTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("sendContactMessage: TURNSTILE_SECRET_KEY is not set");
    return false;
  }
  if (!token) return false;

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("sendContactMessage: Turnstile", error);
    return false;
  }
}

/** The image type from the file's signature, or null for anything else. */
function imageType(bytes: Buffer) {
  const ascii = (start: number, end: number) => bytes.subarray(start, end).toString("latin1");
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (["heic", "heix", "heim", "heis", "hevc", "hevx"].includes(brand)) return "image/heic";
    if (["mif1", "msf1"].includes(brand)) return "image/heif";
  }
  return null;
}

/** The sender's file name, without anything that could act as a path or break a header. */
function safeFilename(name: string, index: number) {
  const clean = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").slice(-100);
  return clean || `image-${index}`;
}

// No 0/O or 1/I, so it reads back unambiguously over the phone.
const TICKET_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** E.g. V-K7M2QX: random, since nothing is stored to count from. */
function ticketId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `V-${Array.from(bytes, (b) => TICKET_ALPHABET[b % TICKET_ALPHABET.length]).join("")}`;
}
