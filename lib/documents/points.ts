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
  "as6ForeignDeclaration",
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
 * israeliHousingContract): it's annexed to the lease. A foreign partner abroad,
 * with the Israeli partner filing from Israel, signs their declaration once
 * they arrive: it's a document of its own then (foreignDeclarationMarried).
 */
function as6Points({ facts }: CaseProfile): Point[] {
  return [
    "as6Application",
    "as6IsraeliDeclaration",
    ...(facts.foreignAbroad && facts.israeliInIsrael ? [] : ["as6ForeignDeclaration" as const]),
    ...(facts.livingTogether || facts.israeliInIsrael ? ["as6LandlordAffidavit" as const] : []),
  ];
}

/** What the item for `id` (and `country`, for one item per country) has to show, in order. */
export function pointsFor(id: DocumentId, profile: CaseProfile, country?: string): Point[] {
  const { facts } = profile;
  if (id === "statusApplicationMarried") return as6Points(profile);
  if (id === "previousChildrenAffidavit") return [facts.foreignHasChildren ? "children" : "noChildren"];
  if (id !== "foreignCivilStatus") return [];
  const status: Point = facts.married ? "statusNowMarried" : `statusNow${previous(profile)}`;
  // From the other countries lived in, only the status now. Before the marriage: once, from the nationality.
  if (country !== profile.countries.nationality || !facts.married) return [status];
  return [status, `statusBefore${previous(profile)}`];
}

/**
 * The parts of a document made of several, uploaded together (form AS/6):
 * its check has lines for each part, and each finding says which part it's
 * about, so the page can show it by part (app.documentsPage.check.parts).
 */
export const parts = ["application", "israeliDeclaration", "foreignDeclaration", "landlordAffidavit"] as const;
export type Part = (typeof parts)[number];
