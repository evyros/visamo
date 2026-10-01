import "server-only";
import { DOCUMENT_ALIASES, type DocumentId } from "./catalog";

// How to check each document: what the document checker (lib/checks) looks
// for in a couple's files. This is Visamo's own knowledge of how documents
// are verified in practice, so it's read by the checker only: never by the
// chat, never in lib/knowledge, never in the browser ("server-only" fails
// the build if a client component imports it).
//
//   required     the minimum requirements. Each one that isn't met is an
//                issue, and the document needs fixing.
//   recommended  what makes the document stronger. These separate "looks
//                good" from "can be improved".
//
// Written in English, for the model. A line can be stricter or more detailed
// than lib/knowledge, but never contradict it. Changing this file doesn't
// change anyone's list, so it needs no catalog version.
//
// Every catalog document has an entry, or the build fails. "notYet" is the
// explicit way to put one off: the document has no Check button until its
// check is written.

export type DocumentCheck = {
  required: readonly string[];
  recommended: readonly string[];
};

export const checks = {
  statusApplicationMarried: "notYet",
  statusApplicationCommonLaw: "notYet",
  entryPermitApplication: "notYet",
  israeliAffidavit: "notYet",
  foreignAffidavit: "notYet",
  // From the form (5.2.0009_a) and how it's signed: at the appointment, in front of the clerk.
  commonLawAffidavit: {
    required: [
      "It is the common-law affidavit form, titled \"בקשתי בהתאם לנוהל בני זוג על סמך חיים משותפים - תצהיר\", with the whole page: all 13 statements and the signature section.",
      "The Israeli partner's full name and ID number (תעודת זהות) are filled in.",
      "The foreign partner's full name and passport number are filled in.",
      "It is not signed yet: both signature lines are empty. It's signed only in front of the clerk at the appointment. If it's signed, they print a new copy, fill in the details again, and leave it unsigned.",
      "The office's confirmation section (מאשר החתימה בלשכת רשות האוכלוסין וההגירה) is empty: the clerk fills it in at the appointment.",
      "If the lines for statements they can't declare are filled in, they say which statement and why.",
    ],
    recommended: [
      "The details are typed, or handwritten clearly enough to read without guessing.",
    ],
  },
  // DRAFT: the requirements are from lib/knowledge (§ד.2.ו). The contradiction
  // check and the recommendations about gaps are additions to review.
  relationshipStory: {
    required: [
      "It is a letter about this couple's relationship, and it names both partners as they appear in the file.",
      "It tells how and when they met.",
      "It describes their relationship: how it developed, and the main steps in it.",
      "It describes their life together.",
      "It is signed by both partners: two signatures are visible.",
      "Nothing in it contradicts the couple's details in the file, such as whether and where they married, or since when they've been together.",
    ],
    recommended: [
      "Each partner's life history, where it helps explain the relationship.",
      "Concrete dates and places for the main steps (meeting, visits, moving in, the wedding), rather than general statements.",
      "If the relationship is relatively short, or they spent long periods apart, the letter explains it openly.",
      "It is dated, typed or clearly handwritten, with each partner's name next to their signature.",
    ],
  },
  securityCv: "notYet",
  israeliId: "notYet",
  israeliPhotos: "notYet",
  // DRAFT, from lib/knowledge only: replace with how it's verified in practice.
  foreignPassport: {
    required: [
      "It is a passport of the foreign partner, and the name on it matches the foreign partner's name in the file.",
      "It is valid for at least 2 more years from today.",
      "The main (photo) page is included and fully readable.",
      "The pages with visas and border-control stamps are included.",
    ],
    recommended: [
      "Every page with a stamp or visa is included, in order, not only the latest ones.",
      "Each page is scanned straight, in color, with nothing cut off at the edges.",
    ],
  },
  foreignPhotos: "notYet",
  foreignStayExplanation: "notYet",
  foreignBirthCertificate: "notYet",
  foreignNameChange: "notYet",
  marriageCertificateIsrael: "notYet",
  marriageCertificateAbroad: "notYet",
  relationshipEvidence: "notYet",
  recommendationLetters: "notYet",
  jointLivingEvidence: "notYet",
  jointChildrenBirthCertificates: "notYet",
  // DRAFT, from lib/knowledge only: replace with how it's verified in practice.
  foreignCivilStatus: {
    required: [
      "It states the foreign partner's civil status, and the name on it matches the foreign partner's name in the file.",
      "It is issued by the foreign partner's country, or, if that country doesn't issue one, it is a notarized affidavit of their status signed in front of an Israeli consul, a notary abroad, a notary in Israel, or their country's consul in Israel.",
      "It was issued in the last 6 months, counted from today.",
      "It carries the certification the file says it needs (an apostille or consular legalization), in the same file.",
      "If it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it, and the translation matches the original. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: ["The apostille or legalization pages are scanned together with the document, in order."],
  },
  foreignDivorceDecree: "notYet",
  foreignSpouseDeathCertificate: "notYet",
  israeliDivorceDecree: "notYet",
  israeliSpouseDeathCertificate: "notYet",
  foreignPoliceCertificate: "notYet",
  housingContract: "notYet",
  landlordAffidavit: "notYet",
  utilityBills: "notYet",
  governmentServices: "notYet",
  ishurToshav: "notYet",
  sharedFinances: "notYet",
  israeliIncomeProof: "notYet",
  foreignIncomeProof: "notYet",
  childrenSchoolRecords: "notYet",
  childBirthCertificate: "notYet",
  childPassport: "notYet",
  childPoliceCertificate: "notYet",
  otherParentConsent: "notYet",
  otherParentAddress: "notYet",
  custodyOrder: "notYet",
  otherParentDeathCertificate: "notYet",
} satisfies Record<DocumentId, DocumentCheck | "notYet">;

/** How to check a list item (`id` or `id:country`), following renames; null when there's no check for it yet. */
export function checkFor(documentKey: string): DocumentCheck | null {
  const [saved] = documentKey.split(":");
  const id = DOCUMENT_ALIASES[saved] ?? saved;
  const check = (checks as Record<string, DocumentCheck | "notYet" | undefined>)[id];
  return check && check !== "notYet" ? check : null;
}
