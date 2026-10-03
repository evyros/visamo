import "server-only";
import type { CheckModel } from "@/lib/chat/openrouter";
import { DOCUMENT_ALIASES, type DocumentId } from "./catalog";
import type { Part, Point } from "./points";

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
//   maxPages     the most pages one check sends, when the document is
//                usually longer than the default (lib/checks/files.ts).
//   model        "strong" for a document the standard model misreads, such
//                as a scanned form with handwritten ticks and signatures: it
//                costs more a check (lib/chat/openrouter.ts CHECK_MODELS).
//   parts        for a document made of parts uploaded together (form AS/6):
//                each part's own required and recommended lines. Each
//                finding then names its part.
//
// Written in English, for the model. A line can be stricter or more detailed
// than lib/knowledge, but never contradict it. No line checks a document
// against another one (the checker sees one document at a time), or a name
// on it against the name in the file: that's what the couple typed, not
// necessarily the full legal name. Other details from the file are fine.
// Changing this file doesn't change anyone's list, so it needs no catalog
// version.
//
// Every catalog document has an entry, or the build fails. "notYet" is the
// explicit way to put one off: the document has no Check button until its
// check is written. A document whose content depends on the case (points.ts)
// has a function of its points instead.

export type DocumentCheck = {
  required: readonly string[];
  recommended: readonly string[];
  maxPages?: number;
  model?: CheckModel;
  parts?: readonly CheckPart[];
};

/** A part of a document made of several (see points.ts), with its own lines. */
export type CheckPart = {
  part: Part;
  /** What the part is and how to find it, for the model. */
  name: string;
  required: readonly string[];
  recommended: readonly string[];
};

/** Bills of many months, from several providers. */
const BILLS_PAGES = 60;

/** Passport photos, the same for both partners. */
const passportPhoto: DocumentCheck = {
  required: [
    "It is a passport-format photo of one person: the face straight to the camera, head upright, eyes open, with nothing covering the face.",
    "It is in color, on a light, plain background.",
  ],
  recommended: [],
};

/** The line each point adds to a civil-status item's check (see points.ts). */
const civilStatusPoints: Record<Exclude<Point, `as6${string}`>, string> = {
  statusNowSingle:
    "A document of the foreign partner's civil status now, from the country this item is for, issued in the last 6 months, that shows they're single, or that no marriage is registered for them.",
  statusNowDivorced:
    "A document of the foreign partner's civil status now, from the country this item is for, issued in the last 6 months, that shows they're divorced, or that no current marriage is registered for them.",
  statusNowWidowed:
    "A document of the foreign partner's civil status now, from the country this item is for, issued in the last 6 months, that shows they're widowed, or that no current marriage is registered for them.",
  statusNowDivorcedOrWidowed:
    "A document of the foreign partner's civil status now, from the country this item is for, issued in the last 6 months, that shows they're divorced or widowed, or that no current marriage is registered for them.",
  statusNowMarried:
    "A document of the foreign partner's civil status now, from the country this item is for, issued in the last 6 months. It may show them as married, or still as single if the marriage isn't registered in that country: both are fine.",
  statusBeforeSingle:
    "A document of the foreign partner's civil status before the marriage, showing they were single: a civil-status document from before the wedding, or a marriage certificate from the foreign partner's country that states their status before the marriage. It doesn't have to be from the last 6 months.",
  statusBeforeDivorced:
    "A document of the foreign partner's civil status before the marriage, showing they were divorced: a civil-status document from before the wedding, or a marriage certificate from the foreign partner's country that states their status before the marriage. It doesn't have to be from the last 6 months.",
  statusBeforeWidowed:
    "A document of the foreign partner's civil status before the marriage, showing they were widowed: a civil-status document from before the wedding, or a marriage certificate from the foreign partner's country that states their status before the marriage. It doesn't have to be from the last 6 months.",
  statusBeforeDivorcedOrWidowed:
    "A document of the foreign partner's civil status before the marriage, showing they were divorced or widowed: a civil-status document from before the wedding, or a marriage certificate from the foreign partner's country that states their status before the marriage. It doesn't have to be from the last 6 months.",
  noChildren:
    "An affidavit (תצהיר) of the foreign partner stating that they have no children from a previous relationship, signed by them and confirmed by a lawyer or notary, with the lawyer's or notary's stamp and signature.",
  children:
    "An affidavit (תצהיר) of the foreign partner listing their children from previous relationships, with who has guardianship of each, signed by them and confirmed by a lawyer or notary, with the lawyer's or notary's stamp and signature.",
};

/**
 * Civil status and children: one line for each point the item has to show,
 * whatever the files are split into. One affidavit can declare several
 * points at once.
 */
function civilStatusCheck(points: readonly Point[]): DocumentCheck {
  return {
    required: [
      ...points.flatMap((point) => (point in civilStatusPoints ? [civilStatusPoints[point as keyof typeof civilStatusPoints]] : [])),
      "The civil-status documents are issued by an authority of the country this item is for, as in the document's details: a civil-status certificate, an extract from a population or civil register, a record search showing no marriage is registered, or a certificate of no impediment to marriage. Or, if there's no way to get one, a notarized or consular affidavit of their status: signed in front of a notary in Israel, an Israeli consul abroad, the country's consul in Israel, or a notary in that country.",
      "One affidavit that declares several of the points above covers each of them: they don't need a document each.",
      "Each document from abroad carries the certification the file says it needs (an apostille or consular legalization), in the same file. An affidavit signed abroad carries that country's apostille or legalization.",
      "If a document isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it, and the translation matches the original. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
      "If a translation was made abroad, by a notary there, it carries its own apostille or legalization from that country: a translation made in Israel needs none.",
    ],
    recommended: [
      "The apostille or legalization pages are scanned together with each document, in order.",
      "Each certificate is a paper original issued for use abroad, not a document printed at home from an online service.",
      ...(points.includes("children") ? ["Each child is named with their date of birth."] : []),
      ...(points.some((point) => point === "children" || point === "noChildren") ? ["The affidavit is dated."] : []),
    ],
  };
}

/** The foreign partner's declaration, as filled in and signed. */
const foreignDeclarationLines = [
  "It is the foreign partner's declaration from form AS/6, titled \"הצהרת בן הזוג המוזמן\", with the whole page: the statements, the explanation lines, the signature line and the confirmation section.",
  "The foreign partner's first and last name are filled in.",
  "Each of the statements is ticked. Any statement that isn't ticked is explained in the lines under the list.",
];

/** Form AS/6's parts, by the points that call for them (see points.ts). */
const as6Parts: Record<Extract<Point, `as6${string}`>, CheckPart> = {
  // From the form: the application and the applicants' declaration.
  as6Application: {
    part: "application",
    name: "The application: the sections \"פרטי המזמין/ה\" and \"פרטי המוזמן/ת\", and the applicants' declaration (\"הצהרת המבקשים\")",
    required: [
      "It is form AS/6, \"בקשה לקבלת מעמד בישראל לבן זוג זר הנשוי לישראלי\", with the application (the sections \"פרטי המזמין/ה\" and \"פרטי המוזמן/ת\") and the applicants' declaration (\"הצהרת המבקשים\").",
      // No line for the request boxes (permanent residency or naturalization), on purpose. In the
      // evals (October 2026), no model could tell an empty box from a marked one: they're tiny printed
      // squares, next to a box that says "נא לסמן x". Sonnet missed an empty one in 2 of 3 checks, even
      // told where to look; Gemini 3.1 Pro said marked ones were empty. A line that's wrong that often
      // does more harm than good. Bring it back only with a model that passes evals/checks
      // statusApplicationMarried with a case of an empty request box, 3 of 3.
      "The Israeli partner's details are filled in: status (citizen or permanent resident), ID number, family and first name, date of birth, gender, civil status, address and a phone number.",
      "The foreign partner's details are filled in: passport number and expiry, family and first name, date of birth, gender, civil status, citizenship and a phone number. The address abroad (המען בחו\"ל: country, city, street and number) is filled in too, unless the file says the foreign partner is in Israel: then it can be empty.",
      "If the file says children are moving with the foreign partner, the accompanying minors section (קטינים נלווים) lists them, and whether the other parent's consent is attached is marked.",
      "The applicants' declaration is signed by both partners, each with their name, ID number and the date.",
      "The office's parts (received by, the clerk's name, the receipt, \"לשימוש משרדי\") are empty.",
    ],
    recommended: [
      "The people who can give details about the couple are listed, each with their ID number, relation and phone. Their address is optional: never report it missing.",
      "Both partners' civil status is marked as married, and the date of marriage is filled in.",
      "If the file says the foreign partner is in Israel, the date and place of entry and their status in Israel are filled in.",
      "The details are typed, or handwritten clearly enough to read without guessing.",
    ],
  },
  // From the form, and how it's signed: in front of a lawyer or registrar.
  as6IsraeliDeclaration: {
    part: "israeliDeclaration",
    name: "The Israeli partner's declaration, titled \"הצהרת בן הזוג המזמין\"",
    required: [
      "It is the Israeli partner's declaration from form AS/6, titled \"הצהרת בן הזוג המזמין\", with the whole page: the five statements, the explanation lines, the signature line and the confirmation section.",
      "Each of the five statements is ticked. Any statement that isn't ticked is explained in the lines under the list.",
      "The Israeli partner has signed on the signature line (חתימת המזמין/ה): there's handwriting on the line itself. A filled place or date isn't a signature. The place and the date are filled in too.",
      "The lawyer's or registrar's confirmation (אישור קבלת ההצהרה) is filled in: their name and license number, the declarer's name and ID number, and their stamp and signature.",
    ],
    recommended: ["The ticks are clear, and the page is scanned straight and readable in full."],
  },
  // From the form, and how it's signed: in front of a lawyer or registrar.
  as6ForeignDeclaration: {
    part: "foreignDeclaration",
    name: "The foreign partner's declaration, titled \"הצהרת בן הזוג המוזמן\"",
    required: [
      ...foreignDeclarationLines,
      "The foreign partner has signed on the signature line (חתימת המוזמן/ת): there's handwriting on the line itself. A filled place or date isn't a signature. The place and the date are filled in too.",
      "The lawyer's or registrar's confirmation (אישור קבלת ההצהרה) is filled in: their name and license number, the declarer's name and ID number, and their stamp and signature.",
    ],
    recommended: ["The ticks are clear, and the page is scanned straight and readable in full."],
  },
  // A foreign partner abroad, with the Israeli partner filing alone from Israel: they sign it once
  // they're in Israel, and the application is filed without it.
  as6ForeignDeclarationLater: {
    part: "foreignDeclaration",
    name: "The foreign partner's declaration, titled \"הצהרת בן הזוג המוזמן\". The foreign partner is abroad and the Israeli partner files without it: they sign it once they're in Israel, so it may be missing, and unsigned if it's there",
    required: [],
    recommended: [
      `If it's in the files: ${foreignDeclarationLines.map((line) => line.charAt(0).toLowerCase() + line.slice(1)).join(" ")} Its signature and the lawyer's confirmation may still be empty. If it isn't in the files, report nothing about it.`,
    ],
  },
  // From the form, and how it's signed: in front of a lawyer or registrar. Only for couples who
  // rent, which onboarding doesn't ask: nothing in it is required.
  as6LandlordAffidavit: {
    part: "landlordAffidavit",
    name: "The landlord's affidavit (נספח אש6), titled \"תצהיר נספח להסכם שכ\"ד - בני זוג\", with a copy of the landlord's Teudat Zehut. Only for couples who rent",
    required: [],
    recommended: [
      "The landlord's affidavit is in the files, with the whole page. If it isn't, this is the only finding for this part: say it's needed if they rent their home, signed by the landlord in front of a lawyer, and not if they own it.",
      "The landlord's first name, last name and ID number are filled in.",
      "The tenant whose application it supports is named, with their ID number.",
      "The home's address is filled in, with its size, and the statement that it's rented to the couple.",
      "The bills table is filled in: for electricity, water, phone and arnona, whether the landlord or the tenant pays.",
      "The landlord has signed (שם וחתימת המצהיר): there's a handwritten signature, not only a name. The date is filled in too.",
      "The lawyer's or registrar's confirmation (אישור קבלת ההצהרה) is filled in: their name, license number and date, the declarer's ID number, and their stamp and signature.",
      "A copy of the landlord's Teudat Zehut is uploaded with it.",
      "The section on who else lives in the home is filled in, or clearly marked that no one else does.",
      "The landlord's civil status, number of children under 18 and occupation are filled in.",
    ],
  },
};

/**
 * Form AS/6, uploaded whole: a part for each point the item has. It comes in
 * two formats, with the pages in a different order: each part is found by
 * its title, never its page number (the checker is told so for every part).
 */
function as6Check(points: readonly Point[]): DocumentCheck {
  return {
    required: [],
    recommended: [],
    // Scanned, with handwritten ticks and signatures: the standard model misread them in the evals.
    model: "strong",
    parts: points.flatMap((point) => (point in as6Parts ? [as6Parts[point as keyof typeof as6Parts]] : [])),
  };
}

export const checks = {
  statusApplicationMarried: as6Check,
  // From the form (AS/1, two pages) and lib/knowledge.
  entryPermitApplication: {
    required: [
      "It is form AS/1 (אש/1), \"Application for entry visa to Israel\", with both pages: page 1 with the inviter's and the invitee's details, and page 2 with the addresses and the two declarations.",
      "The visa category at the top (\"category of ___\", מסוג) is B/2 (ב/2): the foreign partner enters Israel on it, and gets B/1 after arriving. B/1 or anything else here is an issue.",
      "The Israeli partner's details are filled in: first and family name, ID number, relation to the invitee, and cellphone number.",
      "The foreign partner's family name and given name are filled in, in English, on both pages.",
      "The foreign partner's father's name, mother's name, date of birth and occupation are filled in.",
      "The nationality and citizenship fit the foreign partner's nationality in the file, and the country of birth fits their country of birth in the file.",
      "The gender fits the foreign partner's gender in the file.",
      "The family status fits the file: \"married\" for a married couple; for a common-law couple, what the foreign partner's previous marriages make them (single, divorced or widowed).",
      "The travel document is marked (passport or laissez-passer), with its number, where it was issued and until when it's valid. The passport number is the same on both pages.",
      "If the couple is married, the spouse section names the Israeli partner.",
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
  // From the form (AS/3, two pages).
  visaChangeApplication: {
    required: [
      "It is form AS/3 (אש/3), \"בקשה להארכת רשיון ישיבה / להחלפת סוג האשרה\" (Application for the extension of permit of residence / change of visa category), with both pages.",
      "The change of visa category (בקשה להחלפת סוג האשרה) is marked, with the visa asked for written in.",
      "The foreign partner's details are filled in, in Hebrew and English: family and first name, civil status, country and date of birth, nationality and citizenship, and father's and mother's names.",
      "The travel document (passport or laissez-passer) is filled in, with its number, issue date and expiry.",
      "The address in Israel and a phone number are filled in.",
      "The spouse's details (פרטים של בן/בת הזוג) name the Israeli partner, with their ID number and status in Israel.",
      "The declaration has the place, the date and the applicant's signature.",
      "The office's part (לשימוש המשרד) is empty.",
    ],
    recommended: [
      "The permanent address abroad and the email address are filled in.",
      "The details are typed, or handwritten clearly enough to read without guessing.",
    ],
  },
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
      "It is a letter about this couple's relationship, and it names both partners.",
      "It tells how and when they met.",
      "It describes their relationship: how it developed, and the main steps in it.",
      "It describes their life together.",
      "It is signed by both partners: two signatures are visible.",
      "Nothing in it contradicts the couple's details in the file, such as whether and where they married, or since when they've been together.",
    ],
    recommended: [
      "It's written in Hebrew.",
      "It's about 3–4 paragraphs long.",
      "It includes anecdotes and major life events the couple shared, not only a summary.",
      "Concrete dates and places for the main steps (meeting, visits, moving in, the wedding), rather than general statements.",
      "If the relationship is relatively short, or they spent long periods apart, the letter explains it openly.",
      "It is dated, typed or clearly handwritten, with each partner's name next to their signature.",
    ],
  },
  securityCv: {
    required: [
      "It is the CV form for the security screening (קורות חיים לאבחון), the bilingual Hebrew and Arabic form, not a job CV or a free-form résumé.",
      "It is filled in: a full history of the foreign partner's employment and life, with no section left empty.",
    ],
    recommended: [
      "Every period is accounted for, with dates, so there are no unexplained gaps.",
      "It is typed, or handwritten clearly enough to read without guessing.",
    ],
  },
  israeliId: {
    required: [
      "It is an Israeli Teudat Zehut (identity card), both sides of the card, readable.",
      "The appendix (ספח) is included, as a paper appendix or a printed or downloaded one.",
      "A driver's license or a passport instead of the Teudat Zehut is an issue: it isn't accepted.",
      "If the file says the couple married abroad or online, the appendix shows the Israeli partner as married. If it doesn't, that's an issue: the marriage has to be registered at Misrad Hapnim before applying.",
    ],
    recommended: [
      "The appendix is recent, so the address and civil status on it.",
      "Each side is scanned straight, with nothing cut off at the edges.",
    ],
  },
  israeliPhotos: passportPhoto,
  foreignPassport: {
    required: [
      "It is a passport of the foreign partner.",
      "It is valid for at least 2 more years from today. If it's valid for less, it has to be renewed: the visa is given only once it is.",
      "The main (photo) page is included and fully readable.",
      "The pages with visas and border-control stamps are included.",
    ],
    recommended: [
      "Each page is scanned straight, in color, with nothing cut off at the edges.",
    ],
  },
  foreignPhotos: passportPhoto,
  foreignBirthCertificate: {
    required: [
      "It is a birth certificate, and the person it's for is the foreign partner.",
      "It is issued by the foreign partner's country of birth in the file, by today's borders. A certificate from the USSR fits a birth country that was a Soviet republic (Kyiv in the Soviet Union is Ukraine).",
      "The sex on it fits the foreign partner's gender in the file.",
      "The date and place of birth are on it and readable.",
      "It carries the certification the file says it needs (an apostille or consular legalization), in the same file. An original from the former USSR issued up to 1998 needs none; one issued later, including a new copy of an old record, does.",
      "If it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
      "If the translation was made abroad, by a notary there, it carries its own apostille or legalization from that country: a translation made in Israel needs none.",
    ],
    recommended: [
      "The apostille or legalization pages are scanned together with the certificate, in order.",
      "Every side or page with print or a stamp on it is included, not only the front.",
      "It is scanned straight and in color, readable in full, with nothing cut off at the edges.",
    ],
  },
  foreignNameChange: {
    required: [
      "It is an official public document that shows a change of name: a marriage certificate, a divorce decree that restores a former name, a court order, a deed poll, or a civil registry's name-change certificate. It shows the name before the change and the name after it.",
      "It carries an apostille or consular legalization from the country that issued it, in the same file.",
      "If it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "If the name changed more than once, there's a document for each change, so together they link the name at birth to today's name.",
      "It is scanned straight and readable in full, with the issuing authority's seal or signature visible.",
    ],
  },
  marriageCertificateIsrael: {
    required: [
      "It is an Israeli marriage certificate (תעודת נישואין) from the rabbinate or another religious court in Israel, naming the two spouses.",
      "It is readable in full, with the issuing body's stamp or signature visible.",
    ],
    recommended: ["It is scanned straight, with nothing cut off at the edges."],
  },
  marriageCertificateAbroad: {
    required: [
      "It is an official marriage certificate from the civil authority that registered the marriage abroad, or, for an online marriage, from a Utah county, naming the two spouses.",
      "It carries the certification the file says it needs, in the same file: an apostille or consular legalization from the country of the marriage, or, for a Utah marriage, an apostille from the Utah Lieutenant Governor's office.",
      "If it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
      "If the translation was made abroad, by a notary there, it carries its own apostille or legalization from that country: a translation made in Israel needs none.",
    ],
    recommended: [
      "The apostille or legalization pages are scanned together with the certificate, in order.",
      "It is readable in full, with the issuing authority's seal or signature visible.",
    ],
  },
  relationshipEvidence: {
    required: [
      "They are photos of the same two people together: the couple, in each photo.",
      "There are at least 10 photos.",
      "The photos are in color, not black and white.",
    ],
    recommended: [
      "They're from different places and different times, not one event.",
      "Some include family and friends with the couple.",
      "On pages, they're arranged in a grid of 6, 9 or 12 photos to a page, each photo still clear.",
    ],
  },
  messageHistory: {
    required: [
      "It shows messages or calls between two people: screenshots or printouts of chats (WhatsApp, email, social media and the like), or a call log.",
      "The dates of the messages or calls are visible.",
    ],
    recommended: [
      "It is about 10 pages or fewer, chosen, not an entire chat history.",
      "It spans different times in the relationship, from early on to recently, not one day or one week.",
      "If the messages aren't in Hebrew or English, the important parts are translated or explained alongside them. A notarized translation isn't needed.",
      "Each page is readable, with the text not cut off.",
    ],
  },
  recommendationLetters: {
    required: [
      "There are at least 3 letters, from different writers.",
      "Each is a letter about the couple's relationship, written in Hebrew by an Israeli family member or friend, not by either partner.",
      "Each is signed by its writer, and gives their contact details.",
      "A copy of each writer's Teudat Zehut is uploaded with their letter.",
    ],
    recommended: [
      "Each says how the writer knows the couple, and for how long, and describes what they've seen of the relationship, their first impression, not only general praise.",
      "If the file says the couple never lived together, the letters say the writers saw them together.",
      "Each is about 2-3 paragraphs long. If the file shows a short relationship (a recent year of moving in) or that the couple never lived together, the letters are longer and more detailed.",
      "Each is dated.",
    ],
  },
  jointLivingEvidence: {
    required: [
      "It shows that both partners live, or lived, at the same address: for example, a lease or property in both names, bills in both names, statements of a joint bank account, or official mail addressed to each of them at that address.",
      "If it isn't in Hebrew, Arabic or English (from a home abroad), a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "Together, the documents cover at least the last 12 months.",
      "There are several kinds of evidence, not only one document.",
      "Each document is readable in full, with the address and the dates visible.",
    ],
  },
  jointChildrenBirthCertificates: {
    required: [
      "It is an official birth certificate of a child, listing two parents: from the Israeli Population and Immigration Authority (digitally or manually signed), or from a civil registry abroad.",
      "From abroad: it carries an apostille or consular legalization from the country of birth, in the same file. An Israeli one needs no certification.",
      "From abroad: if it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "Each child has their own certificate: one upload can hold several, one per child.",
      "It is the full document, readable, with the issuing office's seal or signature visible.",
    ],
  },
  // Its required lines follow the case: civilStatusCheck, below.
  foreignCivilStatus: civilStatusCheck,
  foreignDivorceDecree: {
    required: [
      "It is an official proof of divorce: a court's divorce decree or judgment, or a divorce certificate from a civil registry.",
      "It is final: the document that ends the marriage, not an interim step. A conditional order or decree nisi (UK), or a decision without the note that it's final where the country adds one (Germany's Rechtskraftvermerk, France's certificate of non-appeal), is an issue. A Philippine annulment or declaration of nullity comes with its certificate of finality.",
      "It carries an apostille or consular legalization from the country where the divorce was granted, in the same file. That country can differ from the foreign partner's nationality.",
      "If it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "Every page of the decree is included, not only the first and the last.",
      "The apostille or legalization pages are scanned together with the decree, in order.",
      "It is scanned straight and in color, readable in full, with the court's seal or the clerk's signature visible.",
    ],
  },
  foreignSpouseDeathCertificate: {
    required: [
      "It is an official death certificate, or a certified copy of the death entry, from a civil registry or vital records office.",
      "It carries an apostille or consular legalization from the country that issued it, in the same file. That country can differ from the foreign partner's nationality.",
      "If it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "If the foreign partner was widowed more than once, there's a death certificate for each of those marriages.",
      "It is the certified document scanned in full, readable, with the issuing office's seal or signature visible.",
    ],
  },
  israeliDivorceDecree: {
    required: [
      "It is an official proof of divorce: a divorce certificate from an Israeli rabbinical court (תעודת גירושין), a judgment of an Israeli religious court (Sharia or ecclesiastical) or of the family court dissolving the marriage (התרת נישואין), or a divorce decree or certificate from abroad.",
      "It is final: the document that ends the marriage, not an interim step.",
      "From abroad: it carries an apostille or consular legalization from the country where the divorce was granted, in the same file. An Israeli one needs no certification.",
      "From abroad: if it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "Every page is included, not only the first and the last.",
      "It is scanned straight and readable in full, with the court's seal or signature visible.",
    ],
  },
  israeliSpouseDeathCertificate: {
    required: [
      "It is an official death certificate: from the Israeli Population and Immigration Authority (a digitally signed or manually signed certificate), or from a civil registry abroad.",
      "From abroad: it carries an apostille or consular legalization from the country that issued it, in the same file. An Israeli one needs no certification.",
      "From abroad: if it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "If the Israeli partner was widowed more than once, there's a death certificate for each of those marriages.",
      "It is the full document, readable, with the issuing office's seal or signature visible.",
    ],
  },
  foreignPoliceCertificate: {
    required: [
      "It is an official criminal record certificate (a police certificate, or a certificate of no criminal record) from the national authority of the country this item is for, as in the document's details.",
      "It was issued in the last 6 months, counted from today.",
      "It carries an apostille or consular legalization from that country, in the same file.",
      "If it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
      "If the translation was made abroad, by a notary there, it carries its own apostille or legalization from that country: a translation made in Israel needs none.",
    ],
    recommended: [
      "It is a paper original, not a certificate printed at home from an online service.",
      "If the file says the foreign partner's name changed, it covers their former names too.",
      "If it lists a conviction, the court's sentence is uploaded with it: the office asks for it.",
      "It is the original document scanned in full, readable, with the issuing authority's seal or signature visible.",
    ],
  },
  housingContract: {
    required: [
      "It is a lease of a home, or a purchase contract of a home. A lease names both partners as the tenants; a purchase contract is for a home in Israel.",
      "It is the whole contract, with all its appendices, not only the first or the signature page.",
      "It is signed by the parties.",
      "If it isn't in Hebrew, Arabic or English (a lease from abroad), a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "A lease is current, or covers the last 12 months, the period the center of life is proven for.",
      "It is scanned in full, readable, page by page in order.",
    ],
  },
  israeliHousingContract: {
    required: [
      "It is a lease of a home in Israel, or a purchase contract of a home in Israel. Or, if the Israeli partner lives in a home that isn't theirs (their family's, say): a signed letter from the owners saying they own or rent the home, support the relationship and invite both partners to live there long-term, with copies of the owners' Teudat Zehut and appendix, and proof of the home (a land registry extract, a purchase contract or the owners' lease).",
      "A lease or purchase contract is the whole contract, with all its appendices, not only the first or the signature page, and it is signed by the parties.",
    ],
    recommended: [
      "A lease is current, or covers the last 12 months, the period the center of life is proven for.",
      "For a home that isn't the Israeli partner's: recent bills in the owners' names, and mail, bank statements or phone bills addressed to the Israeli partner at that address, are uploaded too.",
      "It is scanned in full, readable, page by page in order.",
    ],
  },
  utilityBills: {
    required: [
      "They are household bills of a home, from the provider: electricity, water, arnona (municipal tax), phone, or any other bill of the home, such as gas, internet, TV or vaad bayit (building committee).",
      "Each shows the home's address and the billing period.",
      "They're in the landlord's name or the Israeli partner's. For a home abroad: in both partners' names, or the Israeli partner's.",
      "If they aren't in Hebrew, Arabic or English (bills from abroad), a notarized translation is uploaded with them. English documents need no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "There are at least 3 types of household bills.",
      "For a home abroad, they're in both partners' names.",
      "Together they cover the last 12 months, ending recently, with no month missing.",
      "Each bill is readable in full, with the provider's name visible.",
    ],
    maxPages: BILLS_PAGES,
  },
  israeliUtilityBills: {
    required: [
      "They are household bills of a home in Israel, from the provider: electricity, water, arnona (municipal tax), phone, or any other bill of the home, such as gas, internet, TV or vaad bayit (building committee).",
      "Each shows the home's address and the billing period.",
      "They're in one person's name: the Israeli partner's, or, for a home that isn't theirs (their family's, say), the owners'.",
    ],
    recommended: [
      "There are at least 3 types of household bills.",
      "Together they cover the last 12 months, ending recently, with no month missing.",
      "Each bill is readable in full, with the provider's name visible.",
    ],
    maxPages: BILLS_PAGES,
  },
  governmentServices: {
    required: [
      "It is an official confirmation from an Israeli government institution about a service received in Israel, by either partner or both: one partner's confirmation alone is fine. For example, National Insurance's confirmation of insurance periods, a health fund membership confirmation, a confirmation from an educational institution, a Tax Authority document such as the annual tax report, a driver's license or vehicle license, or a confirmation of unemployment benefits.",
      "It is the full document, readable, with the institution's name and the date it was issued.",
    ],
    recommended: [
      "What it confirms covers the last 12 months, the period the center of life is proven for.",
      "It was issued recently, in the last few months.",
    ],
  },
  foreignHealthInsurance: {
    required: [
      "It is a health insurance policy, or an insurer's confirmation of coverage, for one person: from an Israeli health fund or insurance company (a plan for non-residents, a partner's plan, or a foreign worker's policy through an employer), or a policy from abroad.",
      "It covers medical treatment in Israel.",
      "It names the insurer and the coverage period, and the period hasn't ended: it's valid today, or starts in the future.",
      "If it isn't in Hebrew, Arabic or English (a policy from abroad), a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "It's a health plan, not only emergency or accident cover.",
      "It covers at least the coming months, not only a few weeks.",
      "It is the full policy or confirmation, readable, with the insurer's name visible.",
    ],
  },
  ishurToshav: {
    required: [
      "It is an official confirmation from an Israeli municipality or local council that the partner or partners live in, or have their center of life in, its locality. From a small local council or a kibbutz, a confirmation of registration in the kibbutz's books (אישור על רישום בספרי הקיבוץ) counts too. Or, if neither partner is registered for arnona, so the municipality can't issue it: a short letter explaining why, with the landlord's confirmation that the arnona for the home is in their name.",
      "A municipality's or council's confirmation is on its letterhead or official form, with its stamp or signature, and the date it was issued.",
      "An arnona bill, or any other bill, on its own is an issue: it shows payment for a property, not that they live there, and doesn't replace the confirmation.",
    ],
    recommended: [
      "It was issued recently, in the last few months.",
      "It states the address in the locality.",
    ],
  },
  sharedBankAccount: {
    required: [
      "It is a bank's confirmation of a joint account, naming two account holders, or a statement of a joint account. If the couple has no joint account: other proof that they share their money, such as transfers to each other, card statements with household purchases or deliveries to the same address, or receipts for large shared expenses.",
      "A bank confirmation or statement shows the bank's name and the account number, readably.",
      "If it isn't in Hebrew, Arabic or English (an account abroad), a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "It was issued recently, in the last few months.",
      "A recent statement shows the account is in use, not only that it exists.",
      "Without a joint account, there are several kinds of proof, covering a period of time, not a single transfer.",
    ],
  },
  bankStatements: {
    required: [
      "They are bank statements: of a shared account, or of each partner's personal account.",
      "They show the balance and all the incoming and outgoing transactions, not a summary.",
      "Proof of account ownership is uploaded with them: a bank confirmation of who holds each account.",
      "If they aren't in Hebrew, Arabic or English (an account abroad), a notarized translation is uploaded with them. English documents need no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "They cover the full last 12 months, ending recently: the period differs between branches, and 12 months covers them all.",
      "The bank's name and the account number are visible on each statement.",
    ],
  },
  israeliIncomeProof: {
    required: [
      "It is one of these: payslips; or, for the self-employed, an accountant's confirmation of the income reported for the last year, the latest annual tax assessment (שומה), or the confirmation of opening a business file (עוסק מורשה או עוסק פטור); or, for any other income (a scholarship, a National Insurance allowance such as disability, a pension, or similar), a confirmation from whoever pays it, or bank statements showing the deposits; or, for someone with no income, a signed letter explaining their situation. A shuma for an employee is an issue: it's only for the self-employed.",
      "Payslips: at least the last 3 months, and the latest is from one of the last 2 months, counted from today. Each shows the employer, the month and the pay, readably.",
      "An accountant's confirmation: it is signed by the accountant, and states the income reported for the last year. A confirmation of current or expected income only is an issue.",
      "A confirmation of other income: it is from whoever pays it (for example a university or National Insurance), signed or stamped, and shows the amounts and the months paid. The income is current: the latest payment shown is from one of the last 3 months, counted from today, or it states the payments continue. Income that ended earlier is an issue.",
      "A letter for someone not working and with no income: it is signed, explains their situation (for example, a student, between jobs, or a homemaker), and states that the foreign partner financially supports their shared life in Israel.",
      "If it isn't in Hebrew, Arabic or English (an Israeli partner working for a business abroad), a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "Payslips: the last 12 months, with no month missing. Offices ask for 12 in most cases, though the official requirement is 3.",
      "Bank statements: they cover several recent months, and the deposits are easy to see.",
      "A no-income letter comes with proof that one of them can support their life in Israel: a savings account, bank statements, or similar. The other partner's own income documents can show it instead.",
      "It is scanned straight and readable in full, with nothing cut off at the edges.",
    ],
  },
  foreignIncomeProof: {
    required: [
      "It is one of these: payslips; or, for the self-employed, an accountant's confirmation of the income reported for the last year, the latest annual tax assessment (shuma), or the confirmation of opening a business file (עוסק מורשה או פטור); or, for any other income (a scholarship, a National Insurance allowance such as disability, a pension, or similar), a confirmation from whoever pays it, or bank statements showing the deposits; or, for someone with no income, a signed letter explaining their situation. A shuma for an employee is an issue: it's only for the self-employed.",
      "Payslips: at least the last 3 months, and the latest is from one of the last 2 months, counted from today. Each shows the employer, the month and the pay, readably.",
      "An accountant's confirmation: it is signed by the accountant, and states the income reported for the last year. A confirmation of current or expected income only is an issue.",
      "A confirmation of other income: it is from whoever pays it (for example a university or National Insurance), signed or stamped, and shows the amounts and the months paid. The income is current: the latest payment shown is from one of the last 3 months, counted from today, or it states the payments continue. Income that ended earlier is an issue.",
      "A letter for someone not working and with no income: it is signed, explains their situation (for example, a student, between jobs, or a homemaker), and states that the Israeli partner financially supports their shared life in Israel.",
      "If it isn't in Hebrew, Arabic or English, a notarized translation is uploaded with it. An English document needs no translation: offices accept English in practice, and ask for one if they don't.",
    ],
    recommended: [
      "Payslips: the last 12 months, with no month missing. Offices ask for 12 in most cases, though the official requirement is 3.",
      "Bank statements: they cover several recent months, and the deposits are easy to see.",
      "A no-income letter comes with proof that one of them can support their life in Israel: a savings account, bank statements, or similar. The other partner's own income documents can show it instead.",
      "It is scanned straight and readable in full, with nothing cut off at the edges.",
    ],
  },
  childrenSchoolRecords: "notYet",
  childBirthCertificate: "notYet",
  childPassport: "notYet",
  childPoliceCertificate: "notYet",
  otherParentConsent: "notYet",
  otherParentAddress: "notYet",
  custodyOrder: "notYet",
  otherParentDeathCertificate: "notYet",
} satisfies Record<DocumentId, DocumentCheck | ((points: readonly Point[]) => DocumentCheck) | "notYet">;

type Entry = DocumentCheck | ((points: readonly Point[]) => DocumentCheck) | "notYet" | undefined;

/**
 * How to check a list item (`id` or `id:country`), following renames, with
 * what it has to show by the case (its `points`); null when there's no check
 * for it yet.
 */
export function checkFor(documentKey: string, points: readonly Point[] = []): DocumentCheck | null {
  const [saved] = documentKey.split(":");
  const id = DOCUMENT_ALIASES[saved] ?? saved;
  const check = (checks as Record<string, Entry>)[id];
  if (!check || check === "notYet") return null;
  return typeof check === "function" ? check(points) : check;
}
