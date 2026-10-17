import type { Exemption } from "./certification";
import type { Condition } from "./conditions";

// The document catalog: every document a couple might need for the first
// application in the gradual process (renewals aren't supported), and
// when each one is needed. Titles and descriptions live in the messages,
// under app.documents.items.<id>.
//
// Changing anything here, in facts.ts, in countries.ts or in
// certification.ts changes couples' lists: follow CLAUDE.md in this folder
// (raise CATALOG_VERSION, add a CHANGELOG.md entry, run npm run catalog:lock).

/** Raised by one on every change to what any couple's list contains. See CHANGELOG.md. */
export const CATALOG_VERSION = 40;

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

export type Translation = "none" | "self" | "notarized";

/**
 * Who a document is signed in front of, who confirms the signature:
 * - "clerk": the Misrad Hapnim clerk, at the appointment. The couple prints
 *   it and fills in the details, but doesn't sign it before, and doesn't send
 *   it with the online application.
 * - "lawyer": an Israeli lawyer.
 * - "lawyerCourtOrNotary": an Israeli lawyer, the magistrate's court, or a notary.
 * - "notary": a notary only (a notarial affidavit).
 * - "consul": a consul (an Israeli one abroad, or the foreign partner's country's in Israel).
 */
export type Signing = "clerk" | "lawyer" | "lawyerCourtOrNotary" | "notary" | "consul";

export type DocumentDefinition = {
  /** Stable forever: saved progress is keyed by it. Never rename or reuse one; see DOCUMENT_ALIASES. */
  id: string;
  owner: Owner;
  category: Category;
  /** Left out: every couple needs it. */
  when?: Condition;
  /**
   * Done only once the foreign partner is in Israel, with the entry permit:
   * for the couples in this condition, the page lists it apart, after the
   * documents for the online application, in a group of its own (counted in
   * the progress like the others). By where the partners are, never by the
   * case's stage, so a couple sees it from the start.
   */
  later?: Condition;
  /**
   * Needed only in a situation onboarding doesn't ask about (renting, say):
   * listed for the couples in `when`, but they decide. The description says
   * when it applies. Not counted as missing until it's uploaded.
   */
  optional?: boolean;
  /**
   * One item per country instead of one item: the nationality, then every other
   * country lived in (see facts.ts). The issuer is then that country.
   */
  each?: "policeCountry";
  issuedBy?: IssuedBy;
  /**
   * The translation it needs if the couple brings it in a language that
   * needs one (anything but Hebrew or Arabic, and in practice English):
   * "notarized" for official documents, "self" for their everyday documents
   * (a lease, bills, statements, payslips, a policy), which they translate
   * or explain themselves, and "none" for forms in the ministry's wording,
   * Israeli documents, photos, passports and their own evidence. The
   * translation is uploaded with the document. Decided per document, never
   * from where it's issued: the same document can come from anywhere.
   */
  translation: Translation;
  /** An exemption from authentication, by where it's from. */
  exemption?: Exemption;
  /** How many copies to bring, when more than one. Not shown on the documents list for now; the chat knows it. */
  copies?: number;
  /** Who it's signed in front of, for a declaration or an affidavit: never signed before. See `Signing`. */
  signing?: Signing;
  /**
   * An affidavit (תצהיר) replaces it where the country issues none, or it
   * can't be had: the steps offer it, for the countries issuers.ts doesn't
   * say issue one.
   */
  orAffidavit?: boolean;
  /** The Misrad Hapnim form, for the forms themselves. */
  form?: FormId;
  /** Where the requirement comes from: a procedure section, a form. */
  source: string;
  /** Checked against the source by a person. */
  verified: boolean;
};

// The sources, as cited in `source`.
const P8 = "Procedure 5.2.0008 (edition 16, 2026-07-20)";
const P9 = "Procedure 5.2.0009";
const AS6 = "AS/6 checklist";

/** The forms on gov.il, linked from their documents. */
export const formUrls = {
  "AS/1": "https://www.gov.il/BlobFolder/generalpage/visas_forms/he/AS1.pdf",
  "AS/3": "https://www.gov.il/BlobFolder/generalpage/visas_forms/he/AS3.pdf",
  "AS/6": "https://www.gov.il/BlobFolder/generalpage/visas_forms/he/AS6.pdf",
  "5.2.0009_a": "https://www.gov.il/BlobFolder/generalpage/visas_forms/he/5.2.0009_a.pdf",
} as const;

export type FormId = keyof typeof formUrls;

export const documents = [
  // ── Forms ──
  {
    // The whole form, uploaded together: the application, both partners' declarations, and the
    // landlord's affidavit where a lease is asked for (its points, points.ts).
    id: "statusApplicationMarried",
    translation: "none",
    owner: "couple",
    category: "forms",
    when: "married",
    // With both of them abroad, the consulate doesn't ask for it: it's filed with the online
    // application once they're in Israel. With the Israeli partner in Israel, it's filed without the
    // foreign partner's declaration, a document of its own (foreignDeclarationMarried).
    later: { all: ["foreignAbroad", "israeliAbroad"] },
    form: "AS/6",
    // Both partners' declarations, and the landlord's affidavit.
    signing: "lawyer",
    source: `${P8} §ד.2.א, §ד.2.ז; AS/6, the landlord's affidavit (affidavit annexed to the lease – couples)`,
    verified: true,
  },
  {
    // Form AS/6's foreign partner's declaration, while the Israeli partner files the form from Israel
    // without it: the foreign partner signs it once they're in Israel.
    id: "foreignDeclarationMarried",
    translation: "none",
    owner: "foreign",
    category: "forms",
    when: { all: ["married", "foreignAbroad", "israeliInIsrael"] },
    later: "foreignAbroad",
    form: "AS/6",
    signing: "lawyer",
    source: `${P8} §ד.2.ז; AS/6, the foreign partner's declaration (הצהרת בן הזוג המוזמן)`,
    verified: true,
  },
  {
    id: "entryPermitApplication",
    translation: "none",
    owner: "foreign",
    category: "forms",
    // With both of them abroad, the entry permit is asked for at the consulate, before the file.
    when: { all: ["foreignAbroad", "israeliInIsrael"] },
    form: "AS/1",
    source: `${P8} §ד.2.א`,
    verified: true,
  },
  {
    // The foreign partner is already in Israel: the request to change their visa.
    id: "visaChangeApplication",
    translation: "none",
    owner: "foreign",
    category: "forms",
    when: "foreignInIsrael",
    form: "AS/3",
    source: "Practice, confirmed by the product owner",
    verified: true,
  },
  {
    // One declaration both partners sign, instead of the two AS/6 affidavits.
    id: "affidavitCommonLaw",
    translation: "none",
    owner: "couple",
    category: "forms",
    when: "commonLaw",
    // Both partners sign it in front of the clerk: only once the foreign partner is in Israel.
    later: "foreignAbroad",
    form: "5.2.0009_a",
    signing: "clerk",
    source: `${P9}, the affidavit form (5.2.0009_a)`,
    verified: true,
  },
  {
    id: "relationshipStory",
    translation: "none",
    owner: "couple",
    category: "forms",
    source: `${P8} §ד.2.ו; ${AS6}`,
    verified: true,
  },
  {
    id: "securityCv",
    translation: "none",
    owner: "foreign",
    category: "forms",
    when: "foreignNeedsSecurityCheck",
    source: `${P8} §ד.2.ט`,
    verified: true,
  },

  // ── Identity ──
  {
    id: "israeliId",
    translation: "none",
    owner: "israeli",
    category: "identity",
    issuedBy: "israel",
    source: `${P8} §ד.2.ג`,
    verified: true,
  },
  {
    id: "israeliPhotos",
    translation: "none",
    owner: "israeli",
    category: "identity",
    copies: 3,
    source: `${P8} §ד.2.ב; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignPassport",
    translation: "none",
    owner: "foreign",
    category: "identity",
    source: `${P8} §ד.2.ד; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignPhotos",
    translation: "none",
    owner: "foreign",
    category: "identity",
    copies: 3,
    source: `${P8} §ד.2.ב; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignBirthCertificate",
    translation: "notarized",
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
    translation: "notarized",
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
    translation: "none",
    owner: "couple",
    category: "relationship",
    when: "marriedInIsrael",
    issuedBy: "israel",
    source: `${P8} §ד.2.ה`,
    verified: true,
  },
  {
    id: "marriageCertificateAbroad",
    translation: "notarized",
    owner: "couple",
    category: "relationship",
    when: { any: ["marriedAbroad", "marriedOnline"] },
    issuedBy: "marriage",
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: true,
  },
  {
    id: "relationshipEvidence",
    translation: "none",
    owner: "couple",
    category: "relationship",
    source: `${P8} §ד.2.ח`,
    verified: true,
  },
  {
    // Up to 10 pages of their chats and calls, over the time they've been together.
    id: "messageHistory",
    // Their own evidence: they translate or explain it themselves, no notary.
    translation: "none",
    owner: "couple",
    category: "relationship",
    source: "Practice, confirmed by the product owner",
    verified: true,
  },
  {
    // From Israeli family and friends, in Hebrew.
    id: "recommendationLetters",
    translation: "none",
    owner: "couple",
    category: "relationship",
    source: `${P8} §ד.2.ח`,
    verified: true,
  },
  {
    // Every couple who says they live, or lived, together, married or not.
    id: "jointLivingEvidence",
    translation: "self",
    owner: "couple",
    category: "relationship",
    when: "livingTogether",
    source: `${P8} §ד.2.ח; practice (product owner)`,
    verified: true,
  },
  {
    id: "jointChildrenBirthCertificates",
    translation: "notarized",
    owner: "couple",
    category: "relationship",
    when: "childrenTogether",
    issuedBy: "unknown",
    source: P8,
    verified: false,
  },

  // ── Civil status ──
  {
    // The civil status. The procedure names the nationality; in practice offices ask every country
    // lived in, like the police certificate. What each item has to show: points.ts. The children:
    // previousChildrenAffidavit.
    id: "foreignCivilStatus",
    translation: "notarized",
    owner: "foreign",
    category: "civilStatus",
    each: "policeCountry",
    issuedBy: "each",
    // Many countries have no such certificate (lib/knowledge/documents/foreignCivilStatus.md).
    orAffidavit: true,
    copies: 2,
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: true,
  },
  {
    // The children from previous relationships, or that there are none: an affidavit no country's
    // document replaces. Its own document, so a couple abroad can sign it once they're in Israel.
    id: "previousChildrenAffidavit",
    translation: "none",
    owner: "foreign",
    category: "civilStatus",
    later: "foreignAbroad",
    signing: "lawyerCourtOrNotary",
    source: `${P8} §ד.2.ה; ${AS6}`,
    verified: true,
  },
  {
    id: "foreignDivorceDecree",
    translation: "notarized",
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
    translation: "notarized",
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
    translation: "notarized",
    owner: "israeli",
    category: "civilStatus",
    when: "israeliDivorced",
    issuedBy: "unknown",
    source: "Practice: offices ask the Israeli partner for it (product owner)",
    verified: true,
  },
  {
    id: "israeliSpouseDeathCertificate",
    translation: "notarized",
    owner: "israeli",
    category: "civilStatus",
    when: "israeliWidowed",
    issuedBy: "unknown",
    source: P8,
    verified: false,
  },

  // ── Criminal record ──
  {
    // Every country of citizenship, and each other country lived in for 6 months in a row (since January 2024).
    id: "foreignPoliceCertificate",
    translation: "notarized",
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
    translation: "self",
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
    translation: "none",
    owner: "israeli",
    category: "centerOfLife",
    when: { all: ["israeliInIsrael", { not: "livingTogether" }] },
    source: `${P8} §ד.2.ח; ${AS6}`,
    verified: false,
  },
  {
    id: "utilityBills",
    // From abroad, for a couple who lived together there.
    translation: "self",
    owner: "couple",
    category: "centerOfLife",
    // The home you share, or shared, in Israel or abroad.
    when: "livingTogether",
    source: AS6,
    verified: true,
  },
  {
    // Never lived together: the bills of the Israeli partner's own home in Israel, in their name.
    id: "israeliUtilityBills",
    translation: "none",
    owner: "israeli",
    category: "centerOfLife",
    when: { all: ["israeliInIsrael", { not: "livingTogether" }] },
    source: AS6,
    verified: true,
  },
  {
    // Services in Israel: someone has to live here to receive them.
    id: "governmentServices",
    translation: "none",
    owner: "couple",
    category: "centerOfLife",
    when: { any: ["israeliInIsrael", "foreignInIsrael"] },
    source: `${P8} §ד.2.ח; ${AS6}`,
    verified: true,
  },
  {
    // A B/1 holder has no public health insurance: a private plan in Israel, or a policy from abroad.
    // With the Israeli partner filing from Israel, only once the foreign partner is there: the
    // procedures don't ask for it before arrival.
    id: "foreignHealthInsurance",
    // A policy from abroad.
    translation: "self",
    owner: "foreign",
    category: "centerOfLife",
    later: { all: ["foreignAbroad", "israeliInIsrael"] },
    source: "Practice, confirmed by the product owner",
    verified: true,
  },
  {
    // On the AS/6 checklist, so for married couples only; and the municipality confirms a home in Israel: someone has to live here.
    id: "ishurToshav",
    translation: "none",
    owner: "couple",
    category: "centerOfLife",
    when: { all: ["married", { any: ["israeliInIsrael", "foreignInIsrael"] }] },
    source: `${P8} §ד.2.ח; ${AS6}`,
    verified: true,
  },
  {
    // Part of AS/6, so for married couples only.
    id: "sharedBankAccount",
    translation: "self",
    owner: "couple",
    category: "centerOfLife",
    when: "married",
    source: `${P8} §ד.2.ח; ${AS6}`,
    verified: true,
  },
  {
    // Common-law couples' bank evidence, instead of the AS/6 joint account confirmation.
    id: "bankStatements",
    translation: "self",
    owner: "couple",
    category: "centerOfLife",
    when: "commonLaw",
    source: "Practice, confirmed by the product owner",
    verified: true,
  },
  {
    id: "israeliIncomeProof",
    // From abroad, for an Israeli partner working for a business outside Israel.
    translation: "self",
    owner: "israeli",
    category: "centerOfLife",
    source: AS6,
    verified: true,
  },
  {
    id: "foreignIncomeProof",
    translation: "self",
    owner: "foreign",
    category: "centerOfLife",
    source: AS6,
    verified: true,
  },
  {
    // Evidence the household lives in Israel (§ה.2(7)): any of its children in school here.
    id: "childrenSchoolRecords",
    translation: "none",
    owner: "couple",
    category: "centerOfLife",
    when: { any: ["childrenTogether", "childrenMoving"] },
    source: `${AS6}; ${P8} §ה.2(7)`,
    verified: false,
  },

  // ── Children moving to Israel ──
  {
    id: "childBirthCertificate",
    translation: "notarized",
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
    translation: "none",
    owner: "children",
    category: "children",
    when: "childrenMoving",
    source: `${P8} §ד.2.י`,
    verified: true,
  },
  {
    id: "childPoliceCertificate",
    translation: "notarized",
    owner: "children",
    category: "children",
    when: "childrenMoving",
    issuedBy: "unknown",
    source: `${P8} §ד.2.י`,
    verified: true,
  },
  {
    id: "otherParentConsent",
    translation: "notarized",
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
    translation: "notarized",
    owner: "children",
    category: "children",
    when: "otherParentInvolved",
    issuedBy: "unknown",
    source: `${P8} §ה.2(9)ב`,
    verified: true,
  },
  {
    id: "custodyOrder",
    translation: "notarized",
    owner: "children",
    category: "children",
    when: "otherParentCourtOrder",
    issuedBy: "unknown",
    source: `${P8} §ה.2(9)י`,
    verified: true,
  },
  {
    id: "otherParentDeathCertificate",
    translation: "notarized",
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
  // v29: parts of form AS/6, uploaded with it as one document.
  israeliAffidavitMarried: "statusApplicationMarried",
  foreignAffidavitMarried: "statusApplicationMarried",
  landlordAffidavit: "statusApplicationMarried",
};

/** Ids removed without a replacement. Never used again, so old saved progress can't attach to a new document. */
export const RETIRED_DOCUMENT_IDS: readonly string[] = [
  // v2: the fee isn't a document.
  "feeReceipt",
  // v2: split into the center-of-life documents every couple needs.
  "centerOfLifeEvidence",
  // v18: no procedure or form asks for a letter about a stay without a valid visa.
  "foreignStayExplanation",
  // v25: a duplicate. Common-law couples have no status application of their own: AS/3 or AS/1.
  "statusApplicationCommonLaw",
  // v28: merged into foreignCivilStatus, the nationality's item: its children point.
  "foreignChildrenAffidavit",
];
