"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { findUser } from "@/lib/admin-users";
import { createImpersonation } from "@/lib/impersonation";
import { hasSignInMethod } from "@/lib/session";

/** Opens the app signed in as the user, by way of a one-time link (lib/impersonation.ts). */
export async function impersonate(formData: FormData) {
  const admin = await requireAdmin();
  const user = await findUser(String(formData.get("userId")));
  // Before sign-up is finished, the app would only show the admin the
  // set-password page, and let them give the user a password.
  if (!user || !(await hasSignInMethod(user.id))) return;
  redirect(await createImpersonation(user.id, admin));
}
