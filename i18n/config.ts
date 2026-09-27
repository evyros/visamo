// The single source of truth for languages. Adding a language means adding an
// entry here and a reviewed messages/<code>.json file; no component changes.

export type LocaleStatus = "live" | "preview" | "off";

type LocaleConfig = {
  /** BCP 47 code, used in the URL, <html lang> and hreflang. */
  dir: "ltr" | "rtl";
  /** The language's own name, shown in the language switch. */
  nativeName: string;
  /** Drives number, currency, date and country-name formatting. */
  intlLocale: string;
  /** Which font stack the locale uses (see app/[lang]/layout.tsx). */
  script: "latin" | "hebrew";
  /** `preview` locales are built but hidden from the switch and sitemap. */
  status: LocaleStatus;
};

export const locales = {
  en: {
    dir: "ltr",
    nativeName: "English",
    intlLocale: "en-IL",
    script: "latin",
    status: "live",
  },
  he: {
    dir: "rtl",
    nativeName: "עברית",
    intlLocale: "he-IL",
    script: "hebrew",
    status: "live",
  },
} as const satisfies Record<string, LocaleConfig>;

export type Locale = keyof typeof locales;

export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const allLocales = Object.keys(locales) as Locale[];

/** Locales that are routable (live + preview). */
const statusOf = (code: Locale): LocaleStatus => locales[code].status;

export const builtLocales = allLocales.filter((code) => statusOf(code) !== "off");

/** Locales shown to the public: language switch, sitemap, hreflang. */
export const liveLocales = allLocales.filter((code) => statusOf(code) === "live");

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && builtLocales.includes(value as Locale);
}
