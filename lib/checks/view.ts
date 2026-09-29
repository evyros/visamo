import type { Locale } from "@/i18n/config";
import type { CheckRating } from "./result";

/** An item's latest check as the documents page shows it, in the viewer's language. */
export type CheckView = {
  rating: CheckRating;
  issues: string[];
  recommendations: string[];
  /** ISO date. */
  checkedAt: string;
  /** Null when the account is gone. */
  checkedByName: string | null;
  /** The files it checked: once the item's files differ, the result no longer applies. */
  fileIds: string[];
  /** False once the case details it was checked against changed. */
  contextFresh: boolean;
};

export function checkView(
  check: {
    result: { rating: CheckRating; issues: { en: string; he: string }[]; recommendations: { en: string; he: string }[] } | null;
    checkedAt: Date | null;
    checkedByName: string | null;
    fileIds: string[];
    contextFresh: boolean;
  },
  locale: Locale,
): CheckView | null {
  if (!check.result || !check.checkedAt) return null;
  return {
    rating: check.result.rating,
    issues: check.result.issues.map((f) => f[locale]),
    recommendations: check.result.recommendations.map((f) => f[locale]),
    checkedAt: check.checkedAt.toISOString(),
    checkedByName: check.checkedByName,
    fileIds: check.fileIds,
    contextFresh: check.contextFresh,
  };
}
