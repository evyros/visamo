import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { LOCALE_COOKIE, isLocale } from "./i18n/config";
import { asLiveLocale, localeFromHeaders } from "./i18n/negotiate";
import { publicAppPaths } from "./lib/app-paths";
import { site } from "./lib/site";

const appHost = new URL(site.appUrl).host;
const ONE_YEAR = 60 * 60 * 24 * 365;

// Two hosts, one project. The website (visamo.co.il) has the language in its
// URLs; the app (app.visamo.co.il) keeps it in a cookie.
export function proxy(request: NextRequest) {
  return request.headers.get("host") === appHost ? appProxy(request) : siteProxy(request);
}

// Redirects locale-less URLs to a locale: the saved cookie, then the browser's
// Accept-Language matched against live locales, then English.
function siteProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLocale(pathname.split("/")[1])) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${localeFromHeaders(request.headers)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

function appProxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Website pages belong on the website host.
  if (isLocale(pathname.split("/")[1])) {
    return NextResponse.redirect(new URL(pathname + request.nextUrl.search, site.url));
  }

  // The website links here with ?lang=he. Save it and drop it from the URL,
  // so the language sticks for the rest of the visit.
  const lang = searchParams.get("lang");
  if (lang !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete("lang");
    const response = NextResponse.redirect(url);
    const locale = asLiveLocale(lang);
    if (locale) {
      response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
    }
    return response;
  }

  // An optimistic check on the cookie alone, so signed-out visitors skip a
  // render. Pages still verify the session itself (lib/session.ts).
  if (!publicAppPaths.includes(pathname) && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Skip Next internals, API routes and any file with an extension
  // (favicon.ico, robots.txt, sitemap.xml, images).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
