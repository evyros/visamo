"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createLoginLink, signOutAdmin } from "@/lib/admin";
import { sendAdminLoginEmail } from "@/lib/email";

/**
 * Emails the login link when the email and the OTP (the admin password) are
 * right. The answer is the same either way, and the email goes out after the
 * response, so a wrong guess can't be told apart by its timing either.
 */
export async function requestLoginLink(_: unknown, formData: FormData): Promise<{ sent: true }> {
  const email = String(formData.get("email") ?? "").slice(0, 320);
  const otp = String(formData.get("otp") ?? "").slice(0, 256);
  const link = await createLoginLink(email, otp);
  if (link) {
    after(() =>
      sendAdminLoginEmail(link).catch((error) => console.error("Admin login email failed", error)),
    );
  }
  return { sent: true };
}

export async function signOut() {
  await signOutAdmin();
  redirect("/login");
}
