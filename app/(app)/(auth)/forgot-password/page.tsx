import type { Metadata } from "next";
import Link from "next/link";
import { getAppDictionary } from "@/i18n/app-locale";
import { AuthHeading } from "@/components/app/auth-heading";
import { EmailLinkForm } from "@/components/app/email-link-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.forgotPassword };
}

export default async function ForgotPasswordPage() {
  const t = (await getAppDictionary()).app.auth;
  return (
    <>
      <AuthHeading title={t.forgot.title}>{t.forgot.intro}</AuthHeading>
      <EmailLinkForm kind="reset" t={t} submitLabel={t.forgot.submit} />
      <p className="mt-8 text-center text-[15px]">
        <Link href="/login" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
          {t.forgot.back}
        </Link>
      </p>
    </>
  );
}
