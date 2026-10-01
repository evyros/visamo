import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { getSession } from "@/lib/session";
import { localePath, site } from "@/lib/site";
import { AuthHeading } from "@/components/app/auth-heading";
import { Divider, Notice } from "@/components/app/auth-ui";
import { EmailLinkForm } from "@/components/app/email-link-form";
import { GoogleButton } from "@/components/app/google-button";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.signup };
}

/** Renders "[Terms of use]" style brackets in a message as links, in order. */
function withLinks(message: string, hrefs: string[]) {
  return message.split(/\[(.+?)\]/g).map((part, i) =>
    i % 2 === 1 ? (
      <a key={i} href={hrefs[(i - 1) / 2]} className="font-medium text-teal-700 underline underline-offset-2">
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  if (await getSession()) redirect("/");
  // A sign-up link that failed (expired, used twice) comes back here with
  // ?error=. A partner invite links here with ?email= filled in.
  const { error, email } = await searchParams;
  const locale = await getAppLocale();
  const t = (await getAppDictionary()).app.auth;

  // COMING SOON: signup is open only in local dev. Remove this block to open it everywhere.
  if (process.env.NODE_ENV !== "development") {
    return <AuthHeading title={t.signup.title}>{t.comingSoon}</AuthHeading>;
  }

  const legal = (slug: string) => new URL(localePath(locale, `/legal/${slug}`), site.url).toString();

  return (
    <>
      <AuthHeading title={t.signup.title}>{t.signup.intro}</AuthHeading>
      <div className="space-y-6">
        {error && <Notice>{t.linkError}</Notice>}
        <EmailLinkForm
          kind="signup"
          t={t}
          submitLabel={t.signup.submit}
          defaultEmail={typeof email === "string" ? email : undefined}
          lead={
            <div className="space-y-6 pb-1">
              <GoogleButton label={t.google} errorCallbackURL="/signup" />
              <Divider label={t.or} />
            </div>
          }
        >
          <p className="text-center text-sm text-slate-600">
            {withLinks(t.signup.consent, [legal("terms"), legal("privacy")])}
          </p>
        </EmailLinkForm>
      </div>
      <p className="mt-8 text-center text-[15px]">
        {t.signup.hasAccount}{" "}
        <Link href="/login" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
          {t.signup.loginLink}
        </Link>
      </p>
    </>
  );
}
