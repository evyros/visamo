import type { CheckFinding, CheckRating, CheckResult } from "./result";

// Findings the couple dismissed as wrong: what's left of a check's result
// once they're taken out, and its rating worked out again. Pure: the
// dismissals themselves are in the database (finding_dismissal, lib/checks/store.ts).
//
// Only the latest run's findings can be dismissed, and not a result that
// couldn't be read (the fix is a clearer scan). A dismissal changes only the
// page: never what Misrad Hapnim asks for.

export const findingKinds = ["issue", "recommendation"] as const;
export type FindingKind = (typeof findingKinds)[number];

/** Why the couple says a finding is wrong: a closed list, the only part the next check is told. */
export const dismissReasons = ["alreadyThere", "notApplicable", "checkMistake", "other"] as const;
export type DismissReason = (typeof dismissReasons)[number];

/** Longest note kept with a dismissal. */
export const MAX_DISMISS_NOTE = 500;

/** A finding with its place in the run's list, which a dismissal points to. */
export type IndexedFinding = CheckFinding & { index: number };

/** A result with the dismissed findings taken out. */
export type ActiveResult = { rating: CheckRating; issues: IndexedFinding[]; recommendations: IndexedFinding[] };

/**
 * What's left of the result once the dismissed findings are out, and its
 * rating. Without dismissals, the model's rating stands. With them: an issue
 * left means it needs fixing; otherwise it's ready, with tips if any are left
 * (a "looks good" with minor tips stays as it was).
 */
export function activeResult(result: CheckResult, dismissed: readonly { kind: FindingKind; index: number }[]): ActiveResult {
  const out = (kind: FindingKind) => new Set(dismissed.filter((d) => d.kind === kind).map((d) => d.index));
  const keep = (list: CheckFinding[], kind: FindingKind) => {
    const gone = out(kind);
    return list.map((finding, index) => ({ ...finding, index })).filter((f) => !gone.has(f.index));
  };
  const issues = keep(result.issues, "issue");
  const recommendations = keep(result.recommendations, "recommendation");
  if (result.rating === "unreadable" || dismissed.length === 0) return { rating: result.rating, issues, recommendations };
  const rating: CheckRating =
    issues.length > 0
      ? "needsFixing"
      : result.rating === "looksGood" || recommendations.length === 0
        ? "looksGood"
        : "canImprove";
  return { rating, issues, recommendations };
}
