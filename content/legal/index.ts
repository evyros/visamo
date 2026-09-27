import type { Locale } from "@/i18n/config";
import { legalEn } from "./en";
import { legalHe } from "./he";
import type { LegalContent } from "./types";

// One entry per locale; adding a language means adding its legal file here.
const legal: Record<Locale, LegalContent> = { en: legalEn, he: legalHe };

export function getLegal(locale: Locale): LegalContent {
  return legal[locale];
}

export type { LegalBlock, LegalDoc, LegalSlug } from "./types";
