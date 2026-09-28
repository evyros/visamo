import type { Locale } from "@/i18n/config";

/**
 * An absolute URL from an environment variable. Empty values fall back to the
 * default, and a missing scheme ("app.visamo.co.il") gets https:// added, so a
 * half-filled variable in the hosting dashboard can't break the build.
 */
function urlFromEnv(value: string | undefined, fallback: string) {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed) return fallback;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

// Deployment-specific values. Override with environment variables.
export const site = {
  url: urlFromEnv(process.env.NEXT_PUBLIC_SITE_URL, "https://visamo.co.il"),
  appUrl: urlFromEnv(process.env.NEXT_PUBLIC_APP_URL, "https://app.visamo.co.il"),
  /** International format, digits only, e.g. 972501234567. */
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, ""),
  supportEmail: "support@visamo.co.il",
  securityEmail: "security@visamo.co.il",
};

/** One-time prices in ILS, VAT included. */
export const prices = {
  free: 0,
  assistant: 49,
  filePrep: 369,
} as const;

export type TierId = keyof typeof prices;

export function signupUrl(locale: Locale, plan?: TierId) {
  const url = new URL("/signup", site.appUrl);
  url.searchParams.set("lang", locale);
  if (plan && plan !== "free") url.searchParams.set("plan", plan);
  return url.toString();
}

export function loginUrl(locale: Locale) {
  const url = new URL("/login", site.appUrl);
  url.searchParams.set("lang", locale);
  return url.toString();
}

export function whatsappUrl() {
  return site.whatsappNumber ? `https://wa.me/${site.whatsappNumber}` : `mailto:${site.supportEmail}`;
}

/** A locale-prefixed path, e.g. localePath("he", "/pricing") -> "/he/pricing". */
export function localePath(locale: Locale, path = "") {
  return `/${locale}${path === "/" ? "" : path}`;
}
