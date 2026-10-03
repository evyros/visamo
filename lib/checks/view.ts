import type { Locale } from "@/i18n/config";
import type { Part } from "@/lib/documents/points";
import type { DismissReason, FindingKind, IndexedFinding } from "./dismissals";
import { findingText, type CheckFinding, type CheckRating, type FindingText } from "./result";

// What the app sends the browser about an item's check. Every field is
// listed here, so nothing else about a run or a dismissal (the couple's
// note, the admin's review) can reach a response.

/**
 * A finding in the viewer's language, with the part it's about for a
 * document made of parts, and its place in the run's list, which dismissing
 * it points to.
 */
export type FindingView = FindingText & { part?: Part; index: number };

/** A finding the couple dismissed: who, when and why. */
export type DismissedView = FindingText & {
  id: string;
  kind: FindingKind;
  part?: Part;
  reason: DismissReason;
  /** ISO date. */
  dismissedAt: string;
  /** Null when the account is gone. */
  dismissedByName: string | null;
};

/** An item's latest check as the documents page shows it, in the viewer's language. */
export type CheckView = {
  /** The run it's from: a dismissal names it, so it can't land on a newer one. */
  runId: string;
  /** Worked out again without the dismissed findings (lib/checks/dismissals.ts). */
  rating: CheckRating;
  issues: FindingView[];
  recommendations: FindingView[];
  dismissed: DismissedView[];
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
    runId: string | null;
    result: { rating: CheckRating; issues: IndexedFinding[]; recommendations: IndexedFinding[] } | null;
    dismissed: {
      id: string;
      kind: FindingKind;
      finding: CheckFinding;
      reason: DismissReason;
      dismissedAt: Date;
      dismissedByName: string | null;
    }[];
    checkedAt: Date | null;
    checkedByName: string | null;
    fileIds: string[];
    contextFresh: boolean;
  },
  locale: Locale,
): CheckView | null {
  if (!check.result || !check.checkedAt || !check.runId) return null;
  const text = (f: CheckFinding) => ({ ...findingText(f, locale), ...(f.part && { part: f.part }) });
  const view = (f: IndexedFinding): FindingView => ({ ...text(f), index: f.index });
  return {
    runId: check.runId,
    rating: check.result.rating,
    issues: check.result.issues.map(view),
    recommendations: check.result.recommendations.map(view),
    dismissed: check.dismissed.map((d) => ({
      ...text(d.finding),
      id: d.id,
      kind: d.kind,
      reason: d.reason,
      dismissedAt: d.dismissedAt.toISOString(),
      dismissedByName: d.dismissedByName,
    })),
    checkedAt: check.checkedAt.toISOString(),
    checkedByName: check.checkedByName,
    fileIds: check.fileIds,
    contextFresh: check.contextFresh,
  };
}
