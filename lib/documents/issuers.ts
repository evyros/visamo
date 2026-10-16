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

/** `heading`: the country's section in the document's guide. */
export type IssuerEntry = { kind: IssuerKind; heading: string };

export const issuedDocuments = ["foreignBirthCertificate", "foreignCivilStatus", "foreignPoliceCertificate"] as const;
export type IssuedDocument = (typeof issuedDocuments)[number];

export const ISSUERS: Readonly<Record<IssuedDocument, Readonly<Partial<Record<string, IssuerEntry>>>>> = {
  foreignBirthCertificate: {
    BR: { kind: "document", heading: "Brazil" },
    CN: { kind: "document", heading: "China" },
    CZ: { kind: "document", heading: "Czech Republic" },
    DK: { kind: "document", heading: "Denmark" },
    ES: { kind: "document", heading: "Spain" },
    JP: { kind: "document", heading: "Japan" },
    MX: { kind: "document", heading: "Mexico" },
    PT: { kind: "document", heading: "Portugal" },
    RU: { kind: "document", heading: "Russia" },
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
    CH: { kind: "document", heading: "Switzerland" },
    CL: { kind: "document", heading: "Chile" },
    CN: { kind: "document", heading: "China" },
    CZ: { kind: "documentOrAffidavit", heading: "Czech Republic" },
    DE: { kind: "document", heading: "Germany" },
    DK: { kind: "document", heading: "Denmark" },
    ES: { kind: "document", heading: "Spain" },
    FR: { kind: "document", heading: "France" },
    GB: { kind: "documentOrAffidavit", heading: "United Kingdom" },
    HR: { kind: "document", heading: "Croatia" },
    HU: { kind: "document", heading: "Hungary" },
    IN: { kind: "affidavit", heading: "India" },
    IS: { kind: "document", heading: "Iceland" },
    IT: { kind: "document", heading: "Italy" },
    JP: { kind: "documentOrAffidavit", heading: "Japan" },
    MX: { kind: "document", heading: "Mexico" },
    NL: { kind: "document", heading: "Netherlands" },
    PH: { kind: "document", heading: "Philippines" },
    PT: { kind: "document", heading: "Portugal" },
    RU: { kind: "document", heading: "Russia" },
    SE: { kind: "document", heading: "Sweden" },
    SG: { kind: "documentOrAffidavit", heading: "Singapore" },
    SI: { kind: "document", heading: "Slovenia" },
    TH: { kind: "document", heading: "Thailand" },
    UA: { kind: "document", heading: "Ukraine" },
    US: { kind: "documentOrAffidavit", heading: "United States" },
    ZA: { kind: "documentOrAffidavit", heading: "South Africa" },
  },
  foreignPoliceCertificate: {
    AR: { kind: "document", heading: "Argentina" },
    AT: { kind: "document", heading: "Austria" },
    AU: { kind: "document", heading: "Australia" },
    BE: { kind: "document", heading: "Belgium" },
    BO: { kind: "document", heading: "Bolivia" },
    BR: { kind: "document", heading: "Brazil" },
    CA: { kind: "document", heading: "Canada" },
    CH: { kind: "document", heading: "Switzerland" },
    CL: { kind: "document", heading: "Chile" },
    CN: { kind: "document", heading: "China" },
    CZ: { kind: "document", heading: "Czech Republic" },
    DE: { kind: "document", heading: "Germany" },
    DK: { kind: "document", heading: "Denmark" },
    ES: { kind: "document", heading: "Spain" },
    FR: { kind: "document", heading: "France" },
    GB: { kind: "document", heading: "United Kingdom" },
    HR: { kind: "document", heading: "Croatia" },
    HU: { kind: "document", heading: "Hungary" },
    IN: { kind: "document", heading: "India" },
    IS: { kind: "document", heading: "Iceland" },
    IT: { kind: "document", heading: "Italy" },
    JP: { kind: "document", heading: "Japan" },
    MX: { kind: "document", heading: "Mexico" },
    NL: { kind: "document", heading: "Netherlands" },
    PH: { kind: "document", heading: "Philippines" },
    PT: { kind: "document", heading: "Portugal" },
    RU: { kind: "document", heading: "Russia" },
    SE: { kind: "document", heading: "Sweden" },
    SG: { kind: "document", heading: "Singapore" },
    SI: { kind: "document", heading: "Slovenia" },
    TH: { kind: "document", heading: "Thailand" },
    UA: { kind: "document", heading: "Ukraine" },
    US: { kind: "document", heading: "United States" },
    ZA: { kind: "document", heading: "South Africa" },
  },
};

const isIssued = (id: DocumentId): id is IssuedDocument => (issuedDocuments as readonly string[]).includes(id);

/** How `country` provides the document, if it's known. */
export function issuerEntry(id: DocumentId, country: string | null | undefined): IssuerEntry | undefined {
  if (!country || !isIssued(id)) return undefined;
  return ISSUERS[id][country];
}
