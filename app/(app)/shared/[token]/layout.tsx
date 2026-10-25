import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { Logo } from "@/components/logo";

// A shared chat's public page, open to anyone with the link: the logo leads to
// the website, without a language so it picks the visitor's own. No language
// switch: the page is in the language it was shared in (i18n/app-locale.ts).
export default function SharedChatLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href={site.url} aria-label="Visamo">
          <Logo />
        </a>
      </header>
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col px-4 pt-4 pb-6 focus:outline-none sm:px-6 sm:pt-8">
        <div className="mx-auto w-full max-w-[768px]">{children}</div>
      </main>
    </>
  );
}
