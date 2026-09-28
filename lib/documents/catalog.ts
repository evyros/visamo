import type { Exemption } from "./certification";
import type { Condition } from "./conditions";

// The document catalog: every document a couple might need for the first
// application in the graduated procedure (renewals aren't supported), and
// when each one is needed. Titles and descriptions live in the messages,
// under app.documents.items.<id>.
//
// Changing anything here, in facts.ts, in countries.ts or in
// certification.ts changes couples' lists: follow CLAUDE.md in this folder
// (raise CATALOG_VERSION, add a CHANGELOG.md entry, run npm run catalog:lock).

/** Raised by one on every change to what any couple's list contains. See CHANGELOG.md. */
export const CATALOG_VERSION = 4;

/** Whose document it is, for grouping on the page. */
export type Owner = "israeli" | "foreign" | "couple" | "children";

export type Category =
  | "forms"
  | "identity"
  | "relationship"
  | "civilStatus"
  | "criminalRecord"
  | "centerOfLife"
  | "children";

/**
 * Which country issues the document, for its certification. "marriage" is
 * the marriage country, or Utah for an online marriage; "unknown" is a
 * document that can come from anywhere. Left out for documents that aren't
 * issued by an authority (forms, photos, evidence).
 */
export type IssuedBy = "israel" | "nationality" | "birthCountry" | "marriage" | "each" | "unknown";

export type DocumentDefinition = {
  /** Stable forever: saved progress is keyed by it. Never rename or reuse one; see DOCUMENT_ALIASES. */
  id: string;
  owner: Owner;
  category: Category;
  /** Left out: every couple needs it. */
  when?: Condition;
  /** One item per police country instead of one item. The issuer is then that country. */
  each?: "policeCountry";
  issuedBy?: IssuedBy;
  /** An exemption from authentication, by where it's from. */
  exemption?: Exemption;
  /** How many copies to bring, when more than one. Shown to the couple only. */
  copies?: number;
  /** The Misrad Hapnim form, for the forms themselves. */
  form?: string;
  /** Where the requirement comes from: a procedure section, a form. */
  source: string;
  /** Checked against the source by a person. */
  verified: boolean;
};

// The sources, as cited in `source`.
const P8 = "Procedure 5.2.0008 (edition 16, 2026-07-20)";
const P9 = "Procedure 5.2.0009";
const AS6 = "AS/6 checklist";

export const documents = [
  // ── Forms ──
  {
    id: "statusApplicationMarried",
    owner: "couple",
    category: "forms",
    when: "married",
    form: "AS/6",
    source: `${P8} §ד.2.א`,
    verified: true,
  },
  { id: "statusApplicationCommonLaw", owner: "couple", category: "forms", when: "commonLaw", source: P9, verified: false },
  {
    id: "entryPermitApplication",
    owner: "foreign",
    category: "forms",
    when: "foreignAbroad",
    form: "AS/1",
    source: `${P8} §ד.2.א`,
    verified: true,
  },
  { id: "israeliAffidavit", owner: "israeli", category: "forms", source: `${P8} §ד.2.ז; ${AS6}`, verified: true },
  { id: "foreignAffidavit", owner: "foreign", category: "forms", source: `${P8} §ד.2.ז; ${AS6}`, verified: true },
  { id: "relationshipStory", owner: "couple", category: "forms", source: `${P8} §ד.2.ו; ${AS6}`, verified: true },
  {
    id: "securityCv",
    owner: "foreign",
    category: "forms",
    when: "foreignNeedsSecurityCheck",
    source: `${P8} §ד.2.ט`,
    verified: true,
  },

  // ── Identity ──
  { id: "israeliId", owner: "israeli", category: "identity", issuedBy: "israel", source: `${P8} §ד.2.ג`, verified: true },
  { id: "israeliPhotos", owner: "israeli", category: "identity", copies: 3, source: `${P8} §ד.2.ב; ${AS6}`, verified: true },
  { id: "foreignPassport", owner: "foreign", category: "identity", source: `${P8} §ד.2.ד; ${AS6}`, verified: true },
  { id: "foreignPhotos", owner: "foreign", category: "identity", copies: 3, source: `${P8} §ד.2.ב; ${AS6}`, verified: true },
  {
    id: "foreignStayExplanation",
    owner: "foreign",
    category: "identity",
    when: "foreignInIsraelWithoutVisa",
    source: P8,
    verified: false,
  },
  {
    id: "foreignBirthCertificate",
    owner: "foreign",
    category: "identity",
    issuedBy: "birthCountry",
    exemption: "formerUSSRUntil1998",
    copies: 2,
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignNameChange",
    owner: "foreign",
    category: "identity",
    when: "foreignNameChanged",
    issuedBy: "unknown",
    source: `${P8} §ד.2.ה`,
    verified: true,
  },

  // ── Relationship ──
  {
    id: "marriageCertificateIsrael",
    owner: "couple",
    category: "relationship",
    when: "marriedInIsrael",
    issuedBy: "israel",
    source: `${P8} §ד.2.ה`,
    verified: true,
  },
  {
    id: "marriageCertificateAbroad",
    owner: "couple",
    category: "relationship",
    when: { any: ["marriedAbroad", "marriedOnline"] },
    issuedBy: "marriage",
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: true,
  },
  { id: "relationshipEvidence", owner: "couple", category: "relationship", source: `${P8} §ד.2.ח`, verified: true },
  { id: "recommendationLetters", owner: "couple", category: "relationship", source: `${P8} §ד.2.ח`, verified: true },
  {
    id: "jointLivingEvidence",
    owner: "couple",
    category: "relationship",
    when: { all: ["commonLaw", "livingTogether"] },
    source: P9,
    verified: false,
  },
  {
    id: "jointChildrenBirthCertificates",
    owner: "couple",
    category: "relationship",
    when: "childrenTogether",
    issuedBy: "unknown",
    source: P8,
    verified: false,
  },

  // ── Civil status ──
  {
    id: "foreignCivilStatus",
    owner: "foreign",
    category: "civilStatus",
    issuedBy: "nationality",
    copies: 2,
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignDivorceDecree",
    owner: "foreign",
    category: "civilStatus",
    when: "foreignDivorced",
    issuedBy: "unknown",
    copies: 2,
    source: AS6,
    verified: true,
  },
  {
    id: "foreignSpouseDeathCertificate",
    owner: "foreign",
    category: "civilStatus",
    when: "foreignWidowed",
    issuedBy: "unknown",
    copies: 2,
    source: AS6,
    verified: true,
  },
  {
    id: "israeliDivorceDecree",
    owner: "israeli",
    category: "civilStatus",
    when: "israeliDivorced",
    issuedBy: "unknown",
    source: P8,
    verified: false,
  },
  {
    id: "israeliSpouseDeathCertificate",
    owner: "israeli",
    category: "civilStatus",
    when: "israeliWidowed",
    issuedBy: "unknown",
    source: P8,
    verified: false,
  },

  // ── Criminal record ──
  {
    // The sources name the country of nationality; the other countries lived in aren't confirmed yet.
    id: "foreignPoliceCertificate",
    owner: "foreign",
    category: "criminalRecord",
    each: "policeCountry",
    issuedBy: "each",
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: false,
  },

  // ── Center of life: at least the last 12 months ──
  { id: "housingContract", owner: "israeli", category: "centerOfLife", source: `${P8} §ד.2.ח; ${AS6}`, verified: true },
  { id: "utilityBills", owner: "couple", category: "centerOfLife", source: AS6, verified: true },
  { id: "governmentServices", owner: "couple", category: "centerOfLife", source: `${P8} §ד.2.ח; ${AS6}`, verified: true },
  { id: "ishurToshav", owner: "couple", category: "centerOfLife", source: `${P8} §ד.2.ח; ${AS6}`, verified: true },
  { id: "sharedFinances", owner: "couple", category: "centerOfLife", source: `${P8} §ד.2.ח; ${AS6}`, verified: true },
  { id: "israeliIncomeProof", owner: "israeli", category: "centerOfLife", source: AS6, verified: true },
  { id: "foreignIncomeProof", owner: "foreign", category: "centerOfLife", source: AS6, verified: true },
  {
    // Evidence the household lives in Israel (§ה.2(7)): any of its children in school here.
    id: "childrenSchoolRecords",
    owner: "couple",
    category: "centerOfLife",
    when: { any: ["childrenTogether", "childrenMoving"] },
    source: `${AS6}; ${P8} §ה.2(7)`,
    verified: false,
  },

  // ── Children moving to Israel ──
  {
    id: "childBirthCertificate",
    owner: "children",
    category: "children",
    when: "childrenMoving",
    issuedBy: "unknown",
    copies: 2,
    source: `${P8} §ד.2.י; ${AS6}`,
    verified: true,
  },
  {
    id: "childPassport",
    owner: "children",
    category: "children",
    when: "childrenMoving",
    source: `${P8} §ד.2.י`,
    verified: true,
  },
  {
    id: "childPoliceCertificate",
    owner: "children",
    category: "children",
    when: "childrenMoving",
    issuedBy: "unknown",
    source: `${P8} §ד.2.י`,
    verified: true,
  },
  {
    id: "otherParentConsent",
    owner: "children",
    category: "children",
    when: "otherParentInvolved",
    issuedBy: "unknown",
    source: "Practice, confirmed by the product owner",
    verified: true,
  },
  {
    // Besides the consent, the ministry writes to the other parent itself (§ה.2(9)); the couple gives their address.
    id: "otherParentAddress",
    owner: "children",
    category: "children",
    when: "otherParentInvolved",
    issuedBy: "unknown",
    source: `${P8} §ה.2(9)ב`,
    verified: true,
  },
  {
    id: "custodyOrder",
    owner: "children",
    category: "children",
    when: "otherParentCourtOrder",
    issuedBy: "unknown",
    source: `${P8} §ה.2(9)י`,
    verified: true,
  },
  {
    id: "otherParentDeathCertificate",
    owner: "children",
    category: "children",
    when: "otherParentDeceased",
    issuedBy: "unknown",
    source: P8,
    verified: false,
  },
] as const satisfies readonly DocumentDefinition[];

export type DocumentId = (typeof documents)[number]["id"];

/**
 * Old document id → the id that replaced it, so saved progress follows a
 * rename or a split. Add an entry instead of renaming an id in place. An old
 * id is never used again.
 */
export const DOCUMENT_ALIASES: Readonly<Record<string, DocumentId>> = {
  // v2: the visa pages and entry stamps are part of the passport copy.
  foreignEntryVisa: "foreignPassport",
};

/** Ids removed without a replacement. Never used again, so old saved progress can't attach to a new document. */
export const RETIRED_DOCUMENT_IDS: readonly string[] = [
  // v2: the fee isn't a document.
  "feeReceipt",
  // v2: split into the center-of-life documents every couple needs.
  "centerOfLifeEvidence",
];
