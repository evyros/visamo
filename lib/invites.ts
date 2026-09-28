import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { db } from "./db";
import { caseInvite, caseMember, casePerson } from "./db/schema";
import { site } from "./site";

// Partner invites. The invite names an email, not a token: whoever first
// opens the app with that email, verified, joins the case. Inviting an email
// that already has a user is refused (see invitePartner), so the one joining
// never has a case of their own to give up.

/** Where the invite email sends the partner: sign-up, in their language, with the email filled in. */
export function inviteUrl(email: string, locale: Locale) {
  const url = new URL("/signup", site.appUrl);
  url.searchParams.set("lang", locale);
  url.searchParams.set("email", email);
  return url.toString();
}

/**
 * Joins the user to the case that invited their email, if any: adds them as
 * a member, links them to the partner's row in the case, and deletes the
 * invite. Returns the case id, or null when there's nothing to claim.
 */
export async function claimInvite(user: { id: string; email: string; emailVerified: boolean }) {
  if (!user.emailVerified) return null;
  const [invite] = await db
    .select({ id: caseInvite.id, caseId: caseInvite.caseId })
    .from(caseInvite)
    .where(eq(caseInvite.email, user.email.toLowerCase()))
    .orderBy(asc(caseInvite.createdAt))
    .limit(1);
  if (!invite) return null;

  try {
    // One transaction. The case_member primary key stops a second claim of
    // the same user (two tabs), and then none of it is written.
    await db.batch([
      db.insert(caseMember).values({ userId: user.id, caseId: invite.caseId, role: "partner" }),
      db
        .update(casePerson)
        .set({ userId: user.id })
        .where(and(eq(casePerson.caseId, invite.caseId), isNull(casePerson.userId))),
      db.delete(caseInvite).where(eq(caseInvite.id, invite.id)),
    ]);
  } catch (error) {
    const [member] = await db
      .select({ caseId: caseMember.caseId })
      .from(caseMember)
      .where(eq(caseMember.userId, user.id))
      .limit(1);
    if (member) return member.caseId;
    console.error("claimInvite failed", error);
    return null;
  }
  return invite.caseId;
}
