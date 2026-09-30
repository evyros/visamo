import type { ReactNode } from "react";
import Link from "next/link";
import { AppLanguageSwitch } from "@/components/app/app-language-switch";
import { Logo } from "@/components/logo";

// The support-access page: one question on a card, outside the file's
// sidebar, like the sign-in pages. The logo leads into the app.
export default function AccessLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Visamo">
          <Logo />
        </Link>
        <AppLanguageSwitch />
      </header>
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col items-center px-4 py-8 focus:outline-none sm:py-16">
        <div className="w-full max-w-[480px] rounded-2xl border border-line-200 bg-white p-6 shadow-soft sm:p-10">
          {children}
        </div>
      </main>
    </>
  );
}
