import type { GuideBlock, GuideText } from "@/content/guides/types";
import type { IconName } from "@/components/icons";

// The partner visa process guide: a marketing landing page
// (/guide/partner-visa-process) that gives couples the process for their
// situation, for free, and leads them to sign up for the app; and under it, a
// page for each situation, written to be found on Google. Three answers pick
// one of twelve. Every fact in it comes from lib/knowledge, like the other
// guides; process.test.ts flags it when a source changes.

export const relationships = ["married", "commonLaw"] as const;
export type Relationship = (typeof relationships)[number];

/** Where each partner lives now. "partnerAbroad" is the Israeli partner in Israel and the foreign partner abroad. */
export const locations = ["bothInIsrael", "partnerAbroad", "bothAbroad"] as const;
export type Location = (typeof locations)[number];

export type Answers = { relationship: Relationship; location: Location; livedTogether: boolean };

export type StepId =
  | "prepare"
  | "consulate"
  | "entryPermit"
  | "file"
  | "wait"
  | "appointment"
  | "travel"
  | "b1"
  | "interview"
  | "a5";

export type Bubble = { tone: "critical" | "important" | "tip" | "info"; title: string; text: GuideText };

/** A line under a step's title: who goes, where, how long, what it costs. */
export type StepMeta = { icon: Extract<IconName, "people" | "user" | "building" | "globe" | "clock" | "receipt">; text: string };

export type StepContent = {
  title: string;
  /** The step in a few words, for the list of steps beside the guide. */
  short: string;
  meta: StepMeta[];
  body: GuideBlock[];
  /** A short list in a card, after the body: what a consulate usually asks for. */
  checklist?: { title: string; items: GuideText[] };
  /** Celebrates a visa, at the top of its step: what it lets the couple do now. */
  milestone?: { title: string; lead: string; items: GuideText[] };
  bubbles: Bubble[];
  faq: { q: string; a: GuideText }[];
};

export type DocumentGroupId = "forms" | "identity" | "relationship" | "civilStatus" | "lifeTogether";

export type DocumentId =
  | "statusApplication"
  | "jointAffidavit"
  | "entryPermitApplication"
  | "visaChangeApplication"
  | "relationshipLetter"
  | "israeliId"
  | "passport"
  | "photos"
  | "birthCertificate"
  | "marriageCertificate"
  | "photosTogether"
  | "messageHistory"
  | "recommendationLetters"
  | "livingTogetherEvidence"
  | "civilStatus"
  | "policeCertificate"
  | "lease"
  | "bills"
  | "israeliLease"
  | "israeliBills"
  | "ishurToshav"
  | "governmentServices"
  | "sharedBankAccount"
  | "bankStatements"
  | "salarySlips"
  | "healthInsurance";

/** `chip` is the short form, for the situation bar above the guide. */
type Option = { label: string; hint: string; chip: string };

export type ProcessTexts = {
  labels: {
    guides: string;
    /** The landing page, in the breadcrumbs. */
    process: string;
    updated: string;
    /** `{n}` is the step's number. */
    step: string;
    stepsNav: string;
    jumpToStep: string;
    quickQuestions: string;
    /** Read after an external link, by screen readers. */
    newTab: string;
    milestone: string;
    tones: Record<Bubble["tone"], string>;
    yourSituation: string;
    change: string;
    shortVersion: string;
    related: string;
  };
  /** The answers, as the landing page asks for them and the guide shows them. */
  answers: {
    relationship: Record<Relationship, Option>;
    location: Record<Location, Option>;
    lived: Record<"yes" | "no", Option>;
  };
  landing: {
    metaTitle: string;
    description: string;
    eyebrow: string;
    title: string;
    titleAccent: string;
    intro: string;
    promises: string[];
    glance: { title: string; intro: string; stages: { title: string; body: string }[] };
    situations: { title: string; intro: string };
    faqTitle: string;
    /** `link` is a page on the site, shown under the answer. */
    faq: { q: string; a: GuideText; link?: { label: string; path: string } }[];
    /** The three questions about the couple's situation, at the top of the page. */
    picker: {
      label: string;
      /** `{n}` and `{total}`. */
      progress: string;
      questions: { relationship: string; location: string; lived: string };
      back: string;
      opening: string;
      footnote: string;
    };
  };
  guide: {
    metaTitle: (a: Answers) => string;
    description: (a: Answers) => string;
    title: (a: Answers) => string;
    answer: (a: Answers) => GuideText;
  };
  track: {
    title: string;
    b1: string;
    a5: string;
    end: string;
    lengths: (a: Answers) => { b1: string; a5: string; end: string };
    /** What each stage gives, when it's opened. The end includes who it ends differently for. */
    details: (a: Answers) => { b1: GuideText[]; a5: GuideText[]; end: GuideText[] };
  };
  steps: Record<StepId, (a: Answers) => StepContent>;
  documents: {
    title: string;
    intro: string;
    groups: Record<DocumentGroupId, string>;
    /** `form` names the form a document is filled in on, as the text of its link. */
    items: Record<DocumentId, { name: string; note: (a: Answers) => string; form?: string }>;
    rules: { title: string; items: GuideText[] };
    /** `more` closes the list, so it reads as only part of what a case can need. */
    depends: { title: string; intro: string; items: string[]; more: string; cta: string };
  };
  /** The closing section: the fear, then what answers it. */
  /** Under the steps: who wrote the guide and from what, with the official sources. */
  about: {
    title: string;
    body: string;
    sources: (a: Answers) => { label: string; url: string }[];
  };
  /** The preview when a page is shared, under its title. */
  share: { subtitle: string };
  cta: {
    eyebrow: string;
    title: string;
    body: string;
    features: { icon: IconName; title: string; body: string }[];
    button: string;
    microcopy: string;
  };
};

/** One set of answers as a string, for the landing page's map of answers to pages. */
export const answersKey = (relationship: string, location: string, lived: string) => `${relationship}|${location}|${lived}`;

/** The items, when the condition holds: for lists that change with the answers. */
export function only<T>(condition: boolean, ...items: T[]): T[] {
  return condition ? items : [];
}
