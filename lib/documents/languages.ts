import { ARABIC } from "./countries";
import { LANGUAGES_WITHOUT_TRANSLATION, type Issuer } from "./certification";
import type { English } from "./issuers";

// Which translation a document needs depends on its language, not on the
// country that issued it (lib/knowledge/translation-languages.md): a language
// a notary in Israel knows is translated by one, into Hebrew; any other is
// translated abroad, into English, with a certification of its own. English
// is usually accepted as it is, and Arabic always.
//
// The app can't see a document's language, so it assumes the issuing
// country's, and the step names that language and says what to do if it's in
// another. These change only the translation step's words, not anyone's list.

/**
 * The languages notaries in Israel translate, as BCP 47 codes, in the three
 * groups of the knowledge's list, which the tests check this against: many
 * notaries, a few, and only one or two in the whole country.
 */
export const NOTARY_LANGUAGES = {
  many: ["ru", "uk", "be", "fr", "es", "pt", "it", "de", "nl", "yi", "ro", "pl", "bg", "ka"],
  few: ["hu", "el", "cs", "lt", "fa", "am", "zh", "af", "tr", "az", "uz"],
  oneOrTwo: ["sk", "sr", "hr", "bs", "lv", "kk", "ti", "sv", "da", "no", "fi", "is", "ln"],
} as const;

const notaryLanguages: ReadonlySet<string> = new Set(Object.values(NOTARY_LANGUAGES).flat());

/**
 * A country's languages where the likely one (below) isn't enough: its
 * official languages, where documents may be in any of them (Switzerland,
 * Canada), or where the likely language is a spoken one, not the one
 * documents are issued in (Paraguay's Guarani, Senegal's Wolof); or English,
 * where documents are issued in it (Ghana, Malta). Every other country gets
 * its likely language.
 */
export const COUNTRY_LANGUAGES: Readonly<Partial<Record<string, readonly string[]>>> = {
  AS: ["en"],
  BE: ["nl", "fr", "de"],
  BI: ["fr", "rn"],
  BQ: ["nl"],
  BY: ["be", "ru"],
  CA: ["en", "fr"],
  CF: ["fr", "sg"],
  CH: ["de", "fr", "it"],
  CM: ["fr", "en"],
  CW: ["nl", "pap", "en"],
  CY: ["el", "tr"],
  FI: ["fi", "sv"],
  FO: ["fo", "da"],
  GH: ["en"],
  GL: ["kl", "da"],
  HK: ["en"],
  HT: ["fr", "ht"],
  IN: ["en", "hi"],
  KE: ["en"],
  KG: ["ky", "ru"],
  KZ: ["kk", "ru"],
  LS: ["en", "st"],
  LU: ["fr", "de"],
  MG: ["mg", "fr"],
  ML: ["fr"],
  MO: ["zh", "pt"],
  MT: ["en"],
  MU: ["en"],
  NA: ["en"],
  NE: ["fr"],
  PG: ["en", "tpi"],
  PH: ["en"],
  PK: ["en", "ur"],
  PW: ["en", "pau"],
  PY: ["es", "gn"],
  RW: ["rw", "en", "fr"],
  SC: ["en", "fr"],
  SN: ["fr"],
  SS: ["en"],
  TK: ["en", "tkl"],
  TO: ["en", "to"],
  TV: ["en", "tvl"],
  TZ: ["sw", "en"],
  UG: ["en"],
  VU: ["bi", "en", "fr"],
  WS: ["en", "sm"],
  XK: ["en", "sq", "sr"],
  ZW: ["en"],
};

/** The locale data's codes for a language the notaries' list names otherwise: Norwegian is "no" there. */
const SAME_LANGUAGE: Readonly<Record<string, string>> = { nb: "no", nn: "no" };

/** A country's likely language, from the locale data every browser has (CLDR): "TM" → "tk". */
function likelyLanguage(country: string): string | undefined {
  try {
    const language = new Intl.Locale(`und-${country}`).maximize().language;
    return language === "und" ? undefined : (SAME_LANGUAGE[language] ?? language);
  } catch {
    return undefined;
  }
}

/** Hebrew and Arabic need no translation by law (certification.ts), so they aren't a route. */
const WITHOUT_TRANSLATION: ReadonlySet<string> = new Set(LANGUAGES_WITHOUT_TRANSLATION);

/**
 * How a document in a language is translated: none needed in practice
 * ("english"), by a notary in Israel ("notary"), or abroad, into English
 * ("abroad"). Arabic needs none by law, and isn't one: an Arabic-speaking
 * country's documents may be in another language too.
 */
export type TranslationRoute = "english" | "notary" | "abroad";

export function routeOf(language: string): TranslationRoute {
  if (language === "en") return "english";
  return notaryLanguages.has(language) ? "notary" : "abroad";
}

/**
 * The languages the issuing country's documents are assumed to be in: its own
 * (above), with English first where it can issue this one in English, or only
 * English where it always does (`english`, from issuers.ts); an online (Utah)
 * marriage's is English. None where the country isn't known, or speaks
 * Arabic or Hebrew: the step explains every language then.
 */
export function languagesOf(from: Issuer | undefined, english?: English): string[] {
  if (from === "utah" || english === "always") return ["en"];
  if (!from || ARABIC.has(from)) return [];
  const own = COUNTRY_LANGUAGES[from] ?? [likelyLanguage(from)].filter((language) => language !== undefined);
  // None known, or Hebrew or Arabic (Israel itself): the step explains every language.
  if (own.length === 0 || own.some((language) => WITHOUT_TRANSLATION.has(language))) return [];
  return english ? ["en", ...own.filter((language) => language !== "en")] : [...own];
}
