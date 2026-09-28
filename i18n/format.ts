import { locales, type Locale } from "./config";

// All user-visible numbers, prices and country names go through Intl, so each
// language gets its own symbol position, digits and spacing.

export function formatPrice(amount: number, locale: Locale) {
  return new Intl.NumberFormat(locales[locale].intlLocale, {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Country name in the given language, from an ISO 3166 region code. */
export function regionName(region: string, locale: Locale) {
  return (
    new Intl.DisplayNames([locales[locale].intlLocale], { type: "region" }).of(region) ??
    region
  );
}

/** A calendar date, e.g. "27 Sept 2026". */
export function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locales[locale].intlLocale, { dateStyle: "medium" }).format(date);
}
