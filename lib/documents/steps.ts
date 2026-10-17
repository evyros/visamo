import type { Signing, Translation } from "./catalog";
import type { Certification, Issuer } from "./certification";
import { legalizationChain, type ChainLink } from "./countries";
import type { IssuerKind } from "./issuers";

// What a couple does to a document before it's ready, in the order it's done:
// get the original from the country that issued it, certify it there, send
// it to Israel, translate it, sign it. Worked out from the item's
// certification, translation and signing; only the steps that apply are
// listed. Each step says who does it (`byOf`): the professional a couple
// would go to for it.
//
// Where a country's way of providing the document is known (issuers.ts), the
// steps follow it: a country that issues none gets an affidavit instead of
// getting and certifying the original.

export type Step =
  /**
   * The original, on paper, from the country that issued it, for use abroad.
   * `electronic`: the country issues it only as a file (issuers.ts), with no paper original.
   */
  | { kind: "obtain"; from: Exclude<Issuer, null>; electronic?: true }
  /**
   * The apostille or legalization, from the country that issued it (null:
   * not known, "if it's from abroad"). `chain`: the offices of a legalization,
   * in order, where they're known for the country.
   */
  | { kind: "authenticate"; from: Issuer; certification: Certification; chain?: readonly ChainLink[] }
  /** The original sent to Israel from the country that issued it, for the translation and the appointment. */
  | { kind: "send" }
  /** `from`: the country that issued it, when it's issued by one; null when that isn't known. */
  | { kind: "translate"; level: Exclude<Translation, "none">; from?: Issuer }
  /** `by`: someone other than the partners signs this part (form AS/6's landlord's affidavit). */
  | { kind: "sign"; before: Signing; by?: "landlord" }
  /** A foreign partner abroad signs only the applicants' declaration of form AS/6 now, on a scan sent by email. */
  | { kind: "signByEmail" }
  /** An affidavit (תצהיר) about the civil status, in place of a document the country (`from`) doesn't issue. */
  | { kind: "affidavit"; from?: Issuer };

export type StepKind = Step["kind"];

/**
 * Who does a step, where the couple goes for it: the issuing country's
 * offices, a notary, a lawyer, a consul, the clerk at the appointment, or
 * the couple themselves.
 */
export type By = "issuingCountry" | "notary" | "lawyer" | "consul" | "clerk" | "couple";

const SIGNED_BY: Record<Signing, By> = {
  clerk: "clerk",
  lawyer: "lawyer",
  // Any of them confirms it; a lawyer is the usual one.
  lawyerCourtOrNotary: "lawyer",
  notary: "notary",
  consul: "consul",
};

export function byOf(step: Step): By {
  switch (step.kind) {
    case "obtain":
    case "authenticate":
      return "issuingCountry";
    case "send":
    case "signByEmail":
      return "couple";
    case "translate":
      return step.level === "notarized" ? "notary" : "couple";
    case "sign":
      return SIGNED_BY[step.before];
    case "affidavit":
      // A notary, or a consul.
      return "notary";
  }
}

export type StepsItem = {
  issuer: Issuer | undefined;
  certification: Certification | null;
  translation: Translation;
  signing?: Signing;
  /** How the issuing country provides it, where that's known (issuers.ts). */
  issuerKind?: IssuerKind;
  /** The issuing country issues it only as a file, with an electronic apostille (issuers.ts). */
  electronic?: boolean;
  /** An affidavit can replace it, where a country issues none (the catalog's `orAffidavit`). */
  orAffidavit?: boolean;
  /** The foreign partner, abroad, signs their part by email first (form AS/6's applicants' declaration). */
  signByEmail?: boolean;
  /** The landlord signs their affidavit too, in front of a lawyer (form AS/6, if they rent). */
  landlord?: boolean;
};

/** How the country provides it: a country not known to the table may or may not issue one that can be replaced. */
const kindOf = (item: StepsItem): IssuerKind => item.issuerKind ?? (item.orAffidavit ? "documentOrAffidavit" : "document");

/**
 * Whether an affidavit about the civil status can replace the document if it
 * can't be had. Not a step: the card says it with the document's description.
 */
export const affidavitInsteadOf = (item: StepsItem): boolean => kindOf(item) === "documentOrAffidavit";

/** Whether the civil status may be proved by an affidavit: in its place, or where the country issues none. */
export const statusByAffidavit = (item: StepsItem): boolean => kindOf(item) !== "document";

/** `sendOriginals`: originals from abroad are sent to Israel; not when both partners are abroad, and bring them. */
export function stepsFor(item: StepsItem, sendOriginals: boolean): Step[] {
  const { issuer, certification, translation, signing, signByEmail, landlord, electronic } = item;
  const steps: Step[] = [];
  // No such document in the country: an affidavit about the civil status in its place.
  const noDocument = kindOf(item) === "affidavit";
  if (noDocument) steps.push({ kind: "affidavit", ...(issuer !== undefined && { from: issuer }) });
  const authentication = certification?.authentication;
  // Issued abroad, by a known country: got from there and certified there.
  const fromAbroad = !noDocument && !!authentication && authentication !== "none" && issuer !== undefined;
  if (fromAbroad && issuer) steps.push({ kind: "obtain", from: issuer, ...(electronic && { electronic: true as const }) });
  if (fromAbroad) {
    const chain = authentication === "legalization" && issuer ? legalizationChain(issuer) : undefined;
    steps.push({ kind: "authenticate", from: issuer, certification: certification!, ...(chain && { chain }) });
  }
  // A file has no original to send: it comes by email.
  if (fromAbroad && issuer && sendOriginals && !electronic) steps.push({ kind: "send" });
  if (translation !== "none") {
    steps.push({ kind: "translate", level: translation, ...(issuer !== undefined && { from: issuer }) });
  }
  if (signByEmail) steps.push({ kind: "signByEmail" });
  if (signing) steps.push({ kind: "sign", before: signing });
  if (landlord) steps.push({ kind: "sign", before: "lawyer", by: "landlord" });
  return steps;
}
