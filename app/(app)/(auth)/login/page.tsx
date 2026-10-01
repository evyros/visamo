import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppDictionary } from "@/i18n/app-locale";
import { getSession } from "@/lib/session";
import { AuthHeading } from "@/components/app/auth-heading";
import { Divider, Notice } from "@/components/app/auth-ui";
import { GoogleButton } from "@/components/app/google-button";
import { LoginForm } from "@/components/app/login-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.login };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; reset?: string }> }) {
  if (await getSession()) redirect("/");
  const { error, reset } = await searchParams;
  const t = (await getAppDictionary()).app.auth;

  // COMING SOON: login is open only in local dev. Remove this block to open it everywhere.
  if (process.env.NODE_ENV !== "development") {
    return (
      <>
        <AuthHeading title={t.login.title} />
        <p className="text-center text-[16px] text-slate-700">{t.comingSoon}</p>
      </>
    );
  }

  return (
    <>
      <AuthHeading title={t.login.title} />
      <div className="space-y-6">
        {reset === "done" && <Notice tone="success">{t.login.passwordUpdated}</Notice>}
        {error && <Notice>{t.errors.generic}</Notice>}
        <GoogleButton label={t.google} errorCallbackURL="/login" />
        <Divider label={t.or} />
        <LoginForm t={t} />
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
