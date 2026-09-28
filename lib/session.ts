import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { account, caseMember } from "./db/schema";
import { claimInvite } from "./invites";

/** The signed-in session, or null. One lookup per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/**
 * Whether the user can sign in again without an email link: they have a
 * password or a Google account. An email sign-up has neither until they
 * finish /set-password.
 */
export const hasSignInMethod = cache(async (userId: string) => {
  const rows = await db.select({ id: account.id }).from(account).where(eq(account.userId, userId)).limit(1);
  return rows.length > 0;
});

/** For app pages: sends signed-out visitors to /login, and unfinished sign-ups to /set-password. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await hasSignInMethod(session.user.id))) redirect("/set-password");
  return session.user;
}

/** The id of the case the user belongs to, or null before onboarding. Not cached; see getCaseId. */
export async function findCaseId(userId: string) {
  const rows = await db
    .select({ caseId: caseMember.caseId })
    .from(caseMember)
    .where(eq(caseMember.userId, userId))
    .limit(1);
  return rows[0]?.caseId ?? null;
}

/** findCaseId, looked up once per request. */
export const getCaseId = cache(findCaseId);

/**
 * The user's case, or else the case whose invite matches their email, which
 * they join now. Null when neither exists: the user goes through onboarding.
 */
export function getOrClaimCaseId(user: { id: string; email: string; emailVerified: boolean }) {
  return caseOrClaim(user.id, user.email, user.emailVerified);
}

// Cached on plain values: `cache` compares arguments by identity.
const caseOrClaim = cache(
  async (id: string, email: string, emailVerified: boolean) =>
    (await getCaseId(id)) ?? (await claimInvite({ id, email, emailVerified })),
);

/** For pages that work on a case: like requireUser, and sends users without a case to /onboarding. */
export async function requireCase() {
  const user = await requireUser();
  const caseId = await getOrClaimCaseId(user);
  if (!caseId) redirect("/onboarding");
  return { user, caseId };
}

/**
 * For route handlers, which answer with a status rather than redirecting:
 * the signed-in user and their case, or null.
 */
export async function findUserCase() {
  const session = await getSession();
  if (!session || !(await hasSignInMethod(session.user.id))) return null;
  const caseId = await getCaseId(session.user.id);
  return caseId ? { user: session.user, caseId } : null;
}
