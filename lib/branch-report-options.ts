import type { StageId } from "../content/branches/types";

// The branch reports' shared vocabulary (lib/db/schema.ts's branchReport and
// surveyVote), for the server (lib/branch-reports.ts) and the survey form
// (components/branch-survey.tsx) alike. Which extracted waits make the page's
// stages is collect/experiences/import.mjs's, which seeded the reports.

/** Where a report came from: imported from the research data, or a vote on the website's survey. */
export const reportSources = ["facebook_post", "facebook_comment", "aic_comment", "interview", "survey"] as const;
export type BranchReportSource = (typeof reportSources)[number];

/** How they felt dealing with the office, as the extraction rates it; the survey's three map onto it. */
export type ReportExperience = "positive" | "mixed" | "neutral" | "negative";

export type SurveyVoteStatus = "pending" | "verified" | "void";

/** The survey's answer to "how did it go", as the reports rate it. */
export const satisfactionChoices = ["satisfied", "neutral", "unsatisfied"] as const;
export type Satisfaction = (typeof satisfactionChoices)[number];
export const satisfactionExperience: Record<Satisfaction, ReportExperience> = {
  satisfied: "positive",
  neutral: "neutral",
  unsatisfied: "negative",
};

// What the page counts.
/** Experiences from before this year are left out. */
export const SINCE = "2025";
/** How couples felt shows from this many couples at a branch. */
export const MIN_COUPLES = 5;
/** A stage's times show from this many waits across all branches, and a branch's own from MIN_BRANCH_WAITS there. */
export const MIN_NATIONAL_WAITS = 5;
export const MIN_BRANCH_WAITS = 3;

// The survey's limits.
export const COMMENT_MAX = 1000;
export const CODE_MINUTES = 30;
/** Wrong codes before a vote has to start over. */
export const MAX_ATTEMPTS = 5;
/** Codes one address can be sent in an hour, and one vote in all, so the form can't flood someone's inbox. */
export const CODES_PER_HOUR = 3;
export const CODES_PER_VOTE = 3;
/** Votes sent from one IP in 24 hours, whatever became of them. */
export const VOTES_PER_IP_PER_DAY = 3;
/** Branches one email can have counted votes for. */
export const BRANCHES_PER_EMAIL = 2;

// The survey asks what couples remember: the month they filed online, and how
// long after it each stage came, on a slider. Exact dates are hard to recall,
// and the page only needs each wait's length and roughly when it was.

/** Days from one YYYY-MM-DD to another. */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** A stop on the survey's slider: how long after filing a stage came, in words ("6 weeks", "2½ months") and in days. */
export type WaitStep = { unit: "under" | "week" | "month" | "monthAndHalf" | "over"; n: number; days: number };

const weeks = (...ns: number[]) => ns.map((n): WaitStep => ({ unit: "week", n, days: n * 7 }));
const months = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i): WaitStep => ({ unit: "month", n: from + i, days: (from + i) * 30 }));
/** Counted as its middle. */
const UNDER_A_WEEK: WaitStep = { unit: "under", n: 1, days: 3 };
/** Counted as a year, so it can only understate the longest waits. */
const OVER_A_YEAR: WaitStep = { unit: "over", n: 1, days: 365 };
/** Between 2 and 3 months, where the step would otherwise double from two weeks to a month. */
const TWO_AND_A_HALF_MONTHS: WaitStep = { unit: "monthAndHalf", n: 2, days: 75 };

/**
 * Each stage's slider stops, over the waits it really has: weeks while they matter, then months (30 days, as everywhere
 * here). The page shows medians and quartiles, which only the order of the answers moves, so the ends' exact days
 * hardly matter.
 */
export const waitSteps: Record<StageId, WaitStep[]> = {
  firstAnswer: [UNDER_A_WEEK, ...weeks(1, 2, 3), ...months(1, 1), ...weeks(6), ...months(2, 2), TWO_AND_A_HALF_MONTHS, ...months(3, 8)],
  entryPermit: [
    UNDER_A_WEEK,
    ...weeks(1, 2, 3),
    ...months(1, 1),
    ...weeks(6),
    ...months(2, 2),
    TWO_AND_A_HALF_MONTHS,
    ...months(3, 12),
    OVER_A_YEAR,
  ],
  b1Visa: [...weeks(4, 6), ...months(2, 2), TWO_AND_A_HALF_MONTHS, ...months(3, 18)],
};

/** A stage the survey asks about: the stop chosen on its slider (an index into waitSteps), or null while still waiting. */
export type SurveyStageAnswer = { stage: StageId; step: number | null };

/** Why the filing month (YYYY-MM) doesn't work, or null: a real month from 2010 on, and not ahead of today's. */
export function filedError(filed: string, today: string): "filed" | "future" | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(filed) || filed < "2010-01") return "filed";
  if (filed > today.slice(0, 7)) return "future";
  return null;
}

/** A stage's wait in days: as answered, or, while still waiting, from the middle of the filing month to today. */
export function stageDays(answer: SurveyStageAnswer, filed: string, today: string) {
  if (answer.step === null) return Math.max(0, daysBetween(`${filed}-15`, today));
  return waitSteps[answer.stage][answer.step].days;
}

/**
 * Why a stage's wait doesn't work, or null: one of the slider's stops, and no longer than the time since the filing
 * month began, give or take a month, as people round. Needs a filing month that passed filedError.
 */
export function stageWaitError(answer: SurveyStageAnswer, filed: string, today: string): "wait" | "long" | null {
  if (answer.step === null) return null;
  if (!Number.isInteger(answer.step) || !waitSteps[answer.stage]?.[answer.step]) return "wait";
  if (stageDays(answer, filed, today) > daysBetween(`${filed}-01`, today) + 31) return "long";
  return null;
}

/** The month a vote's experience reaches: its latest stage, or the filing month, and never past today's. */
export function surveyMonth(filed: string, stages: SurveyStageAnswer[], today: string) {
  const reached = stages.map((s) => new Date(Date.parse(`${filed}-15T00:00:00Z`) + stageDays(s, filed, today) * 86_400_000));
  const latest = reached.map((d) => d.toISOString().slice(0, 7)).sort().at(-1) ?? filed;
  return latest > today.slice(0, 7) ? today.slice(0, 7) : latest;
}
