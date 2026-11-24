import type { DocumentId } from "./catalog";

// How a country provides a document, for the few documents whose steps
// differ by country: who issues it, and whether the country issues it at
// all. Only facts: the rules that turn them into steps are in steps.ts, and
// the names and explanations shown to the couple are in the messages
// (app.documentsPage.issuers.<document>.<country>), in both languages.
//
// Every entry restates a country's section in that document's guide
// (lib/knowledge/documents/<id>.md, `### <heading>`): the tests check the
// section exists. A country without an entry gets the general steps.
// Changing an entry changes couples' lists: it needs a catalog version.

/**
 * - "document": the country issues it.
 * - "documentOrAffidavit": it exists, but often can't be had (only before
 *   the marriage, or an office that may not know it): an affidavit can
 *   replace it.
 * - "affidavit": the country issues none: an affidavit replaces it.
 */
export type IssuerKind = "document" | "documentOrAffidavit" | "affidavit";

/**
 * `heading`: the country's section in the document's guide. `electronic`: for
 * Israel, it's issued only as a file, with an electronic apostille: there's no
 * paper original to ask for or send. `english`, where the guide's section says
 * so: "onRequest", it can be issued in English, though the country's own
 * language is usual, so it needs no translation if it's asked for in English;
 * "always", it's always in English (among other languages), and needs none.
 */
export type IssuerEntry = { kind: IssuerKind; heading: string; electronic?: true; english?: English };

export type English = "onRequest" | "always";

export const issuedDocuments = [
  "foreignBirthCertificate",
  "foreignCivilStatus",
  "foreignPoliceCertificate",
  "marriageCertificateAbroad",
] as const;
export type IssuedDocument = (typeof issuedDocuments)[number];

export const ISSUERS: Readonly<Record<IssuedDocument, Readonly<Partial<Record<string, IssuerEntry>>>>> = {
  foreignBirthCertificate: {
    AR: { kind: "document", heading: "Argentina", electronic: true },
    BR: { kind: "document", heading: "Brazil" },
    CN: { kind: "document", heading: "China" },
    CU: { kind: "document", heading: "Cuba" },
    CZ: { kind: "document", heading: "Czech Republic" },
    DE: { kind: "document", heading: "Germany", english: "always" },
    DK: { kind: "document", heading: "Denmark", english: "onRequest" },
    EE: { kind: "document", heading: "Estonia", english: "onRequest" },
    ES: { kind: "document", heading: "Spain" },
    FR: { kind: "document", heading: "France" },
    GB: { kind: "document", heading: "United Kingdom" },
    IT: { kind: "document", heading: "Italy" },
    JP: { kind: "document", heading: "Japan" },
    MX: { kind: "document", heading: "Mexico" },
    NL: { kind: "document", heading: "Netherlands", english: "onRequest" },
    NP: { kind: "document", heading: "Nepal" },
    PE: { kind: "document", heading: "Peru" },
    PH: { kind: "document", heading: "Philippines", electronic: true },
    PL: { kind: "document", heading: "Poland" },
    PT: { kind: "document", heading: "Portugal" },
    RU: { kind: "document", heading: "Russia" },
    SE: { kind: "document", heading: "Sweden", english: "onRequest" },
    TH: { kind: "document", heading: "Thailand", english: "onRequest" },
    TM: { kind: "document", heading: "Turkmenistan" },
    TZ: { kind: "document", heading: "Tanzania" },
    UA: { kind: "document", heading: "Ukraine" },
    US: { kind: "document", heading: "United States" },
    ZA: { kind: "document", heading: "South Africa" },
  },
  foreignCivilStatus: {
    AR: { kind: "document", heading: "Argentina" },
    AT: { kind: "document", heading: "Austria" },
    AU: { kind: "document", heading: "Australia" },
    BE: { kind: "document", heading: "Belgium" },
    BO: { kind: "document", heading: "Bolivia" },
    BR: { kind: "document", heading: "Brazil" },
    CA: { kind: "document", heading: "Canada" },
    CH: { kind: "document", heading: "Switzerland", english: "always" },
    CL: { kind: "document", heading: "Chile" },
    CN: { kind: "document", heading: "China" },
    CU: { kind: "document", heading: "Cuba" },
    CY: { kind: "documentOrAffidavit", heading: "Cyprus" },
    CZ: { kind: "documentOrAffidavit", heading: "Czech Republic" },
    DE: { kind: "document", heading: "Germany" },
    DK: { kind: "document", heading: "Denmark", english: "onRequest" },
    EE: { kind: "document", heading: "Estonia", english: "onRequest" },
    ES: { kind: "document", heading: "Spain" },
    FR: { kind: "documentOrAffidavit", heading: "France" },
    GB: { kind: "documentOrAffidavit", heading: "United Kingdom" },
    GR: { kind: "document", heading: "Greece" },
    HR: { kind: "document", heading: "Croatia" },
    HU: { kind: "document", heading: "Hungary" },
    IN: { kind: "affidavit", heading: "India" },
    IS: { kind: "document", heading: "Iceland", english: "onRequest" },
    IT: { kind: "document", heading: "Italy" },
    JP: { kind: "documentOrAffidavit", heading: "Japan" },
    MX: { kind: "document", heading: "Mexico" },
    NL: { kind: "document", heading: "Netherlands", english: "onRequest" },
    NP: { kind: "document", heading: "Nepal" },
    PE: { kind: "document", heading: "Peru" },
    PH: { kind: "document", heading: "Philippines", electronic: true },
    PL: { kind: "document", heading: "Poland" },
    PT: { kind: "document", heading: "Portugal" },
    RU: { kind: "document", heading: "Russia" },
    SE: { kind: "document", heading: "Sweden", english: "onRequest" },
    SG: { kind: "documentOrAffidavit", heading: "Singapore" },
    SI: { kind: "document", heading: "Slovenia" },
    TH: { kind: "document", heading: "Thailand" },
    TM: { kind: "document", heading: "Turkmenistan" },
    TZ: { kind: "document", heading: "Tanzania" },
    UA: { kind: "document", heading: "Ukraine" },
    US: { kind: "documentOrAffidavit", heading: "United States" },
    ZA: { kind: "documentOrAffidavit", heading: "South Africa" },
  },
  foreignPoliceCertificate: {
    AR: { kind: "document", heading: "Argentina", electronic: true },
    AT: { kind: "document", heading: "Austria", english: "always" },
    AU: { kind: "document", heading: "Australia" },
    BE: { kind: "document", heading: "Belgium" },
    BO: { kind: "document", heading: "Bolivia" },
    BR: { kind: "document", heading: "Brazil" },
    CA: { kind: "document", heading: "Canada" },
    CH: { kind: "document", heading: "Switzerland", english: "onRequest" },
    CL: { kind: "document", heading: "Chile" },
    CN: { kind: "document", heading: "China" },
    CU: { kind: "document", heading: "Cuba" },
    CY: { kind: "document", heading: "Cyprus" },
    CZ: { kind: "document", heading: "Czech Republic" },
    DE: { kind: "document", heading: "Germany", english: "always" },
    DK: { kind: "document", heading: "Denmark", english: "onRequest" },
    EE: { kind: "document", heading: "Estonia" },
    ES: { kind: "document", heading: "Spain" },
    FR: { kind: "document", heading: "France" },
    GB: { kind: "document", heading: "United Kingdom" },
    GR: { kind: "document", heading: "Greece" },
    HR: { kind: "document", heading: "Croatia" },
    HU: { kind: "document", heading: "Hungary" },
    IN: { kind: "document", heading: "India" },
    IS: { kind: "document", heading: "Iceland", english: "onRequest" },
    IT: { kind: "document", heading: "Italy" },
    JP: { kind: "document", heading: "Japan", english: "always" },
    MX: { kind: "document", heading: "Mexico" },
    NL: { kind: "document", heading: "Netherlands" },
    NP: { kind: "document", heading: "Nepal" },
    PE: { kind: "document", heading: "Peru" },
    PH: { kind: "document", heading: "Philippines" },
    PL: { kind: "document", heading: "Poland" },
    PT: { kind: "document", heading: "Portugal", english: "always" },
    RU: { kind: "document", heading: "Russia" },
    SE: { kind: "document", heading: "Sweden", english: "always" },
    SG: { kind: "document", heading: "Singapore" },
    SI: { kind: "document", heading: "Slovenia" },
    TH: { kind: "document", heading: "Thailand", english: "onRequest" },
    TM: { kind: "document", heading: "Turkmenistan" },
    TZ: { kind: "document", heading: "Tanzania" },
    UA: { kind: "document", heading: "Ukraine" },
    US: { kind: "document", heading: "United States" },
    ZA: { kind: "document", heading: "South Africa" },
  },
  marriageCertificateAbroad: {
    DK: { kind: "document", heading: "Denmark", english: "onRequest" },
    PH: { kind: "document", heading: "Philippines", electronic: true },
    SE: { kind: "document", heading: "Sweden", english: "onRequest" },
  },
};

const isIssued = (id: DocumentId): id is IssuedDocument => (issuedDocuments as readonly string[]).includes(id);

/** How `country` provides the document, if it's known. */
export function issuerEntry(id: DocumentId, country: string | null | undefined): IssuerEntry | undefined {
  if (!country || !isIssued(id)) return undefined;
  return ISSUERS[id][country];
}
