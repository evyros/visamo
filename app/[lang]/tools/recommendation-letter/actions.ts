"use server";

import { isLocale } from "@/i18n/config";
import { sendLetterInvite } from "@/lib/email";
import { recordLetterEvent } from "@/lib/letters/events";
import { createLetterRequest, findLetterRequest, letterUrl, release, reserve } from "@/lib/letters/requests";
import { isEmail, isPersonName } from "@/lib/letters/rules";
import { coupleNames } from "@/lib/letters/text";
import type { LetterSource } from "@/lib/letters/tracking";
import { passedTurnstile } from "@/lib/turnstile";

// The couple's side of the recommendation letters tool
// (components/letters/request-form.tsx): make a link for their friends, and
// optionally email it to them. The letters are emailed to the address given
// here, so it's shown back to them before anything is sent. The address is
// optional: without it, friends download the letter and send it themselves.

export type CreateResult =
  | { ok: true; id: string; link: string; email: string | null }
  | { ok: false; error: "verify" | "failed" };

export async function createRequest(data: FormData): Promise<CreateResult> {
  const value = (key: string) => {
    const v = data.get(key);
    return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  };
  const language = value("language");
  const names: [string, string] = [value("name1"), value("name2")];
  const email = value("email").toLowerCase() || null;
  const source: LetterSource = value("source") === "app" ? "app" : "site";
  if (!isLocale(language) || !names.every(isPersonName) || (email && !isEmail(email))) return { ok: false, error: "failed" };
  if (!(await passedTurnstile(value("cf-turnstile-response")))) return { ok: false, error: "verify" };

  try {
    const id = await createLetterRequest({ names, email, locale: language, source });
    return { ok: true, id, link: letterUrl(id), email };
  } catch (error) {
    console.error("createRequest:", error);
    return { ok: false, error: "failed" };
  }
}

export type InviteResult = { ok: true } | { ok: false; error: "email" | "limit" | "failed" };

/** Emails the link to one friend. Each request can send a few (INVITES_PER_REQUEST). */
export async function inviteFriend(id: string, friendEmail: string): Promise<InviteResult> {
  const to = friendEmail.trim().toLowerCase();
  if (!isEmail(to)) return { ok: false, error: "email" };
  const request = await findLetterRequest(id);
  if (!request) return { ok: false, error: "failed" };
  if (!(await reserve(id, "invite"))) return { ok: false, error: "limit" };

  try {
    await sendLetterInvite({ to, url: letterUrl(id, "email"), names: coupleNames(request.names), replyTo: request.email ?? undefined });
    await recordLetterEvent(id, { type: "invite.sent", data: { email: to } });
    return { ok: true };
  } catch (error) {
    console.error("inviteFriend:", error);
    await release(id, "invite");
    return { ok: false, error: "failed" };
  }
}
