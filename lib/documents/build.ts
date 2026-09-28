import { documents, type Category, type DocumentDefinition, type DocumentId, type Owner } from "./catalog";
import { certificationFor, type Certification, type Issuer } from "./certification";
import { evaluate } from "./conditions";
import { profileOf, type CaseProfile, type CaseSnapshot, type Fact } from "./facts";

// The list builder: a case in, its documents out. Pure: no database, no
// messages. The list isn't stored; it's built on every read, and progress is
// saved per item key.

export type RequiredDocument = {
  /** Stable: the id, or `id:country` for one item per country. Progress is saved under it. */
  key: string;
  id: DocumentId;
  owner: Owner;
  category: Category;
  form?: string;
  /** How many copies to bring, when more than one. */
  copies?: number;
  /** The couple decides whether it applies to them (see the catalog). */
  optional: boolean;
  /** The country it's for, for one item per country. */
  country?: string;
  /** Null for documents not issued by an authority (forms, photos, evidence). */
  certification: Certification | null;
  /**
   * May need a certified translation (see the catalog): offer an optional
   * translation upload next to the original. The item is done once the
   * original is uploaded.
   */
  mayNeedTranslation: boolean;
  /** The facts that put it on the list; empty for documents every couple needs. */
  because: Fact[];
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
  return documents.flatMap((doc: DocumentDefinition) => {
    const { match, because } = evaluate(doc.when, profile.facts);
    if (!match) return [];
    const countries = doc.each ? profile.countries.police : [undefined];
    return countries.map((country): RequiredDocument => {
      const issuer = issuerOf(doc.issuedBy, profile, country);
      return {
        key: country ? `${doc.id}:${country}` : doc.id,
        id: doc.id as DocumentId,
        owner: doc.owner,
        category: doc.category,
        ...(doc.form && { form: doc.form }),
        ...(doc.copies && { copies: doc.copies }),
        optional: !!doc.optional,
        ...(country && { country }),
        certification: issuer === undefined ? null : certificationFor(issuer, doc.exemption),
        mayNeedTranslation: doc.mayNeedTranslation,
        because,
      };
    });
  });
}
