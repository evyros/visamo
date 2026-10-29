import type { Locale } from "@/i18n/config";
import { branchesEn } from "./en";
import { branchesHe } from "./he";
import type { BranchesTexts } from "./types";

// One entry per locale; adding a language means adding its file here.
const texts: Record<Locale, BranchesTexts> = { en: branchesEn, he: branchesHe };

export function getBranchesTexts(locale: Locale): BranchesTexts {
  return texts[locale];
}

export const branchesPath = "/branches";
export const surveyPath = "/branches/survey";

export {
  sentimentIds,
  stageIds,
  type BranchStats,
  type BranchesStats,
  type BranchesTexts,
  type Plural,
  type SentimentId,
  type StageId,
  type SurveyTexts,
  type WaitSummary,
} from "./types";
