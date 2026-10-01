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
// than lib/knowledge, but never contradict it. No line checks a document
// against another one (a name against the passport or ID, say): the checker
// sees one document at a time. Checking against the couple's details in the
// file is fine. Changing this file doesn't
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
  // From the form (AS/1, two pages) and lib/knowledge.
  entryPermitApplication: {
    required: [
      "It is form AS/1 (אש/1), \"Application for entry visa to Israel\", with both pages: page 1 with the inviter's and the invitee's details, and page 2 with the addresses and the two declarations.",
      "The visa category at the top (\"category of ___\", מסוג) is B/2 (ב/2): the foreign partner enters Israel on it, and gets B/1 after arriving. B/1 or anything else here is an issue.",
      "The Israeli partner's details are filled in: first and family name, ID number, relation to the invitee, and cellphone number. The name matches the Israeli partner's name in the file.",
      "The foreign partner's family name and given name are filled in, in English, on both pages, and match the foreign partner's name in the file.",
      "The foreign partner's father's name, mother's name, date of birth and occupation are filled in.",
      "The nationality and citizenship fit the foreign partner's nationality in the file, and the country of birth fits their country of birth in the file.",
      "The gender fits the foreign partner's gender in the file.",
      "The family status fits the file: \"married\" for a married couple; for a common-law couple, what the foreign partner's previous marriages make them (single, divorced or widowed).",
      "The travel document is marked (passport or laissez-passer), with its number, where it was issued and until when it's valid. The passport number is the same on both pages.",
      "If the couple is married, the spouse section names the Israeli partner, matching their name in the file.",
      "The purpose of entry into Israel is filled in.",
      "Both questions about earlier requests (rejected before; filed together with this one) are answered yes or no, and each \"yes\" says when and where.",
      "The permanent address abroad is filled in, in English: country, town, street and house number, and phone number.",
      "The Israeli embassy or consulate to notify when the permit is approved is filled in.",
      "The Israeli partner's declaration on page 2 has the place, the date and their signature, and one option is marked on whether the foreign partner will receive a salary or payment.",
      "The foreign partner's declaration on page 2 has the place, the date and their signature.",
      "The \"For official use only\" box (לשימוש המשרד) is empty.",
    ],
    recommended: [
      "The same visa category is written at the top of page 2.",
      "The company name, company ID and the establishment's stamp are left empty: they're for employers and institutions.",
      "The passport's \"valid until\" date leaves at least 2 more years from today, as the passport itself needs.",
      "The previous stays section is filled in, or clearly marked as none, rather than left blank.",
      "The foreign partner's email address is filled in.",
      "The details are typed, or handwritten clearly enough to read without guessing.",
    ],
  },
  israeliAffidavitMarried: "notYet",
  foreignAffidavitMarried: "notYet",
  // From the form (5.2.0009_a) and how it's signed: at the appointment, in front of the clerk.
  affidavitCommonLaw: {
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
  foreignBirthCertificate: {
    required: [
      "It is a birth certificate, and the person it's for is the foreign partner.",
      "It is issued by the foreign partner's country of birth in the file, by today's borders. A certificate from the USSR fits a birth country that was a Soviet republic (Kyiv in the Soviet Union is Ukraine).",
      "The sex on it fits the foreign partner's gender in the file.",
      "The date and place of birth are on it and readable.",
      "It carries the certification the file says it needs (an apostille or consular legalization), in the same file. An original from the former USSR issued up to 1998 needs none; one issued later, including a new copy of an old record, does.",
      "If it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "The apostille or legalization pages are scanned together with the certificate, in order.",
      "Every side or page with print or a stamp on it is included, not only the front.",
      "It is scanned straight and in color, readable in full, with nothing cut off at the edges.",
    ],
  },
  foreignNameChange: "notYet",
  marriageCertificateIsrael: "notYet",
  marriageCertificateAbroad: "notYet",
  relationshipEvidence: "notYet",
  recommendationLetters: "notYet",
  jointLivingEvidence: "notYet",
  jointChildrenBirthCertificates: "notYet",
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
  israeliHousingContract: "notYet",
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
