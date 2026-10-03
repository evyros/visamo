import type { CaseDetails } from "./case-options";
import { evaluate, type Condition } from "./documents/conditions";
import { profileOf } from "./documents/facts";

// Where the couple is in the process. Not every couple goes through the same
// stages: a partner abroad waits for an entry permit, a couple who both live
// abroad starts at the consulate, a partner from the former USSR goes through
// Nativ, and married and common-law couples are interviewed at different
// points. The catalog lists every stage in the order they come; a case's
// track is the ones its facts (lib/documents/facts.ts) meet, in that order.
// The process facts behind it are in lib/knowledge/.

export const stages = [
  "preparing",
  "consulate",
  "filed",
  "firstAppointment",
  "entryPermit",
  "arrived",
  "b1",
  "nativ",
  "interview",
  "approvedB1",
  "approvedA5",
] as const;
export type Stage = (typeof stages)[number];

const bothAbroad: Condition = { all: ["foreignAbroad", "israeliAbroad"] };

/**
 * A stage can be listed twice, under conditions that never both hold: a
 * couple who both live abroad files after arriving, everyone else before.
 */
const catalog: readonly { stage: Stage; when?: Condition }[] = [
  { stage: "preparing", when: { not: bothAbroad } },
  // both-abroad.md: the entry permit comes from the consulate, before anything is filed.
  // The document list is still the Misrad Hapnim file's, not the consulate's.
  { stage: "consulate", when: bothAbroad },
  { stage: "filed", when: { not: bothAbroad } },
  { stage: "firstAppointment", when: { not: bothAbroad } },
  // first-appointment.md: the branch grants the entry permit, or the consulate passes it on.
  { stage: "entryPermit", when: "foreignAbroad" },
  { stage: "arrived", when: "foreignAbroad" },
  { stage: "filed", when: bothAbroad },
  { stage: "firstAppointment", when: bothAbroad },
  // first-appointment.md: a married couple gets the B/1 at the first appointment, without an interview.
  { stage: "b1", when: "married" },
  // former-ussr.md: before the B/1 for a common-law couple, before the A/5 for a married one.
  { stage: "nativ", when: "foreignFromFormerUSSR" },
  // interview.md: before the B/1 for a common-law couple, before the A/5 for a married one.
  // One stage with the interview's date: once it's passed, they wait for the decision.
  { stage: "interview" },
  // The end of the track is the first status the procedure is after.
  { stage: "approvedB1", when: "commonLaw" },
  { stage: "approvedA5", when: "married" },
];

/** A case's stages, in order. */
export function trackOf(details: CaseDetails): Stage[] {
  const { facts } = profileOf({ relationship: details.relationship, people: [details.israeli, details.foreign] });
  return catalog.filter((entry) => evaluate(entry.when, facts).match).map((entry) => entry.stage);
}

/** The approvals, reached from the overview only. */
const laterStages = ["approvedB1", "approvedA5"] as const;
export type OnboardingStage = Exclude<Stage, (typeof laterStages)[number]>;

/** The stages onboarding offers. */
export function onboardingTrack(details: CaseDetails): OnboardingStage[] {
  return trackOf(details).filter((s): s is OnboardingStage => !(laterStages as readonly Stage[]).includes(s));
}

export const sameTrack = (a: readonly Stage[], b: readonly Stage[]) =>
  a.length === b.length && a.every((s, i) => s === b[i]);

/**
 * The stages that ask for a date when moving to them. A past one is optional
 * and shows how long they've been waiting; a scheduled one is required.
 */
export const stageDateKinds = {
  filed: "past",
  firstAppointment: "scheduled",
  interview: "scheduled",
} as const satisfies Partial<Record<Stage, "past" | "scheduled">>;
export type DatedStage = keyof typeof stageDateKinds;

/** The dates the couple entered, by stage. Kept when the stage moves back, to offer again. */
export type StageDates = Partial<Record<DatedStage, string>>;

export const isDated = (stage: Stage): stage is DatedStage => stage in stageDateKinds;

/** At the interview stage, after its date: waiting for the decision. `today` is `yyyy-mm-dd` in Israel. */
export const awaitingDecision = (stage: Stage, dates: StageDates, today: string) =>
  stage === "interview" && !!dates.interview && dates.interview < today;

/** How far ahead an appointment or interview date can be. */
const SCHEDULED_MAX_DAYS = 2 * 365;

/** A `yyyy-mm-dd` date that fits the stage, or null: a past one can't be in the future, a scheduled one can. */
export function parseStageDate(stage: DatedStage, value: unknown, today = new Date()): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  // Tomorrow in UTC is already today in Israel for part of the day.
  const tomorrow = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1);
  if (date.getUTCFullYear() < 2000) return null;
  const kind = stageDateKinds[stage];
  if (kind === "past" && date.getTime() > tomorrow) return null;
  if (kind === "scheduled" && date.getTime() > tomorrow + SCHEDULED_MAX_DAYS * 86_400_000) return null;
  return value;
}
