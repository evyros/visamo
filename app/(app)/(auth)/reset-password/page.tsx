import type { Metadata } from "next";
import { getAppDictionary } from "@/i18n/app-locale";
import { AuthHeading } from "@/components/app/auth-heading";
import { Notice } from "@/components/app/auth-ui";
import { NewPasswordForm } from "@/components/app/new-password-form";
import { ButtonLink } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.resetPassword };
}

// The link in a reset email goes through /api/auth/reset-password/<token>,
// which checks the token and lands here with ?token= (or ?error= if invalid).
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const t = (await getAppDictionary()).app.auth;

  return (
    <>
      <AuthHeading title={t.reset.title} />
      {token && !error ? (
        <NewPasswordForm mode="reset" token={token} t={t} submitLabel={t.reset.submit} />
      ) : (
        <div className="space-y-6">
          <Notice>{t.reset.invalid}</Notice>
          <ButtonLink href="/forgot-password" className="w-full">
            {t.reset.requestNew}
          </ButtonLink>
        </div>
      )}
    </>
  );
}
