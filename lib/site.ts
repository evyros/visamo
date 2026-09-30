import type { Locale } from "@/i18n/config";
import type { ProductId } from "@/lib/products";

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
  /** The admin panel (app/admin), for the owner only. */
  adminUrl: urlFromEnv(process.env.NEXT_PUBLIC_ADMIN_URL, "https://admin.visamo.co.il"),
  /** International format, digits only, e.g. 972501234567. */
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, ""),
  supportEmail: "support@visamo.co.il",
  securityEmail: "support@visamo.co.il",
};

/** One-time prices in ILS, VAT included. */
export const prices: Record<ProductId, number> = {
  messagePack: 49,
  fileCheck: 369,
};

/** Signup, and with `product`, what the person chose to buy on the pricing page. */
export function signupUrl(locale: Locale, product?: ProductId) {
  const url = new URL("/signup", site.appUrl);
  url.searchParams.set("lang", locale);
  if (product) url.searchParams.set("buy", product);
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

/** The website's contact page, where all support requests go. */
export function contactUrl(locale: Locale) {
  return site.url + localePath(locale, "/contact");
}

/** Link props that open the page in a new tab, so people don't leave the app. */
export const newTab = { target: "_blank", rel: "noopener" } as const;

/** A locale-prefixed path, e.g. localePath("he", "/pricing") -> "/he/pricing". */
export function localePath(locale: Locale, path = "") {
  return `/${locale}${path === "/" ? "" : path}`;
}
