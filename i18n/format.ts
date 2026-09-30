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

/** An amount that was paid, to the agora, in its currency (ILS when unknown). */
export function formatAmount(amount: number, currency: string | null, locale: Locale) {
  return new Intl.NumberFormat(locales[locale].intlLocale, {
    style: "currency",
    currency: (currency ?? "ILS").toUpperCase(),
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
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

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60],
  ["hour", 60 * 60],
  ["day", 24 * 60 * 60],
];

/** How long ago, e.g. "5 minutes ago" or "yesterday"; the date itself after a week. */
export function formatAgo(date: Date, locale: Locale, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  if (seconds < -7 * 24 * 60 * 60) return formatDate(date, locale);
  const rtf = new Intl.RelativeTimeFormat(locales[locale].intlLocale, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return rtf.format(0, "second");
  const [unit, size] = units.findLast(([, size]) => Math.abs(seconds) >= size)!;
  return rtf.format(Math.round(seconds / size), unit);
}

/** Days from today to a `yyyy-mm-dd` date, e.g. "in 12 days" or "tomorrow". */
export function formatDaysUntil(day: string, locale: Locale, now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((Date.parse(`${day}T00:00:00Z`) - today) / 86_400_000);
  return new Intl.RelativeTimeFormat(locales[locale].intlLocale, { numeric: "auto" }).format(days, "day");
}

/** A `yyyy-mm-dd` date as a calendar date, without shifting it by the time zone. */
export function formatDay(day: string, locale: Locale) {
  return new Intl.DateTimeFormat(locales[locale].intlLocale, { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${day}T00:00:00Z`),
  );
}

/** A moment, e.g. "3 Oct 2026, 14:00", in Israel time: the server runs in UTC, and the couples are in Israel. */
export function formatDateTime(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locales[locale].intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jerusalem",
  }).format(date);
}
