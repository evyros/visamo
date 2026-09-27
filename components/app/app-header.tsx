import Link from "next/link";
import { getAppDictionary } from "@/i18n/app-locale";
import { Logo } from "@/components/logo";
import { AppLanguageSwitch } from "./app-language-switch";
import { SignOutButton } from "./sign-out-button";

/** The header for signed-in app pages. */
export async function AppHeader() {
  const t = await getAppDictionary();
  return (
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
  );
}
