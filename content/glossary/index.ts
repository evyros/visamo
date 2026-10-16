import type { Locale } from "@/i18n/config";
import { glossaryEn } from "./en";
import { glossaryHe } from "./he";
import type { GlossaryTexts } from "./types";

// One entry per locale; adding a language means adding its file here.
const texts: Record<Locale, GlossaryTexts> = { en: glossaryEn, he: glossaryHe };

export function getGlossaryTexts(locale: Locale): GlossaryTexts {
  return texts[locale];
}

export const glossaryPath = "/guide/glossary";

/** When the terms were last checked against lib/knowledge, as YYYY-MM-DD. */
export const glossaryUpdated = "2026-10-16";

/**
 * The knowledge-base files (lib/knowledge) the glossary comes from. When one
 * changes, glossary.test.ts fails until the glossary is checked against it in
 * both languages (npm run guides:lock).
 */
export const glossarySources = [
  "glossary.md",
  "process.md",
  "application.md",
  "first-appointment.md",
  "entry-permit.md",
  "interview.md",
  "both-abroad.md",
  "documents.md",
  "certification.md",
  "children.md",
  "former-ussr.md",
  "documents/ishurToshav.md",
  "documents/governmentServices.md",
  "documents/childrenSchoolRecords.md",
  "documents/foreignHealthInsurance.md",
  "documents/israeliIncomeProof.md",
  "documents/custodyOrder.md",
  "documents/foreignCivilStatus.md",
];

export { glossaryGroups, glossaryTerms } from "./terms";
export { glossaryGroupIds, type GlossaryGroupId, type GlossaryTerm, type GlossaryTexts } from "./types";
