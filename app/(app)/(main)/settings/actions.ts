"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { defaultLocale, type Locale } from "@/i18n/config";
import { getAppLocale } from "@/i18n/app-locale";
import { asLiveLocale } from "@/i18n/negotiate";
import { auth } from "@/lib/auth";
import { otherMembers, ownName, pendingInvite, unlinkedPerson } from "@/lib/case";
import { db } from "@/lib/db";
import { deleteCaseBlobs } from "@/lib/files/storage";
import { caseInvite, cases, user } from "@/lib/db/schema";
import { sendInviteEmail } from "@/lib/email";
import { recordEvent } from "@/lib/events";
import { inviteUrl } from "@/lib/invites";
import { requireCase } from "@/lib/session";
import { localePath, site } from "@/lib/site";
import { isEmail } from "@/components/app/auth-ui";

// ── Account ─────────────────────────────────────────────────────────────────

export type ChangePasswordResult = {
  error?: "passwordShort" | "passwordLong" | "wrongPassword" | "generic";
};

/** Changes the password and logs out every other device. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResult> {
  await requireCase();
  if (newPassword.length < 8) return { error: "passwordShort" };
  if (newPassword.length > 128) return { error: "passwordLong" };
  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    if (error.body?.code === "INVALID_PASSWORD") return { error: "wrongPassword" };
    console.error("changePassword failed", error);
    return { error: "generic" };
  }
  return {};
}

/**
 * Deletes the user: their login, sessions and membership. Their row in the
 * case stays, since the case is about both partners. When nobody else is in
 * the case, the case goes too, with everything in it.
 */
export async function deleteAccount() {
  const { user: me, caseId } = await requireCase();
  const locale = await getAppLocale();
  const alone = (await otherMembers(caseId, me.id)).length === 0;

  const deleteUser = db.delete(user).where(eq(user.id, me.id));
  if (alone) {
    // The uploaded files first: deleting the case's rows doesn't delete its blobs.
    await deleteCaseBlobs(caseId);
    await db.batch([db.delete(cases).where(eq(cases.id, caseId)), deleteUser]);
  } else {
    // The event first: it finds their person in the case through their user.
    await db.batch([recordEvent(caseId, me.id, { type: "member.left", data: {} }), deleteUser]);
  }

  // The sessions went with the user; this clears the cookies.
  await auth.api.signOut({ headers: await headers() });
  redirect(new URL(localePath(locale), site.url).toString());
}

// ── Partner ─────────────────────────────────────────────────────────────────

export type InviteResult = {
  error?: "email" | "ownEmail" | "hasAccount" | "full" | "tooSoon" | "generic";
};

/** A minute between invite emails. */
const RESEND_AFTER_MS = 60 * 1000;

async function inviterName(me: { id: string; name: string; email: string }) {
  return (await ownName(me.id)) || me.name || me.email;
}

export async function invitePartner(email: string): Promise<InviteResult> {
  const { user: me, caseId } = await requireCase();
  const address = email.trim().toLowerCase();
  if (!isEmail(address)) return { error: "email" };
  if (address === me.email.toLowerCase()) return { error: "ownEmail" };
  if ((await otherMembers(caseId, me.id)).length > 0) return { error: "full" };

  // Someone with a user may already have a case of their own; joining this
  // one would mean leaving it. Support handles those by hand.
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(sql`lower(${user.email})`, address))
    .limit(1);
  if (existing) return { error: "hasAccount" };

  // Hebrew for an Israeli partner, English otherwise.
  const locale: Locale = (await unlinkedPerson(caseId))?.isIsraeli ? "he" : "en";
  const now = new Date();
  await db
    .insert(caseInvite)
    .values({ id: crypto.randomUUID(), caseId, email: address, locale, invitedBy: me.id })
    .onConflictDoUpdate({
      target: caseInvite.caseId,
      set: { email: address, locale, invitedBy: me.id, createdAt: now, sentAt: now },
    });

  try {
    await sendInviteEmail({ to: address, url: inviteUrl(address, locale), locale, inviter: await inviterName(me) });
  } catch (error) {
    // No email went out, so there's no invite either.
    console.error("invitePartner failed", error);
    await db.delete(caseInvite).where(eq(caseInvite.caseId, caseId));
    return { error: "generic" };
  }
  // Only once the email went out: until then there's no invite to speak of.
  await recordEvent(caseId, me.id, { type: "partner.invited", data: { email: address } });
  refresh();
  return {};
}

export async function resendInvite(): Promise<InviteResult> {
  const { user: me, caseId } = await requireCase();
  const invite = await pendingInvite(caseId);
  if (!invite) return { error: "generic" };
  if (Date.now() - invite.sentAt.getTime() < RESEND_AFTER_MS) return { error: "tooSoon" };

  const locale = asLiveLocale(invite.locale) ?? defaultLocale;
  try {
    await sendInviteEmail({
      to: invite.email,
      url: inviteUrl(invite.email, locale),
      locale,
      inviter: await inviterName(me),
    });
  } catch (error) {
    console.error("resendInvite failed", error);
    return { error: "generic" };
  }
  await db.batch([
    db.update(caseInvite).set({ sentAt: new Date() }).where(eq(caseInvite.caseId, caseId)),
    recordEvent(caseId, me.id, { type: "invite.resent", data: { email: invite.email } }),
  ]);
  refresh();
  return {};
}

export async function cancelInvite() {
  const { user: me, caseId } = await requireCase();
  const invite = await pendingInvite(caseId);
  if (invite) {
    await db.batch([
      db.delete(caseInvite).where(eq(caseInvite.caseId, caseId)),
      recordEvent(caseId, me.id, { type: "invite.cancelled", data: { email: invite.email } }),
    ]);
  }
  refresh();
}
