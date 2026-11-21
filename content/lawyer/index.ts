import type { GuideSlug } from "@/content/guides";
import type { Locale } from "@/i18n/config";
import { lawyerEn } from "./en";
import { lawyerHe } from "./he";
import type { LawyerTexts } from "./types";

// One entry per locale; adding a language means adding its file here.
const texts: Record<Locale, LawyerTexts> = { en: lawyerEn, he: lawyerHe };

export function getLawyerTexts(locale: Locale): LawyerTexts {
  return texts[locale];
}

export const lawyerPath = "/do-we-need-a-lawyer";

/** When the page's facts were last checked, as YYYY-MM-DD: the same in both languages. */
export const lawyerUpdated = "2026-11-21";

/** The guides it points to at the end. */
export const lawyerRelated: GuideSlug[] = ["partner-visa-documents", "partner-visa-timeline"];

export type { LawyerSection, LawyerTexts } from "./types";
