import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, isLocale, liveLocales, type Locale } from "./i18n/config";

// Redirects locale-less URLs to a locale. Precedence: the saved cookie, then
// the browser's Accept-Language matched against live locales, then English.

function matchAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined;
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter(({ tag, q }) => tag && q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferred) {
    // "iw" is the legacy code for Hebrew that some browsers still send.
    const base = tag.split("-")[0] === "iw" ? "he" : tag.split("-")[0];
    const exact = liveLocales.find((l) => l.toLowerCase() === tag);
    if (exact) return exact;
    const byBase = liveLocales.find((l) => l.split("-")[0].toLowerCase() === base);
    if (byBase) return byBase;
  }
  return undefined;
}

function getLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(saved) && liveLocales.includes(saved)) return saved;
  return matchAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];
  if (isLocale(first)) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${getLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, API routes and any file with an extension
  // (favicon.ico, robots.txt, sitemap.xml, images).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
