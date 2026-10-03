import type { DocumentId } from "./catalog";
import type { CaseProfile } from "./facts";

// What a document has to show, by the couple's case: the bullets on its card
// (app.documents.points.<point> in the messages), and the lines its check
// adds (checks.ts). Only for documents whose content depends on the case,
// or that are made of parts uploaded together (form AS/6 and its
// declarations); the others have none. A change here changes what couples are asked for:
// like the catalog, it needs a catalog version (see CLAUDE.md).

export const points = [
  // The foreign partner's civil status now, by what their previous marriages make them.
  "statusNowSingle",
  "statusNowDivorced",
  "statusNowWidowed",
  "statusNowDivorcedOrWidowed",
  // Married to each other: their status now, whatever their country shows.
  "statusNowMarried",
  // Married to each other: their status before the marriage.
  "statusBeforeSingle",
  "statusBeforeDivorced",
  "statusBeforeWidowed",
  "statusBeforeDivorcedOrWidowed",
  // Their children from previous relationships.
  "noChildren",
  "children",
  // Form AS/6's parts, uploaded together as one document.
  "as6Application",
  "as6IsraeliDeclaration",
  // The foreign partner's declaration: signed now, or not needed yet while the Israeli partner files alone.
  "as6ForeignDeclaration",
  "as6ForeignDeclarationLater",
  "as6LandlordAffidavit",
] as const;
export type Point = (typeof points)[number];

/** The foreign partner's status apart from a marriage to each other, from their previous marriages. */
function previous({ facts }: CaseProfile): "Single" | "Divorced" | "Widowed" | "DivorcedOrWidowed" {
  if (facts.foreignDivorced && facts.foreignWidowed) return "DivorcedOrWidowed";
  if (facts.foreignDivorced) return "Divorced";
  if (facts.foreignWidowed) return "Widowed";
  return "Single";
}

/**
 * Form AS/6's parts: the application, both declarations, and the landlord's
 * affidavit wherever a lease is asked for (housingContract,
 * israeliHousingContract): it's annexed to the lease.
 */
function as6Points(profile: CaseProfile): Point[] {
  const { facts } = profile;
  return [
    "as6Application",
    "as6IsraeliDeclaration",
    as6ForeignDeclaration(profile),
    ...(facts.livingTogether || facts.israeliInIsrael ? ["as6LandlordAffidavit" as const] : []),
  ];
}

/**
 * The foreign partner's declaration, by where they are. A foreign partner
 * abroad signs it once they arrive: an Israeli partner in Israel files
 * without it, and a couple both abroad files together once they're in Israel.
 */
function as6ForeignDeclaration({ facts }: CaseProfile): Point {
  return !facts.foreignInIsrael && facts.israeliInIsrael ? "as6ForeignDeclarationLater" : "as6ForeignDeclaration";
}

/** What the item for `id` (and `country`, for one item per country) has to show, in order. */
export function pointsFor(id: DocumentId, profile: CaseProfile, country?: string): Point[] {
  if (id === "statusApplicationMarried") return as6Points(profile);
  if (id !== "foreignCivilStatus") return [];
  const { facts } = profile;
  const status: Point = facts.married ? "statusNowMarried" : `statusNow${previous(profile)}`;
  // From the other countries lived in, only the status now. Before the marriage and the
  // children: once, from the nationality.
  if (country !== profile.countries.nationality) return [status];
  return [
    status,
    ...(facts.married ? [`statusBefore${previous(profile)}` as const] : []),
    facts.foreignHasChildren ? "children" : "noChildren",
  ];
}

/**
 * The parts of a document made of several, uploaded together (form AS/6):
 * its check has lines for each part, and each finding says which part it's
 * about, so the page can show it by part (app.documentsPage.check.parts).
 */
export const parts = ["application", "israeliDeclaration", "foreignDeclaration", "landlordAffidavit"] as const;
export type Part = (typeof parts)[number];
