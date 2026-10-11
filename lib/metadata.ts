import type { Metadata } from "next";
import { defaultLocale, liveLocales, locales, type Locale } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages";
import { localePath, site } from "./site";

/** Per-page metadata with hreflang alternates for every live locale. */
export async function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
  image,
  article,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
  /** The page's own share image (a path on the site), instead of the site's default. */
  image?: { path: string; alt: string };
  /** A guide, shared as an article: when it was published and last changed, as YYYY-MM-DD. */
  article?: { published: string; modified: string };
}): Promise<Metadata> {
  const t = await loadMessages(locale);
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
      ...(article
        ? { type: "article" as const, publishedTime: article.published, modifiedTime: article.modified }
        : { type: "website" as const }),
      // A page's own openGraph replaces its parent's, file-based image included,
      // so every page names its image: its own, or the shared one (app/[lang]/opengraph-image.tsx).
      images: [
        image
          ? { url: image.path, width: 1200, height: 630, alt: image.alt }
          : { url: localePath(locale, "/opengraph-image/default"), width: 1200, height: 630, alt: t.meta.ogImage.alt },
      ],
    },
    metadataBase: new URL(site.url),
  };
}
