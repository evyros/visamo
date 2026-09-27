import type { ReactNode } from "react";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { localePath, site } from "@/lib/site";
import { AppLanguageSwitch } from "@/components/app/app-language-switch";
import { Logo } from "@/components/logo";

// Sign-in pages: the logo leads back to the website, and the language switch
// is there before anyone has an account.
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const locale = await getAppLocale();
  const t = await getAppDictionary();
  const siteHome = new URL(localePath(locale), site.url).toString();

  return (
    <>
      <header className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href={siteHome} aria-label="Visamo">
          <Logo />
        </a>
        <AppLanguageSwitch />
      </header>
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col items-center px-4 py-8 focus:outline-none sm:py-16">
        <div className="w-full max-w-[440px] rounded-2xl border border-line-200 bg-white p-6 shadow-soft sm:p-10">
          {children}
        </div>
        <a href={siteHome} className="mt-8 text-sm text-slate-600 underline-offset-4 hover:underline">
          {t.app.shell.backToSite}
        </a>
      </main>
    </>
  );
}
