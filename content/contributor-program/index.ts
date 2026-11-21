import type { Locale } from "@/i18n/config";
import { contributorEn } from "./en";
import { contributorHe } from "./he";
import type { ContributorTexts } from "./types";

// One entry per locale; adding a language means adding its file here.
const texts: Record<Locale, ContributorTexts> = { en: contributorEn, he: contributorHe };

export function getContributorTexts(locale: Locale): ContributorTexts {
  return texts[locale];
}

export const contributorPath = "/contributor-program";

/** The contact page's ?topic= for joining: it chooses the program as the message's topic. */
export const contributorTopic = "contributor-program";

/** The program's full terms. */
export const contributorTermsPath = "/legal/contributor-program";

export type { ContributorTexts } from "./types";
