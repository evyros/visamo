import type { MetadataRoute } from "next";
import { glossaryPath, glossaryUpdated } from "@/content/glossary";
import { getGuides, guideSlugs } from "@/content/guides";
import { allAnswers, processPath, processUpdated, trackPath } from "@/content/process";
import { defaultLocale, liveLocales } from "@/i18n/config";
import { localePath, site } from "@/lib/site";

/** Every page, with when it was last updated where the content says (YYYY-MM-DD). */
const pages: { path: string; updated?: string }[] = [
  { path: "/" },
  { path: "/guide" },
  // Both languages of a guide share its date (content/guides/guides.test.ts).
  ...guideSlugs.map((slug) => ({ path: `/guide/${slug}`, updated: getGuides("en").docs[slug].updated })),
  { path: processPath, updated: processUpdated },
  // The versions for couples who haven't lived together point to these (canonicalAnswers).
  ...allAnswers.filter((a) => a.livedTogether).map((a) => ({ path: trackPath(a), updated: processUpdated })),
  { path: glossaryPath, updated: glossaryUpdated },
  ...[
    "/tools/recommendation-letter",
    "/pricing",
    "/security",
    "/about",
    "/how-we-built",
    "/data-privacy",
    "/contact",
    "/legal/privacy",
    "/legal/terms",
    "/legal/accessibility",
  ].map((path) => ({ path })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const absolute = (locale: (typeof liveLocales)[number], path: string) =>
    new URL(localePath(locale, path), site.url).toString();

  return pages.flatMap(({ path, updated }) =>
    liveLocales.map((locale) => ({
      url: absolute(locale, path),
      ...(updated && { lastModified: updated }),
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
