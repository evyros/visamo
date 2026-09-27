import type { Metadata } from "next";
import { Heebo, Inter, Rubik, Source_Serif_4 } from "next/font/google";
import { builtLocales, locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { site } from "@/lib/site";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });
// Hebrew headings: a smooth, modern sans that pairs with Heebo body text.
const rubik = Rubik({ subsets: ["hebrew", "latin"], variable: "--font-rubik", display: "swap" });

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
      className={`${inter.variable} ${sourceSerif.variable} ${heebo.variable} ${rubik.variable}`}
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
      </body>
    </html>
  );
}
