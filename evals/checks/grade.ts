import type { CheckLine } from "@/lib/checks/lines";
import type { CheckFinding, CheckResult } from "@/lib/checks/result";
import type { Expectation } from "./cases";

// One run of a case, graded against what it expects. Pure: the judge's
// verdicts on the findings nobody expected come in afterwards (judged()).
//
// A run passes when its rating is one the case allows, it reported every
// line it had to, no finding is filed under the wrong list (an issue for a
// recommended line, or the other way), and the judge found nothing wrong
// with the findings the case didn't expect. A finding the judge says is
// right but nobody reviewed yet doesn't fail the run: it's listed for review,
// to approve into allowedExtra or to fix the case.

export type Finding = CheckFinding & { kind: "issue" | "recommendation" };

export type Verdict = {
  verdict: "allowed" | "valid" | "invalid";
  /** The allowedExtra entry it matches, for "allowed". */
  allowed?: string;
  reason: string;
};

export type Unexpected = { finding: Finding; line: CheckLine | null; verdict?: Verdict };

export type RunGrade = {
  rating: CheckResult["rating"];
  /** Every finding, issues then recommendations: the ones the lists below point to. */
  findings: Finding[];
  ratingOk: boolean;
  /** Lines the case expected that weren't reported. */
  missed: CheckLine[];
  /** Findings on an expected line, but in the wrong list. */
  wrongKind: { finding: Finding; line: CheckLine }[];
  /** Findings the case didn't expect: for the judge. */
  unexpected: Unexpected[];
};

export const findingsOf = (result: CheckResult): Finding[] => [
  ...result.issues.map((f) => ({ ...f, kind: "issue" as const })),
  ...result.recommendations.map((f) => ({ ...f, kind: "recommendation" as const })),
];

export function gradeRun(result: CheckResult, expect: Expectation, lines: readonly CheckLine[]): RunGrade {
  const ratingOk = expect.ratings
    ? expect.ratings.includes(result.rating)
    : result.rating !== "unreadable" &&
      (!expect.flagged.some((l) => l.kind === "required") || result.rating === "needsFixing");

  // An unreadable result's findings say what couldn't be read: no line to grade.
  if (result.rating === "unreadable") {
    return { rating: result.rating, findings: findingsOf(result), ratingOk, missed: ratingOk ? [] : expect.flagged, wrongKind: [], unexpected: [] };
  }

  const findings = findingsOf(result);
  const reported = new Set(findings.map((f) => f.line));
  const expected = new Set([...expect.flagged, ...expect.mayFlag].map((l) => l.id));
  const lineOf = (f: Finding) => lines.find((l) => l.id === f.line) ?? null;
  const wrongList = (f: Finding, line: CheckLine) => (f.kind === "issue") !== (line.kind === "required");

  const wrongKind: RunGrade["wrongKind"] = [];
  const unexpected: Unexpected[] = [];
  for (const finding of findings) {
    const line = lineOf(finding);
    if (line && expected.has(line.id)) {
      if (wrongList(finding, line)) wrongKind.push({ finding, line });
    } else {
      unexpected.push({ finding, line });
    }
  }
  return {
    rating: result.rating,
    findings,
    ratingOk,
    missed: expect.flagged.filter((l) => !reported.has(l.id)),
    wrongKind,
    unexpected,
  };
}

/** Whether a graded run passes, once its unexpected findings are judged. */
export const passes = (grade: RunGrade) =>
  grade.ratingOk &&
  grade.missed.length === 0 &&
  grade.wrongKind.length === 0 &&
  grade.unexpected.every((u) => u.verdict && u.verdict.verdict !== "invalid");

/** Findings the judge says are right but no one approved yet. */
export const toReview = (grade: RunGrade) => grade.unexpected.filter((u) => u.verdict?.verdict === "valid");
