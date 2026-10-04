import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { FullStory } from "@/components/fullstory";
import { builtLocales, locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return builtLocales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.home.title, template: `%s | ${t.meta.siteName}` },
    description: t.meta.home.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const locale = await getLocale();
  const t = await getDictionary();
  const { dir, script } = locales[locale];

  return (
    <html
      lang={locale}
      dir={dir}
      data-script={script}
      // globals.css scrolls smoothly for in-page #links. This tells Next to
      // turn that off while changing pages, so a new page opens at the top
      // instead of animating up from wherever the old one was scrolled.
      data-scroll-behavior="smooth"
      className={fontVariables}
    >
      <body className="flex min-h-screen flex-col text-[17px] leading-relaxed sm:text-lg">
        <a
          href="#main"
          className="sr-only z-[60] rounded-md bg-navy-900 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          {t.common.skipToContent}
        </a>
        <Header />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <Analytics />
        <FullStory />
      </body>
    </html>
  );
}
