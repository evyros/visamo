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
export const CATALOG_VERSION = 19;

/** Whose document it is, for grouping on the page. */
export type Owner = "israeli" | "foreign" | "couple" | "children";

export type Category =
  "forms" | "identity" | "relationship" | "civilStatus" | "criminalRecord" | "centerOfLife" | "children";

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
  /**
   * Needed only in a situation onboarding doesn't ask about (renting, say):
   * listed for the couples in `when`, but they decide. The description says
   * when it applies. Not counted as missing until it's uploaded.
   */
  optional?: boolean;
  /** One item per police country instead of one item. The issuer is then that country. */
  each?: "policeCountry";
  issuedBy?: IssuedBy;
  /**
   * Whether the couple may bring it in a language that needs a translation
   * (anything but Hebrew or Arabic): the page then marks it "Translation may
   * be needed", and the translation is uploaded with it. Decided per
   * document, never from where it's issued: the same document can come from
   * anywhere. False for forms in the ministry's wording, Israeli documents,
   * photos and passports.
   */
  mayNeedTranslation: boolean;
  /** An exemption from authentication, by where it's from. */
  exemption?: Exemption;
  /** How many copies to bring, when more than one. Shown to the couple only. */
  copies?: number;
  /**
   * Signed only in front of the clerk at the Misrad Hapnim appointment: the
   * couple prints it and fills in the details, but doesn't sign it before
   * the appointment, and doesn't send it with the online application.
   */
  signAtAppointment?: boolean;
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
    mayNeedTranslation: false,
    owner: "couple",
    category: "forms",
    when: "married",
    form: "AS/6",
    source: `${P8} §ד.2.א`,
    verified: true,
  },
  {
    id: "statusApplicationCommonLaw",
    mayNeedTranslation: false,
    owner: "couple",
    category: "forms",
    when: "commonLaw",
    source: P9,
    verified: false,
  },
  {
    id: "entryPermitApplication",
    mayNeedTranslation: false,
    owner: "foreign",
    category: "forms",
    // With both of them abroad, the entry permit is asked for at the consulate, before the file.
    when: { all: ["foreignAbroad", "israeliInIsrael"] },
    form: "AS/1",
    source: `${P8} §ד.2.א`,
    verified: true,
  },
  {
    id: "israeliAffidavitMarried",
    mayNeedTranslation: false,
    owner: "israeli",
    category: "forms",
    when: "married",
    source: `${P8} §ד.2.ז; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignAffidavitMarried",
    mayNeedTranslation: false,
    owner: "foreign",
    category: "forms",
    when: "married",
    source: `${P8} §ד.2.ז; ${AS6}`,
    verified: true,
  },
  {
    // One declaration both partners sign, instead of the two AS/6 affidavits.
    id: "affidavitCommonLaw",
    mayNeedTranslation: false,
    owner: "couple",
    category: "forms",
    when: "commonLaw",
    signAtAppointment: true,
    source: `${P9}, the affidavit form (5.2.0009_a)`,
    verified: true,
  },
  {
    id: "relationshipStory",
    mayNeedTranslation: false,
    owner: "couple",
    category: "forms",
    source: `${P8} §ד.2.ו; ${AS6}`,
    verified: true,
  },
  {
    id: "securityCv",
    mayNeedTranslation: false,
    owner: "foreign",
    category: "forms",
    when: "foreignNeedsSecurityCheck",
    source: `${P8} §ד.2.ט`,
    verified: true,
  },

  // ── Identity ──
  {
    id: "israeliId",
    mayNeedTranslation: false,
    owner: "israeli",
    category: "identity",
    issuedBy: "israel",
    source: `${P8} §ד.2.ג`,
    verified: true,
  },
  {
    id: "israeliPhotos",
    mayNeedTranslation: false,
    owner: "israeli",
    category: "identity",
    copies: 3,
    source: `${P8} §ד.2.ב; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignPassport",
    mayNeedTranslation: false,
    owner: "foreign",
    category: "identity",
    source: `${P8} §ד.2.ד; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignPhotos",
    mayNeedTranslation: false,
    owner: "foreign",
    category: "identity",
    copies: 3,
    source: `${P8} §ד.2.ב; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignBirthCertificate",
    mayNeedTranslation: true,
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
    mayNeedTranslation: true,
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
    mayNeedTranslation: false,
    owner: "couple",
    category: "relationship",
    when: "marriedInIsrael",
    issuedBy: "israel",
    source: `${P8} §ד.2.ה`,
    verified: true,
  },
  {
    id: "marriageCertificateAbroad",
    mayNeedTranslation: true,
    owner: "couple",
    category: "relationship",
    when: { any: ["marriedAbroad", "marriedOnline"] },
    issuedBy: "marriage",
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: true,
  },
  {
    id: "relationshipEvidence",
    mayNeedTranslation: false,
    owner: "couple",
    category: "relationship",
    source: `${P8} §ד.2.ח`,
    verified: true,
  },
  {
    id: "recommendationLetters",
    mayNeedTranslation: true,
    owner: "couple",
    category: "relationship",
    source: `${P8} §ד.2.ח`,
    verified: true,
  },
  {
    id: "jointLivingEvidence",
    mayNeedTranslation: true,
    owner: "couple",
    category: "relationship",
    when: { all: ["commonLaw", "livingTogether"] },
    source: P9,
    verified: false,
  },
  {
    id: "jointChildrenBirthCertificates",
    mayNeedTranslation: true,
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
    mayNeedTranslation: true,
    owner: "foreign",
    category: "civilStatus",
    issuedBy: "nationality",
    copies: 2,
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignDivorceDecree",
    mayNeedTranslation: true,
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
    mayNeedTranslation: true,
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
    mayNeedTranslation: true,
    owner: "israeli",
    category: "civilStatus",
    when: "israeliDivorced",
    issuedBy: "unknown",
    source: P8,
    verified: false,
  },
  {
    id: "israeliSpouseDeathCertificate",
    mayNeedTranslation: true,
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
    mayNeedTranslation: true,
    owner: "foreign",
    category: "criminalRecord",
    each: "policeCountry",
    issuedBy: "each",
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: false,
  },

  // ── Center of life: at least the last 12 months ──
  {
    // The home they share, or shared: in both their names.
    id: "housingContract",
    // From abroad, for a couple who lived together there.
    mayNeedTranslation: true,
    owner: "couple",
    category: "centerOfLife",
    when: "livingTogether",
    source: `${P8} §ד.2.ח; ${AS6}`,
    verified: true,
  },
  {
    // Never lived together: the Israeli partner's own home in Israel, in their name. With the
    // Israeli abroad too, there's no home to show: they prove the relationship in other ways.
    id: "israeliHousingContract",
    mayNeedTranslation: false,
    owner: "israeli",
    category: "centerOfLife",
    when: { all: ["israeliInIsrael", { not: "livingTogether" }] },
    source: `${P8} §ד.2.ח; ${AS6}`,
    verified: false,
  },
  {
    // Only for couples who rent; onboarding doesn't ask whether they do.
    id: "landlordAffidavit",
    mayNeedTranslation: false,
    owner: "couple",
    category: "centerOfLife",
    // Annexed to the lease: wherever the lease is asked for.
    when: { any: ["livingTogether", "israeliInIsrael"] },
    optional: true,
    form: "AS/6",
    source: "AS/6, page 6 (affidavit annexed to the lease – couples)",
    verified: true,
  },
  {
    id: "utilityBills",
    // From abroad, for a couple who lived together there.
    mayNeedTranslation: true,
    owner: "couple",
    category: "centerOfLife",
    source: AS6,
    verified: true,
  },
  {
    // Services in Israel: someone has to live here to receive them.
    id: "governmentServices",
    mayNeedTranslation: false,
    owner: "couple",
    category: "centerOfLife",
    when: { any: ["israeliInIsrael", "foreignInIsrael"] },
    source: `${P8} §ד.2.ח; ${AS6}`,
    verified: true,
  },
  {
    id: "ishurToshav",
    mayNeedTranslation: false,
    owner: "couple",
    category: "centerOfLife",
    source: `${P8} §ד.2.ח; ${AS6}`,
    verified: true,
  },
  {
    id: "sharedFinances",
    mayNeedTranslation: true,
    owner: "couple",
    category: "centerOfLife",
    source: `${P8} §ד.2.ח; ${AS6}`,
    verified: true,
  },
  {
    id: "israeliIncomeProof",
    // From abroad, for an Israeli partner working for a business outside Israel.
    mayNeedTranslation: true,
    owner: "israeli",
    category: "centerOfLife",
    source: AS6,
    verified: true,
  },
  {
    id: "foreignIncomeProof",
    mayNeedTranslation: true,
    owner: "foreign",
    category: "centerOfLife",
    source: AS6,
    verified: true,
  },
  {
    // Evidence the household lives in Israel (§ה.2(7)): any of its children in school here.
    id: "childrenSchoolRecords",
    mayNeedTranslation: false,
    owner: "couple",
    category: "centerOfLife",
    when: { any: ["childrenTogether", "childrenMoving"] },
    source: `${AS6}; ${P8} §ה.2(7)`,
    verified: false,
  },

  // ── Children moving to Israel ──
  {
    id: "childBirthCertificate",
    mayNeedTranslation: true,
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
    mayNeedTranslation: false,
    owner: "children",
    category: "children",
    when: "childrenMoving",
    source: `${P8} §ד.2.י`,
    verified: true,
  },
  {
    id: "childPoliceCertificate",
    mayNeedTranslation: true,
    owner: "children",
    category: "children",
    when: "childrenMoving",
    issuedBy: "unknown",
    source: `${P8} §ד.2.י`,
    verified: true,
  },
  {
    id: "otherParentConsent",
    mayNeedTranslation: true,
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
    mayNeedTranslation: true,
    owner: "children",
    category: "children",
    when: "otherParentInvolved",
    issuedBy: "unknown",
    source: `${P8} §ה.2(9)ב`,
    verified: true,
  },
  {
    id: "custodyOrder",
    mayNeedTranslation: true,
    owner: "children",
    category: "children",
    when: "otherParentCourtOrder",
    issuedBy: "unknown",
    source: `${P8} §ה.2(9)י`,
    verified: true,
  },
  {
    id: "otherParentDeathCertificate",
    mayNeedTranslation: true,
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
  // v18: a stay without a valid visa is a case for a lawyer, not a letter.
  "foreignStayExplanation",
];
