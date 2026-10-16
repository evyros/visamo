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
  /** The original, on paper, from the country that issued it, for use abroad. */
  | { kind: "obtain"; from: Exclude<Issuer, null> }
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
  | { kind: "sign"; before: Signing }
  /**
   * An affidavit (תצהיר): about the civil status, in place of a document the
   * country doesn't issue (`from`), or about the children ("noChildren":
   * that there are none), which no country's document proves.
   */
  | { kind: "affidavit"; about: AffidavitAbout; from?: Issuer };

export type AffidavitAbout = "status" | "children" | "noChildren";

/**
 * Which part of a document a step is for: the document itself, or the
 * children's affidavit that goes with the civil status. A card with both
 * shows each part's steps under its own heading.
 */
export type StepPart = "document" | "children";
export const partOf = (step: Step): StepPart =>
  step.kind === "affidavit" && step.about !== "status" ? "children" : "document";

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
      return "couple";
    case "translate":
      return step.level === "notarized" ? "notary" : "couple";
    case "sign":
      return SIGNED_BY[step.before];
    case "affidavit":
      // About the children alone, a lawyer confirms it; about the status, a notary or a consul.
      return step.about === "status" ? "notary" : "lawyer";
  }
}

export type StepsItem = {
  issuer: Issuer | undefined;
  certification: Certification | null;
  translation: Translation;
  signing?: Signing;
  /** How the issuing country provides it, where that's known (issuers.ts). */
  issuerKind?: IssuerKind;
  /** An affidavit can replace it, where a country issues none (the catalog's `orAffidavit`). */
  orAffidavit?: boolean;
  /** It also declares the children, or that there are none, in an affidavit (the civil status's children point). */
  children?: "children" | "noChildren";
};

/** How the country provides it: a country not known to the table may or may not issue one that can be replaced. */
const kindOf = (item: StepsItem): IssuerKind => item.issuerKind ?? (item.orAffidavit ? "documentOrAffidavit" : "document");

/**
 * Whether an affidavit about the civil status can replace the document if it
 * can't be had. Not a step: the card says it with the document's description.
 */
export const affidavitInsteadOf = (item: StepsItem): boolean => kindOf(item) === "documentOrAffidavit";

/** `sendOriginals`: originals from abroad are sent to Israel; not when both partners are abroad, and bring them. */
export function stepsFor(item: StepsItem, sendOriginals: boolean): Step[] {
  const { issuer, certification, translation, signing, children } = item;
  const steps: Step[] = [];
  // No such document in the country: an affidavit about the civil status in its place.
  const noDocument = kindOf(item) === "affidavit";
  if (noDocument) steps.push({ kind: "affidavit", about: "status", ...(issuer !== undefined && { from: issuer }) });
  const authentication = certification?.authentication;
  // Issued abroad, by a known country: got from there and certified there.
  const fromAbroad = !noDocument && !!authentication && authentication !== "none" && issuer !== undefined;
  if (fromAbroad && issuer) steps.push({ kind: "obtain", from: issuer });
  if (fromAbroad) {
    const chain = authentication === "legalization" && issuer ? legalizationChain(issuer) : undefined;
    steps.push({ kind: "authenticate", from: issuer, certification: certification!, ...(chain && { chain }) });
  }
  if (fromAbroad && issuer && sendOriginals) steps.push({ kind: "send" });
  if (translation !== "none") {
    steps.push({ kind: "translate", level: translation, ...(issuer !== undefined && { from: issuer }) });
  }
  if (signing) steps.push({ kind: "sign", before: signing });
  // No country's document proves the children: always an affidavit of their own.
  if (children) steps.push({ kind: "affidavit", about: children });
  return steps;
}
