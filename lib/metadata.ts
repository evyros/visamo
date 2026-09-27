import type { Metadata } from "next";
import { defaultLocale, liveLocales, locales, type Locale } from "@/i18n/config";
import { localePath, site } from "./site";

/** Per-page metadata with hreflang alternates for every live locale. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
}): Metadata {
  const languages: Record<string, string> = Object.fromEntries(
    liveLocales.map((code) => [code, localePath(code, path)]),
  );
  languages["x-default"] = localePath(defaultLocale, path);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: localePath(locale, path), languages },
    openGraph: {
      title,
      description,
      url: localePath(locale, path),
      siteName: "Visamo",
      locale: locales[locale].intlLocale.replace("-", "_"),
      type: "website",
    },
    metadataBase: new URL(site.url),
  };
}
