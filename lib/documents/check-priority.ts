import type { DocumentId } from "./catalog";

// Which documents to check first: where a check most often finds something
// to fix. Foreign official documents first (an apostille, a certified
// translation, a recent issue date, names that have to match), then the
// forms and affidavits, then what the couple gathers themselves, and last the
// IDs and photos, which rarely go wrong. The overview recommends where to
// spend the free check from this order.
//
// Every document with a check written (checks.ts) is here, and only those:
// checks.test.ts fails otherwise.

export const checkPriority = [
  "foreignPoliceCertificate",
  "foreignCivilStatus",
  "statusApplicationMarried",
  "foreignBirthCertificate",
  "marriageCertificateAbroad",
  "foreignDivorceDecree",
  "foreignSpouseDeathCertificate",
  "foreignNameChange",
  "entryPermitApplication",
  "visaChangeApplication",
  "foreignDeclarationMarried",
  "affidavitCommonLaw",
  "previousChildrenAffidavit",
  "jointChildrenBirthCertificates",
  "marriageCertificateIsrael",
  "relationshipStory",
  "securityCv",
  "foreignIncomeProof",
  "israeliIncomeProof",
  "bankStatements",
  "sharedBankAccount",
  "housingContract",
  "israeliHousingContract",
  "jointLivingEvidence",
  "utilityBills",
  "israeliUtilityBills",
  "governmentServices",
  "foreignHealthInsurance",
  "relationshipEvidence",
  "messageHistory",
  "recommendationLetters",
  "ishurToshav",
  "foreignPassport",
  "israeliId",
  "foreignPhotos",
  "israeliPhotos",
] as const satisfies readonly DocumentId[];

/**
 * Of the uploaded items, the ones to check first, most likely to need fixing
 * first: at most `limit`. Items are the document list's (`id`, `key`); a
 * document with no check written isn't ranked, so it's never recommended.
 */
export function checkFirst<T extends { id: string; key: string }>(
  items: readonly T[],
  uploaded: ReadonlySet<string>,
  limit: number,
): T[] {
  const rank = (id: string) => (checkPriority as readonly string[]).indexOf(id);
  return items
    .filter((item) => uploaded.has(item.key) && rank(item.id) >= 0)
    .sort((a, b) => rank(a.id) - rank(b.id))
    .slice(0, limit);
}
