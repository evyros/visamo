import type { DocumentId } from "./catalog";
import type { CaseProfile } from "./facts";

// What a document has to show, by the couple's case: the bullets on its card
// (app.documents.points.<point> in the messages), and the lines its check
// adds (checks.ts). Only for documents whose content depends on the case;
// the others have none. A change here changes what couples are asked for:
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
] as const;
export type Point = (typeof points)[number];

/** The foreign partner's status apart from a marriage to each other, from their previous marriages. */
function previous({ facts }: CaseProfile): "Single" | "Divorced" | "Widowed" | "DivorcedOrWidowed" {
  if (facts.foreignDivorced && facts.foreignWidowed) return "DivorcedOrWidowed";
  if (facts.foreignDivorced) return "Divorced";
  if (facts.foreignWidowed) return "Widowed";
  return "Single";
}

/** What the item for `id` (and `country`, for one item per country) has to show, in order. */
export function pointsFor(id: DocumentId, profile: CaseProfile, country?: string): Point[] {
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
