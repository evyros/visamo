import { LOCALE_COOKIE, defaultLocale, isLocale, liveLocales, type Locale } from "./config";

/** The value as a live locale, or undefined (preview and unknown codes). */
export function asLiveLocale(value: string | undefined | null): Locale | undefined {
  return isLocale(value) && liveLocales.includes(value) ? value : undefined;
}

// "iw" is the legacy code for Hebrew that some browsers still send.
const baseOf = (tag: string) => (tag.split("-")[0] === "iw" ? "he" : tag.split("-")[0]);

/**
 * The best live locale for an Accept-Language header, if any matches. Hebrew
 * wins whenever it's listed at all: many Israelis keep English as the browser's
 * first language and Hebrew second.
 */
export function matchAcceptLanguage(header: string | null): Locale | undefined {
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

  const hebrew = asLiveLocale("he");
  if (hebrew && preferred.some(({ tag }) => baseOf(tag) === "he")) return hebrew;

  for (const { tag } of preferred) {
    const base = baseOf(tag);
    const exact = liveLocales.find((l) => l.toLowerCase() === tag);
    if (exact) return exact;
    const byBase = liveLocales.find((l) => l.split("-")[0].toLowerCase() === base);
    if (byBase) return byBase;
  }
  return undefined;
}

function readCookie(cookieHeader: string | null, name: string) {
  for (const part of cookieHeader?.split(";") ?? []) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

/**
 * The locale for a request without a language in its URL: the saved cookie,
 * then Accept-Language, then English.
 */
export function localeFromHeaders(headers: Headers): Locale {
  return (
    asLiveLocale(readCookie(headers.get("cookie"), LOCALE_COOKIE)) ??
    matchAcceptLanguage(headers.get("accept-language")) ??
    defaultLocale
  );
}
