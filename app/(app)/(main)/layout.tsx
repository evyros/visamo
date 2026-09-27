import Link from "next/link";
import type { ReactNode } from "react";
import { getAppDictionary } from "@/i18n/app-locale";
import { requireUser } from "@/lib/session";
import { AppLanguageSwitch } from "@/components/app/app-language-switch";
import { SignOutButton } from "@/components/app/sign-out-button";
import { Logo } from "@/components/logo";

// Every page in here needs a signed-in user who has finished sign-up.
export default async function MainLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const t = await getAppDictionary();

  return (
    <>
      <header className="border-b border-line-200 bg-white">
        <div className="mx-auto flex h-[64px] w-full max-w-[1200px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Visamo">
            <Logo />
          </Link>
          <div className="ms-auto flex items-center gap-3">
            <AppLanguageSwitch />
            <SignOutButton label={t.app.shell.signOut} />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
    </>
  );
}
