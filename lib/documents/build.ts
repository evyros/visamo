import {
  documents,
  type Category,
  type DocumentDefinition,
  type DocumentId,
  type FormId,
  type Owner,
  type Signing,
  type Translation,
} from "./catalog";
import { certificationFor, type Certification, type Issuer } from "./certification";
import { evaluate } from "./conditions";
import { profileOf, type CaseProfile, type CaseSnapshot, type Fact } from "./facts";
import { pointsFor, type Point } from "./points";
import { issuerEntry } from "./issuers";
import { affidavitInsteadOf, statusByAffidavit, stepsFor, type Step, type StepsItem } from "./steps";

// The list builder: a case in, its documents out. Pure: no database, no
// messages. The list isn't stored; it's built on every read, and progress is
// saved per item key.

export type RequiredDocument = {
  /** Stable: the id, or `id:country` for one item per country. Progress is saved under it. */
  key: string;
  id: DocumentId;
  owner: Owner;
  category: Category;
  form?: FormId;
  /** How many copies to bring, when more than one. */
  copies?: number;
  /** The couple decides whether it applies to them (see the catalog). */
  optional: boolean;
  /** The country it's for, for one item per country, or the one it comes from when that's known from the case (the birth certificate). */
  country?: string;
  /** Null for documents not issued by an authority (forms, photos, evidence). */
  certification: Certification | null;
  /** The translation it needs, if it isn't in Hebrew or Arabic (see the catalog). Uploaded with the document, as one of its files. */
  translation: Translation;
  /** Who it's signed in front of (see the catalog). */
  signing?: Signing;
  /** What to do to it before it's ready, in order (see steps.ts). */
  steps: Step[];
  /** An affidavit about the civil status can replace it if it can't be had (see steps.ts): said with its description. */
  affidavitInstead: boolean;
  /**
   * The civil status may be proved by an affidavit, which can declare the children too: one
   * affidavit then goes to both the nationality's civil-status item and the children's affidavit.
   * Set on both.
   */
  oneAffidavit: boolean;
  /** Done once the foreign partner is in Israel: listed apart, in a group of its own (see the catalog). */
  later: boolean;
  /** The facts that put it on the list; empty for documents every couple needs. */
  because: Fact[];
  /** What it has to show, by the case (see points.ts); empty for most documents. */
  points: Point[];
};

function issuerOf(issuedBy: DocumentDefinition["issuedBy"], profile: CaseProfile, country?: string): Issuer | undefined {
  const { countries, facts } = profile;
  switch (issuedBy) {
    case undefined:
      return undefined;
    case "israel":
      return "IL";
    case "nationality":
      return countries.nationality;
    case "birthCountry":
      return countries.birthCountry;
    case "marriage":
      return facts.marriedOnline ? "utah" : countries.marriageCountry;
    case "each":
      return country ?? null;
    case "unknown":
      return null;
  }
}

export function buildDocumentList(snapshot: CaseSnapshot): RequiredDocument[] {
  const profile = profileOf(snapshot);
  // The originals have to be in Israel for the appointment: sent there from the country that issued them,
  // unless both partners are abroad and bring them when they move.
  const sendOriginals = !(profile.facts.foreignAbroad && profile.facts.israeliAbroad);
  const list = documents.flatMap((doc: DocumentDefinition) => {
    const { match, because } = evaluate(doc.when, profile.facts);
    if (!match) return [];
    const countries = doc.each ? profile.countries.police : [undefined];
    return countries.map((country): RequiredDocument => {
      const issuer = issuerOf(doc.issuedBy, profile, country);
      const from = country ?? (doc.issuedBy === "birthCountry" ? profile.countries.birthCountry : undefined);
      const signing = "signing" in doc ? doc.signing : undefined;
      const points = pointsFor(doc.id as DocumentId, profile, country);
      const issued = issuerEntry(doc.id as DocumentId, issuer);
      const issuerKind = issued?.kind;
      // A country that issues no such document: an affidavit in its place, which isn't certified like one.
      const certification =
        issuer === undefined || issuerKind === "affidavit" ? null : certificationFor(issuer, doc.exemption);
      const stepsItem: StepsItem = {
        issuer,
        certification,
        translation: doc.translation,
        signing,
        ...(issuerKind && { issuerKind }),
        ...(issued?.electronic && { electronic: true }),
        orAffidavit: "orAffidavit" in doc && !!doc.orAffidavit,
        // AS/6 filed without the foreign partner's declaration: they sign the applicants' declaration by email.
        signByEmail: doc.id === "statusApplicationMarried" && !points.includes("as6ForeignDeclaration"),
        landlord: points.includes("as6LandlordAffidavit"),
      };
      return {
        key: country ? `${doc.id}:${country}` : doc.id,
        id: doc.id as DocumentId,
        owner: doc.owner,
        category: doc.category,
        ...(doc.form && { form: doc.form }),
        ...(doc.copies && { copies: doc.copies }),
        optional: !!doc.optional,
        ...(from && { country: from }),
        certification,
        translation: doc.translation,
        ...(signing && { signing }),
        steps: stepsFor(stepsItem, sendOriginals),
        affidavitInstead: affidavitInsteadOf(stepsItem),
        oneAffidavit: doc.id === "foreignCivilStatus" && country === profile.countries.nationality && statusByAffidavit(stepsItem),
        later: "later" in doc && evaluate(doc.later, profile.facts).match,
        because,
        points,
      };
    });
  });
  // The children's affidavit, where the nationality's civil status may be an affidavit too.
  const shared = list.some((d) => d.oneAffidavit);
  return list.map((d) => (d.id === "previousChildrenAffidavit" ? { ...d, oneAffidavit: shared } : d));
}
