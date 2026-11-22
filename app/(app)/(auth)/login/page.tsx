import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LAST_LOGIN_COOKIE } from "@/lib/auth";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { getSession } from "@/lib/session";
import { localePath, site } from "@/lib/site";
import { AuthHeading } from "@/components/app/auth-heading";
import { ConsentNote, Divider, Notice } from "@/components/app/auth-ui";
import { GoogleButton } from "@/components/app/google-button";
import { LoginForm } from "@/components/app/login-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.login };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string }> }) {
  if (await getSession()) redirect("/");
  const { error, reset } = await searchParams;
  const t = (await getAppDictionary()).app.auth;
  // How this browser last logged in (lib/auth.ts): tags the Google button or the email form.
  const lastMethod = (await cookies()).get(LAST_LOGIN_COOKIE)?.value;
  // Continuing with Google here creates an account for someone new, so the
  // sign-up page's consent line is shown here too.
  const locale = await getAppLocale();
  const legal = (slug: string) => new URL(localePath(locale, `/legal/${slug}`), site.url).toString();

  return (
    <>
      <AuthHeading title={t.login.title} />
      <div className="space-y-6">
        {reset === "done" && <Notice tone="success">{t.login.passwordUpdated}</Notice>}
        {error && <Notice>{t.errors.generic}</Notice>}
        <LoginForm
          t={t}
          lastUsed={lastMethod === "email" ? t.login.lastUsed : undefined}
          lead={
            <>
              <GoogleButton
                label={t.google}
                errorCallbackURL="/login"
                lastUsed={lastMethod === "google" ? t.login.lastUsed : undefined}
              />
              <Divider label={t.or} />
            </>
          }
        />
      </div>
      <div className="mt-6">
        <ConsentNote message={t.signup.consent} hrefs={[legal("terms"), legal("privacy")]} />
      </div>
      <p className="mt-8 text-center text-[15px]">
        {t.login.noAccount}{" "}
        <Link href="/signup" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
          {t.login.signupLink}
        </Link>
      </p>
    </>
  );
}
