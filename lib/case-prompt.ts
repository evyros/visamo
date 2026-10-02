import { regionName } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import type { BranchCode, PersonInput, RelationshipInput } from "./case-options";
import { VISA_EXEMPT, VISA_EXEMPT_BIOMETRIC_ONLY } from "./visa-exempt";

// The couple's details as the models read them, in English: the chat
// (lib/chat/prompt.ts) and the document checker (lib/checks/prompt.ts) get
// the same lines, so they know the couple the same way.

export type Lines = [string, string | number | null | undefined][];

/** Labelled lines, leaving out the ones with no value. */
export const lines = (entries: Lines) =>
  entries
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `- ${label}: ${value}`)
    .join("\n");

const yesNo = (value: boolean | null) => (value === null ? null : value ? "yes" : "no");
const country = (code: string | null) => (code ? regionName(code, "en") : null);

/** Whether the nationality visits Israel without a visa: how a partner abroad enters once they have the entry permit. */
function visaToVisit(nationality: string | null) {
  if (!nationality) return null;
  if (VISA_EXEMPT_BIOMETRIC_ONLY.has(nationality)) return "not needed with a biometric passport (ETA-IL); needed otherwise";
  return VISA_EXEMPT.has(nationality) ? "not needed (ETA-IL)" : "needed (B/2 from the Israeli consulate)";
}

/** One partner's details. */
export function personLines(p: PersonInput, t: Messages): Lines {
  const o = t.app.onboarding;
  return [
    ["Gender", o.genders[p.gender]],
    ["Israeli status", p.israeliStatus && o.israeliStatuses[p.israeliStatus]],
    ["Married before", o.previousMarriageOptions[p.previousMarriages]],
    ["Lives", p.residence && o.residences[p.residence]],
    ["Nationality", country(p.nationality)],
    ["Visa to visit Israel", visaToVisit(p.nationality)],
    ["Country of birth", country(p.birthCountry)],
    ["Other countries lived in (6+ months in a row, from 14) or a citizen of", p.countriesLived && (p.countriesLived.map(country).join(", ") || "none")],
    ["Where they are now", p.location && o.locations[p.location]],
    ["Name ever changed", yesNo(p.nameChanged)],
    ["Children from a previous relationship", yesNo(p.hasChildren)],
    ["Of those, under 18 and moving to Israel", yesNo(p.childrenMoving)],
    ["The other parent of those children", p.otherParents?.map((v) => o.otherParentOptions[v]).join("; ")],
  ];
}

/** The couple's details together, and their branch. */
export function relationshipLines(r: RelationshipInput, branch: BranchCode | null, t: Messages): Lines {
  const o = t.app.onboarding;
  return [
    ["Relationship", o.relationships[r.relationship]],
    ["Where they married", r.marriagePlace && o.marriagePlaces[r.marriagePlace]],
    ["Country of the marriage", country(r.marriageCountry)],
    ["Live or lived together", yesNo(r.livingTogether)],
    ["Moved in together in", r.togetherSince],
    ["Children together", yesNo(r.childrenTogether)],
    ["Misrad Hapnim branch", branch ? o.branches[branch] : "not known yet"],
  ];
}
