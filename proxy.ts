import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { LOCALE_COOKIE, isLocale } from "./i18n/config";
import { asLiveLocale, localeFromHeaders } from "./i18n/negotiate";
import { accessPathPattern, publicAppPaths } from "./lib/app-paths";
import { site } from "./lib/site";

const appHost = new URL(site.appUrl).host;
const adminHost = new URL(site.adminUrl).host;
const ONE_YEAR = 60 * 60 * 24 * 365;
/** Where to go after logging in: a support-access link opened while logged out. */
const RETURN_COOKIE = "return_to";

// Three hosts, one project. The website (visamo.co.il) has the language in its
// URLs; the app (app.visamo.co.il) keeps it in a cookie; the admin panel
// (admin.visamo.co.il) is served from app/admin.
export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (host === adminHost) return adminProxy(request);
  return host === appHost ? appProxy(request) : siteProxy(request);
}

// admin.visamo.co.il/x shows app/admin/x. Pages check the session themselves
// (lib/admin.ts), so there's no cookie check here.
function adminProxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
  const response = NextResponse.rewrite(url);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
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

  // The admin panel exists only on its own host.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new NextResponse(null, { status: 404 });
  }

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
  const signedIn = !!getSessionCookie(request);
  if (!publicAppPaths.includes(pathname) && !signedIn) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Every way of logging in lands on "/", which then returns to the link.
    if (accessPathPattern.test(pathname)) {
      response.cookies.set(RETURN_COOKIE, pathname, { path: "/", maxAge: 60 * 60, httpOnly: true, sameSite: "lax" });
    }
    return response;
  }

  const returnTo = request.cookies.get(RETURN_COOKIE)?.value;
  if (pathname === "/" && signedIn && returnTo) {
    const response = NextResponse.redirect(new URL(accessPathPattern.test(returnTo) ? returnTo : "/", request.url));
    response.cookies.delete(RETURN_COOKIE);
    return response;
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
