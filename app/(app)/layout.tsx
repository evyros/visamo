import type { Metadata } from "next";
import type { ReactNode } from "react";
import { locales } from "@/i18n/config";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";
import "../globals.css";

// Root layout for the app (app.visamo.co.il). The language comes from a
// cookie, not the URL (see i18n/app-locale.ts), and nothing here is indexed.

export const metadata: Metadata = {
  metadataBase: new URL(site.appUrl),
  title: { default: "Visamo", template: "%s | Visamo" },
  robots: { index: false, follow: false },
};

export default async function AppRootLayout({ children }: { children: ReactNode }) {
  const locale = await getAppLocale();
  const t = await getAppDictionary();
  const { dir, script } = locales[locale];

  return (
    <html lang={locale} dir={dir} data-script={script} className={fontVariables}>
      <body className="flex min-h-screen flex-col bg-sand-50 text-[17px] leading-relaxed sm:text-lg">
        <a
          href="#main"
          className="sr-only z-[60] rounded-md bg-navy-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          {t.common.skipToContent}
        </a>
        {children}
      </body>
    </html>
  );
}
