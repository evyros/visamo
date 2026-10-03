import type { Locale } from "@/i18n/config";
import type { Part } from "@/lib/documents/points";
import { findingText, type CheckFinding, type CheckRating, type FindingText } from "./result";

/** A finding in the viewer's language, with the part it's about for a document made of parts. */
export type FindingView = FindingText & { part?: Part };

/** An item's latest check as the documents page shows it, in the viewer's language. */
export type CheckView = {
  rating: CheckRating;
  issues: FindingView[];
  recommendations: FindingView[];
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
    result: { rating: CheckRating; issues: CheckFinding[]; recommendations: CheckFinding[] } | null;
    checkedAt: Date | null;
    checkedByName: string | null;
    fileIds: string[];
    contextFresh: boolean;
  },
  locale: Locale,
): CheckView | null {
  if (!check.result || !check.checkedAt) return null;
  const view = (f: CheckFinding): FindingView => ({ ...findingText(f, locale), ...(f.part && { part: f.part }) });
  return {
    rating: check.result.rating,
    issues: check.result.issues.map(view),
    recommendations: check.result.recommendations.map(view),
    checkedAt: check.checkedAt.toISOString(),
    checkedByName: check.checkedByName,
    fileIds: check.fileIds,
    contextFresh: check.contextFresh,
  };
}
