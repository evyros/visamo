import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { account } from "./db/schema";

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
