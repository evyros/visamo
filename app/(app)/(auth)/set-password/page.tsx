import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAppDictionary } from "@/i18n/app-locale";
import { format } from "@/i18n/messages";
import { rich } from "@/i18n/rich";
import { getSession, hasSignInMethod } from "@/lib/session";
import { AuthHeading } from "@/components/app/auth-heading";
import { NewPasswordForm } from "@/components/app/new-password-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.setPassword };
}

// The sign-up link lands here, signed in, for a new user. It's the one step
// between verifying the email and using the app.
export default async function SetPasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (await hasSignInMethod(session.user.id)) redirect("/");
  const t = (await getAppDictionary()).app.auth;

  return (
    <>
      <AuthHeading title={t.setPassword.title}>
        {rich(format(t.setPassword.intro, { email: session.user.email }))}
      </AuthHeading>
      <NewPasswordForm mode="set" t={t} submitLabel={t.setPassword.submit} />
    </>
  );
}
