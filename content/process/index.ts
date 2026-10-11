import type { GuideSlug } from "@/content/guides";
import type { Locale } from "@/i18n/config";
import { formUrls } from "@/lib/documents/catalog";
import { processEn } from "./en";
import { processHe } from "./he";
import {
  locations,
  relationships,
  type Answers,
  type DocumentGroupId,
  type DocumentId,
  type Location,
  type ProcessTexts,
  type Relationship,
  type StepContent,
  type StepId,
} from "./types";

// One entry per locale; adding a language means adding its file here.
const texts: Record<Locale, ProcessTexts> = { en: processEn, he: processHe };

export function getProcessTexts(locale: Locale): ProcessTexts {
  return texts[locale];
}

/** The landing page. The guide for each situation is a page under it: processPath/<track>. */
export const processPath = "/guide/partner-visa-process";

/** When the guide was first published, as YYYY-MM-DD: for search engines and share previews. */
export const processPublished = "2026-10-11";

/** When the facts were last checked against lib/knowledge, as YYYY-MM-DD. */
export const processUpdated = "2026-10-11";

/**
 * The knowledge-base files (lib/knowledge) the guide's facts come from. When
 * one changes, process.test.ts fails until the guide is checked against it in
 * both languages (npm run guides:lock).
 */
export const processSources = [
  "process.md",
  "application.md",
  "first-appointment.md",
  "entry-permit.md",
  "interview.md",
  "both-abroad.md",
  "documents.md",
  "certification.md",
  "former-ussr.md",
  "documents/foreignPassport.md",
  "documents/foreignCivilStatus.md",
  "documents/foreignPoliceCertificate.md",
  "documents/foreignHealthInsurance.md",
];

// ── The twelve versions ─────────────────────────────────────────────────────

const relationshipSlugs: Record<Relationship, string> = { married: "married", commonLaw: "common-law" };
const locationSlugs: Record<Location, string> = {
  bothInIsrael: "both-in-israel",
  partnerAbroad: "partner-abroad",
  bothAbroad: "both-abroad",
};
const apartSuffix = "-never-lived-together";

export const allAnswers: Answers[] = relationships.flatMap((relationship) =>
  locations.flatMap((location) => [true, false].map((livedTogether) => ({ relationship, location, livedTogether }))),
);

/** The version's slug, e.g. "married-partner-abroad" or "common-law-both-abroad-never-lived-together". */
export function trackSlug(a: Answers) {
  return `${relationshipSlugs[a.relationship]}-${locationSlugs[a.location]}${a.livedTogether ? "" : apartSuffix}`;
}

export const trackSlugs = allAnswers.map(trackSlug);

export function answersOf(slug: string): Answers | null {
  return allAnswers.find((a) => trackSlug(a) === slug) ?? null;
}

export const trackPath = (a: Answers) => `${processPath}/${trackSlug(a)}`;

/**
 * The version search engines index. A couple who hasn't lived together gets
 * a few different tips and documents, not a different process, so their page
 * points to the one for couples who have.
 */
export const canonicalAnswers = (a: Answers): Answers => ({ ...a, livedTogether: true });

// ── The steps ───────────────────────────────────────────────────────────────

const married = (a: Answers) => a.relationship === "married";
const commonLaw = (a: Answers) => a.relationship === "commonLaw";
const partnerAbroad = (a: Answers) => a.location === "partnerAbroad";
const bothAbroad = (a: Answers) => a.location === "bothAbroad";
/** Someone lives in Israel now: a home here to show. */
const homeInIsrael = (a: Answers) => a.location !== "bothAbroad";

/**
 * The steps in the order they come, like lib/stages.ts. A step can be listed
 * twice, under conditions that never both hold: a couple who both live abroad
 * moves before filing, a partner abroad after the first appointment; a married
 * couple gets the B/1 before the interview, a common-law couple after it. A
 * couple who both live abroad starts at the consulate, which gives them the list
 * of documents (both-abroad.md).
 */
const stepOrder: { id: StepId; when?: (a: Answers) => boolean }[] = [
  { id: "consulate", when: bothAbroad },
  { id: "prepare" },
  { id: "entryPermit", when: bothAbroad },
  { id: "travel", when: bothAbroad },
  { id: "file" },
  { id: "wait" },
  { id: "appointment" },
  { id: "travel", when: partnerAbroad },
  { id: "b1", when: married },
  { id: "interview" },
  { id: "b1", when: commonLaw },
  { id: "a5" },
];

export function processSteps(a: Answers): StepId[] {
  return stepOrder.filter((step) => !step.when || step.when(a)).map((step) => step.id);
}

// ── The documents ───────────────────────────────────────────────────────────

/**
 * A general list, by subject: what most couples in this situation bring. The
 * exact list (the countries, previous marriages, children) is the app's.
 * Named like the app's documents page.
 */
const documentGroups: { id: DocumentGroupId; items: { id: DocumentId; when?: (a: Answers) => boolean }[] }[] = [
  {
    id: "forms",
    items: [
      { id: "statusApplication", when: married },
      { id: "jointAffidavit", when: commonLaw },
      { id: "entryPermitApplication", when: partnerAbroad },
      { id: "visaChangeApplication", when: (a) => a.location === "bothInIsrael" },
      { id: "relationshipLetter" },
    ],
  },
  {
    id: "identity",
    items: [{ id: "israeliId" }, { id: "passport" }, { id: "photos" }, { id: "birthCertificate" }],
  },
  {
    id: "relationship",
    items: [
      { id: "marriageCertificate", when: married },
      { id: "photosTogether" },
      { id: "messageHistory" },
      { id: "recommendationLetters" },
      { id: "livingTogetherEvidence", when: (a) => a.livedTogether },
    ],
  },
  {
    id: "civilStatus",
    items: [{ id: "civilStatus" }, { id: "policeCertificate" }],
  },
  {
    id: "lifeTogether",
    items: [
      { id: "lease", when: (a) => a.livedTogether },
      { id: "bills", when: (a) => a.livedTogether },
      { id: "israeliLease", when: (a) => !a.livedTogether && homeInIsrael(a) },
      { id: "israeliBills", when: (a) => !a.livedTogether && homeInIsrael(a) },
      { id: "ishurToshav", when: homeInIsrael },
      { id: "governmentServices", when: homeInIsrael },
      { id: "sharedBankAccount", when: married },
      { id: "bankStatements", when: commonLaw },
      { id: "salarySlips" },
      { id: "healthInsurance" },
    ],
  },
];

/** The forms in the list, linked to their PDFs on gov.il: the catalog's, and the common-law affidavit (sources.md). */
const documentLinks: Partial<Record<DocumentId, string>> = {
  statusApplication: formUrls["AS/6"],
  entryPermitApplication: formUrls["AS/1"],
  visaChangeApplication: formUrls["AS/3"],
  jointAffidavit: "https://www.gov.il/BlobFolder/generalpage/visas_forms/he/5.2.0009_a.pdf",
};

export function processDocuments(a: Answers): { id: DocumentGroupId; items: DocumentId[] }[] {
  return documentGroups
    .map((group) => ({ id: group.id, items: group.items.filter((item) => !item.when || item.when(a)).map((item) => item.id) }))
    .filter((group) => group.items.length > 0);
}

/** The guides to read next, below the guide: the ones about the couple's situation first. */
export function relatedGuides(a: Answers): GuideSlug[] {
  const situation: Record<Location, GuideSlug[]> = {
    bothInIsrael: ["partner-visa-documents", "partner-visa-timeline"],
    partnerAbroad: ["entry-permit", "partner-visa-timeline"],
    bothAbroad: ["both-partners-abroad", "entry-permit"],
  };
  return [...situation[a.location], married(a) ? "a5-visa" : "common-law-couples", "apostille-and-translation"];
}

// ── One version, in one language ────────────────────────────────────────────

export type ProcessGuide = {
  title: string;
  metaTitle: string;
  description: string;
  answer: string;
  steps: (StepContent & { id: StepId })[];
  documents: {
    id: DocumentGroupId;
    title: string;
    items: { id: DocumentId; name: string; note: string; link?: { label: string; url: string } }[];
  }[];
};

export function processGuide(locale: Locale, a: Answers): ProcessGuide {
  const t = texts[locale];
  return {
    title: t.guide.title(a),
    metaTitle: t.guide.metaTitle(a),
    description: t.guide.description(a),
    answer: t.guide.answer(a),
    steps: processSteps(a).map((id) => ({ id, ...t.steps[id](a) })),
    documents: processDocuments(a).map((group) => ({
      id: group.id,
      title: t.documents.groups[group.id],
      items: group.items.map((id) => {
        const { name, note, form } = t.documents.items[id];
        const url = documentLinks[id];
        return { id, name, note: note(a), link: url ? { label: form ?? name, url } : undefined };
      }),
    })),
  };
}

export { locations, relationships, type Answers, type Location, type Relationship, type StepId } from "./types";
