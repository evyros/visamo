import type { Locale } from "@/i18n/config";
import type { Part } from "@/lib/documents/points";
import type { DismissReason, FindingKind, IndexedFinding } from "./dismissals";
import { findingText, type CheckFinding, type CheckRating, type FindingText } from "./result";
import type { FindingHistory, SharedOutcome } from "./store";

/** One step of a reviewed finding's history (lib/checks/store.ts FindingHistoryEntry), dates as ISO. */
export type HistoryEntryView =
  | { type: "dismissed"; at: string; name: string | null; reason: DismissReason; note: string | null }
  | { type: "restored"; at: string; name: string | null }
  | { type: "reviewed"; at: string; outcome: SharedOutcome; note: string | null };

/**
 * A finding the admin reviewed: the latest review's outcome, for its badge,
 * and its history, for the badge's dialog. `isNew` until either partner opens
 * it (the badge pulses); `reviewId` marks it opened.
 */
export type HistoryView = { outcome: SharedOutcome; entries: HistoryEntryView[]; reviewId: string; isNew: boolean };

// What the app sends the browser about an item's check. Every field is
// listed here, so nothing else about a run or a dismissal (the couple's
// note outside a reviewed finding's history, who reviewed it) can reach a response.

/**
 * A finding in the viewer's language, with the part it's about for a
 * document made of parts, and its place in the run's list, which dismissing
 * it points to.
 */
export type FindingView = FindingText & { part?: Part; index: number; history?: HistoryView };

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
  history?: HistoryView;
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
  /** False once the couple's details it was checked against changed. A change to the checks never retires it. */
  detailsFresh: boolean;
  /** A free check: the admin approved it, or it's the couple's own that used their free check (lib/checks/free.ts). */
  free: boolean;
  /**
   * Only the rating is shown, and how many findings there are: they come
   * with Full file check. `issues` and `recommendations` are empty then.
   */
  locked: { issues: number; recommendations: number } | null;
};

export function checkView(
  check: {
    runId: string | null;
    result: { rating: CheckRating; issues: IndexedFinding[]; recommendations: IndexedFinding[] } | null;
    dismissed: {
      id: string;
      kind: FindingKind;
      index: number;
      finding: CheckFinding;
      reason: DismissReason;
      dismissedAt: Date;
      dismissedByName: string | null;
    }[];
    histories: FindingHistory[];
    checkedAt: Date | null;
    checkedByName: string | null;
    fileIds: string[];
    detailsFresh: boolean;
    free: boolean;
    locked: { issues: number; recommendations: number } | null;
  },
  locale: Locale,
): CheckView | null {
  if (!check.result || !check.checkedAt || !check.runId) return null;
  // Never a locked result's findings, even if the check came with them.
  const shown: { issues: IndexedFinding[]; recommendations: IndexedFinding[] } = check.locked
    ? { issues: [], recommendations: [] }
    : check.result;
  const text = (f: CheckFinding) => ({ ...findingText(f, locale), ...(f.part && { part: f.part }) });
  const history = (kind: FindingKind, index: number): { history?: HistoryView } => {
    const found = check.histories.find((h) => h.kind === kind && h.index === index);
    if (!found) return {};
    const entries = found.entries.map((e): HistoryEntryView => {
      const at = e.at.toISOString();
      switch (e.type) {
        case "dismissed":
          return { type: e.type, at, name: e.name, reason: e.reason, note: e.note };
        case "restored":
          return { type: e.type, at, name: e.name };
        case "reviewed":
          return { type: e.type, at, outcome: e.outcome, note: e.note };
      }
    });
    return { history: { outcome: found.outcome, entries, reviewId: found.reviewId, isNew: found.isNew } };
  };
  const view = (kind: FindingKind) => (f: IndexedFinding): FindingView => ({
    ...text(f),
    index: f.index,
    ...history(kind, f.index),
  });
  return {
    runId: check.runId,
    rating: check.result.rating,
    issues: shown.issues.map(view("issue")),
    recommendations: shown.recommendations.map(view("recommendation")),
    // A locked result's dismissed findings are its findings too, with the couple's and Visamo's notes.
    dismissed: (check.locked ? [] : check.dismissed).map((d) => ({
      ...text(d.finding),
      id: d.id,
      kind: d.kind,
      reason: d.reason,
      dismissedAt: d.dismissedAt.toISOString(),
      dismissedByName: d.dismissedByName,
      ...history(d.kind, d.index),
    })),
    checkedAt: check.checkedAt.toISOString(),
    checkedByName: check.checkedByName,
    fileIds: check.fileIds,
    detailsFresh: check.detailsFresh,
    free: check.free,
    locked: check.locked,
  };
}
