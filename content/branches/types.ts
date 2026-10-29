// The branches page (/branches): how busy each Misrad Hapnim branch is,
// how couples felt about dealing with it, and how long the stages took, and
// its survey (/branches/survey). Numbers only: lib/branch-reports.ts
// counts them from every report, never showing a post, a name or a story.

import type { BranchLoad } from "@/lib/branch-load";

/** Each from filing online: to the first answer, to the entry permit (a partner abroad), and to the first B/1 visa. */
export const stageIds = ["firstAnswer", "entryPermit", "b1Visa"] as const;
export type StageId = (typeof stageIds)[number];

export const sentimentIds = ["satisfied", "neutral", "unsatisfied"] as const;
export type SentimentId = (typeof sentimentIds)[number];

/** How long a stage took: the median, and the middle half of couples (low to high), in days. */
export type WaitSummary = { n: number; median: number; low: number; high: number };

export type BranchStats = {
  /** Couples who reported on the branch. */
  couples: number;
  /** Couples by how they felt, once there are at least minCouples of them; null before. */
  sentiment: Record<SentimentId, number> | null;
  /** The stages with enough waits reported at this branch. */
  waits: Partial<Record<StageId, WaitSummary>>;
};

export type BranchesStats = {
  /** The months the reports were posted in, YYYY-MM. */
  posted: { from: string; to: string };
  minCouples: number;
  couples: number;
  /** Nationally, the stages with enough waits reported. */
  stages: ({ id: StageId } & WaitSummary)[];
  branches: Record<string, BranchStats>;
};

/** Plural forms, picked by Intl.PluralRules: "{n}" is the number. */
export type Plural = { one: string; two?: string; other: string };

export type BranchesTexts = {
  labels: { branches: string };
  metaTitle: string;
  description: string;
  title: string;
  intro: string;
  /** "{couples}", "{from}", "{to}". */
  basis: string;
  units: { day: Plural; week: Plural; month: Plural };
  /** A typical time: "about {time}". */
  about: string;
  /** "{low}" to "{high}". */
  range: string;
  stages: {
    title: string;
    intro: string;
    typical: string;
    usual: string;
    /** The info button's label, beside each stage's name. */
    info: string;
    /** "{count}" waits reported. */
    reports: Plural;
    axis: string;
    items: Record<StageId, { title: string; detail: string }>;
  };
  levels: {
    title: string;
    intro: string;
    items: Record<BranchLoad, { label: string; body: string }>;
    /** "{count}" branches. */
    count: Plural;
  };
  sentiment: {
    title: string;
    items: Record<SentimentId, string>;
    /** "{count}" couples. */
    couples: Plural;
    notEnough: string;
  };
  card: {
    busy: string;
    waits: string;
    noWaits: string;
    /** "{time}": the national typical time. */
    national: string;
  };
  list: {
    title: string;
    intro: string;
    search: { label: string; placeholder: string; empty: string; clear: string };
    all: string;
  };
  method: { title: string; items: { title: string; body: string }[] };
  /** The invitation to vote, under the title. The button's words also name the survey page in its breadcrumb. */
  share: { eyebrow: string; title: string; body: string; button: string };
  cta: { title: string; body: string };
  survey: SurveyTexts;
};

/** The survey (/branches/survey). */
export type SurveyTexts = {
  metaTitle: string;
  description: string;
  title: string;
  intro: string;
  anonymous: string;
  branch: { label: string; placeholder: string };
  /** The month they filed online, which every stage's wait starts from: a month and a year. */
  filed: { label: string; month: string; year: string };
  stages: {
    label: string;
    hint: string;
    /** Over each stage's wait. */
    wait: string;
    /** The slider's stops in words (lib/branch-report-options.ts's waitSteps), and its prompt until it's moved. */
    scale: { under: string; over: string; week: Plural; month: Plural; monthAndHalf: Plural; choose: string };
    items: Record<StageId, { label: string; note?: string; waiting: string }>;
  };
  satisfaction: { label: string; items: Record<"satisfied" | "neutral" | "unsatisfied", string> };
  comment: { label: string; hint: string };
  email: { label: string; hint: string };
  consent: string;
  privacy: string;
  submit: string;
  sending: string;
  errors: {
    branch: string;
    satisfaction: string;
    filed: string;
    future: string;
    /** "{year}": SINCE, the first year counted. */
    old: string;
    wait: string;
    long: string;
    email: string;
    consent: string;
    verify: string;
    limit: string;
    /** The IP has sent VOTES_PER_IP_PER_DAY votes in 24 hours. */
    daily: string;
    /** The email has counted votes at BRANCHES_PER_EMAIL other branches. */
    branches: string;
    failed: string;
  };
  code: {
    title: string;
    /** "{email}". */
    body: string;
    label: string;
    submit: string;
    checking: string;
    resend: string;
    resent: string;
    change: string;
    errors: { wrong: string; expired: string; attempts: string; missing: string; branches: string; failed: string };
  };
  done: { title: string; body: string; back: string; another: string };
};
