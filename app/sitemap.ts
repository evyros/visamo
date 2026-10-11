import type { MetadataRoute } from "next";
import { guideSlugs } from "@/content/guides";
import { allAnswers, processPath, trackPath } from "@/content/process";
import { defaultLocale, liveLocales } from "@/i18n/config";
import { localePath, site } from "@/lib/site";

const paths = [
  "/",
  "/guide",
  ...guideSlugs.map((slug) => `/guide/${slug}`),
  processPath,
  // The versions for couples who haven't lived together point to these (canonicalAnswers).
  ...allAnswers.filter((a) => a.livedTogether).map(trackPath),
  "/pricing",
  "/security",
  "/about",
  "/how-we-built",
  "/data-privacy",
  "/contact",
  "/legal/privacy",
  "/legal/terms",
  "/legal/accessibility",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const absolute = (locale: (typeof liveLocales)[number], path: string) =>
    new URL(localePath(locale, path), site.url).toString();

  return paths.flatMap((path) =>
    liveLocales.map((locale) => ({
      url: absolute(locale, path),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : path.startsWith("/guide") ? 0.9 : 0.7,
      alternates: {
        languages: {
          ...Object.fromEntries(liveLocales.map((code) => [code, absolute(code, path)])),
          "x-default": absolute(defaultLocale, path),
        },
      },
    })),
  );
}
