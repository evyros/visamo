"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { LOCALE_COOKIE } from "@/i18n/config";
import { asLiveLocale } from "@/i18n/negotiate";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { BUY_COOKIE } from "@/lib/products";
import { getSession, hasSignInMethod } from "@/lib/session";

/** Saves the app language on this device and, when signed in, on the user. */
export async function saveLocale(code: string) {
  const locale = asLiveLocale(code);
  if (!locale) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const session = await getSession();
  if (session) await db.update(user).set({ locale }).where(eq(user.id, session.user.id));
}

export type SetPasswordResult = { error?: "passwordShort" | "passwordLong" | "generic" };

/** The last step of email sign-up: adds a password to the verified account. */
export async function setPassword(password: string): Promise<SetPasswordResult> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (await hasSignInMethod(session.user.id)) redirect("/");

  if (password.length < 8) return { error: "passwordShort" };
  if (password.length > 128) return { error: "passwordLong" };

  try {
    await auth.api.setPassword({ body: { newPassword: password }, headers: await headers() });
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    console.error("setPassword failed", error);
    return { error: "generic" };
  }
  redirect("/");
}

/** Forgets what the person chose to buy on the pricing page, once the buy page for it has opened. */
export async function clearBuyIntent() {
  (await cookies()).delete(BUY_COOKIE);
}
