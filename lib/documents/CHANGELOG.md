# Document catalog changelog

Every change to what any couple's document list contains, newest first. The
version is `CATALOG_VERSION` in `catalog.ts`; the format is in `CLAUDE.md`.

## v30 — 2026-10-04

**What changed:** `foreignBirthCertificate` items now carry the foreign
partner's country of birth, and its description names it ("The original,
from where they were born: United States."). The document check's details
now include "For the country" for it.

**Why:** The page, the chat and the check said "the country of birth"
without naming it, though the case knows it.

**Source:** Product decision; 5.2.0008 §ד.2.ה, as before.

**Lists that changed:** None: same keys; every list's birth certificate item gains its country.

## v29 — 2026-10-03

**What changed:** `israeliAffidavitMarried`, `foreignAffidavitMarried` and
`landlordAffidavit` are merged into `statusApplicationMarried` (form AS/6),
and their ids now alias to it. Its card lists the form's parts as points: the
application, the Israeli partner's declaration, the foreign partner's
declaration (not needed yet for a foreign partner abroad while the Israeli
partner files from Israel; couples both abroad file it together),
and the landlord's affidavit, under the landlord affidavit's old condition
(living together, or the Israeli partner in Israel). Its check has a part for
each point, and each finding names its part; nothing in the landlord's part
is required. The three guides are merged into the form's guide.

**Why:** Couples get the declarations as pages of the same form, and upload
it all as one PDF. One item, with its parts listed and checked part by part,
fits how they file it.

**Source:** Product decision; AS/6 and 5.2.0008 §ד.2.א, §ד.2.ז, as before.

**Lists that changed:** Every married scenario: -israeliAffidavitMarried
-foreignAffidavitMarried -landlordAffidavit, except neverLivedTogetherBothAbroad
(no landlord's affidavit before either): -israeliAffidavitMarried
-foreignAffidavitMarried.

## v28 — 2026-10-02

**What changed:** `foreignChildrenAffidavit` is merged into
`foreignCivilStatus`, now "Civil status and children", and its id is
retired. Each item of `foreignCivilStatus` lists what it has to show, by the
case (new `points.ts`): the status now, by what the foreign partner's
previous marriages make them (single, divorced, widowed), or for a married
couple their status now; for a married couple, their status before the
marriage; and their children, or that they have none. Before the marriage and
the children are on the nationality's item only. New fact
`foreignHasChildren`. New scenario `commonLawForeignDivorced`.

**Why:** One document can show several of these (a single affidavit can
declare the status now, before the marriage and the children), and which
documents a country issues varies. One item with one upload, a list of what
it has to show, and a check of all its files together fits every way of
splitting them.

**Source:** Product decision.

**Lists that changed:** Every scenario: -foreignChildrenAffidavit. New
scenario commonLawForeignDivorced.

## v27 — 2026-10-02

**What changed:** New `messageHistory`: up to 10 pages of the couple's
messages or call logs, for every couple. New `foreignHealthInsurance`: the
foreign partner's health insurance in Israel, for every couple.
`foreignCivilStatus` is now one item per country, like the police
certificate (`each: "policeCountry"`, issued by that country): the
nationality, then every other country on the police list. The onboarding
question behind that list now asks for countries lived in for 6 months or
more in a row from age 14, and other countries of citizenship.

**Why:** Offices ask for the message history and for proof of health
insurance (a B/1 holder has no public health insurance). In practice they ask
for a civil-status document from every country they ask a police certificate
from. The procedures ask for a police certificate from another country only
after 6 months in a row there (since January 2024), and offices ask for one
from every country of citizenship.

**Source:** Practice, confirmed by the product owner; AIC's list of
documents for the application and its guide to the official certificates;
procedures 5.2.0008 and 5.2.0009 (January 2024 update, as AIC reports it).

**Lists that changed:** Every scenario: +messageHistory
+foreignHealthInsurance, and -foreignCivilStatus +foreignCivilStatus:<country>
for each police country (livedInThreeCountries: FR, GB, TH, IN).

## v26 — 2026-10-02

**What changed:** New `foreignChildrenAffidavit`: the foreign partner's
affidavit about their children from before the marriage or a previous
marriage, and their guardianship, signed in front of a lawyer. For every
couple: without children, it states that.

**Why:** Asked for in practice, of every foreign partner.

**Source:** Practice, confirmed by the product owner.

**Lists that changed:** Every scenario: +foreignChildrenAffidavit.

## v25 — 2026-10-02

**What changed:** Removed `statusApplicationCommonLaw`, and retired its id.
The bills are split in two, like the lease: `utilityBills` is the couple's,
for couples who live, or lived, together (`livingTogether`). New
`israeliUtilityBills`: the Israeli partner's own home, in their name, for
couples who never lived together while the Israeli partner lives in Israel.

**Why:** The common-law application duplicated the forms common-law couples
file (AS/3 in Israel, AS/1 from abroad), and named no form of its own. The
bills of the shared home are the couple's; the Israeli partner's own home
is theirs, in their name, in Hebrew. A couple who never lived together, with
both abroad, has neither.

**Source:** Product decision.

**Lists that changed:** commonLawLivingTogether, commonLawApart:
-statusApplicationCommonLaw. commonLawApart, marriedNeverLivedTogether:
-utilityBills +israeliUtilityBills. neverLivedTogetherBothAbroad:
-utilityBills.

## v24 — 2026-10-02

**What changed:** New `visaChangeApplication` (AS/3, the application to
change the visa category), for a foreign partner already in Israel
(`foreignInIsrael`).

**Why:** Verified by the product owner: AS/1 only from abroad, AS/3 only in
Israel, AS/6 only for married couples. AS/1 and AS/6 already matched; AS/3
was missing. MR/6 isn't a document on the list: the office hands it to you
when you register the marriage, and you sign it there.

**Source:** Practice, confirmed by the product owner; form AS/3.

**Lists that changed:** Every scenario with the foreign partner in Israel:
+visaChangeApplication.

## v23 — 2026-10-02

**What changed:** The security check (`foreignNeedsSecurityCheck`, and with
it `securityCv`) is now for Palestinian residents and citizens of Arab
countries only, by nationality: Russia and Ukraine are out of
`SECURITY_CHECK`, and the country of birth no longer counts. New scenario:
`fromJordan`.

**Why:** A mistake: the security screening CV isn't related to the former
USSR, whose partners go through Nativ instead.

**Source:** Practice, confirmed by the product owner.

**Lists that changed:** fromUkraine, bornInUSSRWithGermanNationality:
-securityCv. fromJordan: new scenario.

## v22 — 2026-10-02

**What changed:** Renamed `sharedFinances` → `sharedBankAccount` (no alias:
there are no real users yet), and it's listed for married couples only
(`married`). New `bankStatements`, for common-law couples (`commonLaw`): the
statements of a shared account, or of each partner's personal account, for
12 months, with the balance, all transactions and proof of ownership.

**Why:** The joint bank account confirmation is part of form AS/6, which
only married couples file; the name now says what it is. Common-law couples
prove shared finances with bank statements instead.

**Source:** Practice, confirmed by the product owner; the AS/6 checklist.

**Lists that changed:** Every married scenario: +sharedBankAccount
-sharedFinances. commonLawLivingTogether, commonLawApart: +bankStatements
-sharedFinances.

## v21 — 2026-10-02

**What changed:** `recommendationLetters` no longer may need a translation
(`mayNeedTranslation: false`).

**Why:** The letters come from Israeli family and friends, in Hebrew.

**Source:** Practice, confirmed by the product owner.

**Lists that changed:** No scenario gained or lost a document; in every
scenario, recommendationLetters lost `mayNeedTranslation`.

## v20 — 2026-10-02

**What changed:** `jointLivingEvidence` is listed for every couple who live,
or lived, together (`livingTogether`), married or common-law; before, only
for common-law couples. Its source is now 5.2.0008 §ד.2.ח and practice, and
it's verified. `landlordAffidavit` is listed for married couples only
(`{ all: [married, { any: [livingTogether, israeliInIsrael] }] }`).

**Why:** Evidence of living together is the proof of the claim that you live
together, whoever makes it, not extra proof for common-law couples. The
landlord's affidavit is part of form AS/6, which only married couples file.

**Source:** Practice, confirmed by the product owner; 5.2.0008 §ד.2.ח.

**Lists that changed:** Every married scenario that lives together
(marriedInCyprus, marriedInIsrael, marriedOnline, marriedInEgypt,
foreignFirst, bornInUSSRWithGermanNationality, fromUkraine,
livedInThreeCountries, foreignAbroad, foreignWithoutVisa,
foreignNameChanged, bothPreviouslyMarried, permanentResident, bothAbroad,
childrenStayingBehind, childrenMovingWithConsent, childrenMovingMixed,
childrenTogether): +jointLivingEvidence. commonLawLivingTogether,
commonLawApart: -landlordAffidavit.

## v19 — 2026-10-02

**What changed:** `governmentServices` is listed only when at least one of
the partners lives in Israel (`{ any: [israeliInIsrael, foreignInIsrael] }`),
no longer for every couple.

**Why:** It proves services received in Israel: a couple who both live
abroad has none to show.

**Source:** Practice, confirmed by the product owner.

**Lists that changed:** bothAbroad, neverLivedTogetherBothAbroad:
-governmentServices.

## v18 — 2026-10-02

**What changed:** Removed `foreignStayExplanation` (the letter explaining a
stay in Israel without a valid visa); its id is retired. Onboarding still
asks whether the foreign partner is in Israel without a valid visa, and now
shows a notice recommending a lawyer.

**Why:** No procedure or form asks for the letter. A stay without a valid
visa is a complicated case for a lawyer who handles partner visas, and a
self-written letter about it can hurt the case (`lib/knowledge/first-appointment.md`).

**Source:** Product decision; procedure 5.2.0008 §ג.12 and §ה.2.

**Lists that changed:** foreignWithoutVisa: -foreignStayExplanation.

## v17 — 2026-10-02

**What changed:** `israeliIncomeProof` may now need a translation
(`mayNeedTranslation: true`).

**Why:** An Israeli partner who lives abroad and works for a business
outside Israel brings payslips in another language.

**Source:** Practice, confirmed by the product owner.

**Lists that changed:** No scenario gained or lost a document; in every
scenario, israeliIncomeProof gained `mayNeedTranslation`.

## v16 — 2026-10-01

**What changed:** `entryPermitApplication` (AS/1) is listed only when the
foreign partner is abroad and the Israeli partner lives in Israel
(`{ all: [foreignAbroad, israeliInIsrael] }`), no longer for every foreign
partner abroad.

**Why:** A couple who both live abroad asks for the entry permit at the
Israeli consulate before they come, and files with Misrad Hapnim after they
arrive (`lib/knowledge/both-abroad.md`). The app covers the Misrad Hapnim
file only, not the consulate.

**Source:** Practice, confirmed by the product owner.

**Lists that changed:** bothAbroad, neverLivedTogetherBothAbroad:
-entryPermitApplication.

## v15 — 2026-10-01

**What changed:** The lease is split in two. `housingContract` is now the
couple's, in both their names, for couples who live or lived together.
New `israeliHousingContract`: the Israeli partner's own home, in their
name, for couples who never lived together while the Israeli partner lives
in Israel.

**Why:** Whose names are on the contract, and so whose document it is,
depends on whether the couple lives together.

**Source:** Practice, confirmed by the product owner.

**Lists that changed:** commonLawApart, marriedNeverLivedTogether:
-housingContract +israeliHousingContract. In every other scenario that
lists it, housingContract moved from the Israeli partner to the couple.

## v14 — 2026-10-01

**What changed:** `housingContract` and `landlordAffidavit` are listed for
couples who live, or lived, together (`livingTogether`), or whose Israeli
partner lives in Israel (`israeliInIsrael`, new): only a couple who never
lived together while the Israeli partner lives abroad goes without them.
Every couple is now asked whether they live or lived together, married or
not; before, only common-law couples were. The Israeli side's "lived outside
Israel in recent years?" became "where do you live now?"
(`israeliLivedAbroad` → `israeliInIsrael` / `israeliAbroad`).
`housingContract` and `utilityBills` may now need a translation: a couple
who lived together abroad brings them from the home they shared there. New
scenarios: `bothAbroad`, `marriedNeverLivedTogether`,
`neverLivedTogetherBothAbroad`; `israeliLivedAbroad` removed with its
question.

**Why:** An Israeli partner who lives in Israel shows their home there even
if the couple never lived together. A couple with no home in Israel to show
proves the relationship in other ways (`lib/knowledge/documents.md`).

**Source:** Practice, confirmed by the product owner.

**Lists that changed:** bothAbroad, marriedNeverLivedTogether,
neverLivedTogetherBothAbroad: new scenarios. israeliLivedAbroad: scenario
removed. No existing scenario gained or lost a document; in every scenario
that lists them, housingContract and utilityBills gained
`mayNeedTranslation`.

## v13 — 2026-10-01

**What changed:** Renamed the affidavits by who they're for, following
`statusApplicationMarried` / `statusApplicationCommonLaw`:
`israeliAffidavit` → `israeliAffidavitMarried`, `foreignAffidavit` →
`foreignAffidavitMarried`, `commonLawAffidavit` → `affidavitCommonLaw`. No
aliases: there are no real users yet, so nothing saved under the old ids is
kept.

**Why:** Since v11 the AS/6 affidavits are for married couples only; the
names didn't say so.

**Source:** Product decision.

**Lists that changed:** Every married scenario: +israeliAffidavitMarried
+foreignAffidavitMarried -israeliAffidavit -foreignAffidavit. commonLawLivingTogether,
commonLawApart: +affidavitCommonLaw -commonLawAffidavit.

## v12 — 2026-10-01

**What changed:** New `signAtAppointment` field, set on `commonLawAffidavit`:
the page tells the couple to print it and fill in the details, but not to
sign it before the appointment, nor send it with the online application.
It's signed in front of the clerk at the appointment.

**Why:** That's how the common-law affidavit is signed in practice: the clerk
confirms the signatures at the office.

**Source:** Practice, confirmed by the product owner; the form's office
confirmation section (5.2.0009_a).

**Lists that changed:** No scenario gained or lost a document; every item
gained `signAtAppointment`.

## v11 — 2026-10-01

**What changed:** Added `commonLawAffidavit` for common-law couples: one
declaration both partners sign together. `israeliAffidavit` and
`foreignAffidavit` are now for married couples only (`when: "married"`).

**Why:** Common-law couples don't sign the AS/6 affidavits. Procedure
5.2.0009 has its own affidavit, signed by both partners and confirmed at a
Misrad Hapnim office.

**Source:** Procedure 5.2.0009, the affidavit form (5.2.0009_a,
https://www.gov.il/BlobFolder/generalpage/visas_forms/he/5.2.0009_a.pdf).

**Lists that changed:** commonLawLivingTogether, commonLawApart:
+commonLawAffidavit -israeliAffidavit -foreignAffidavit.

## v10 — 2026-09-28

**What changed:** Added `landlordAffidavit` for every couple, marked with the
new `optional` field: listed for everyone, but only needed by couples who
rent, which onboarding doesn't ask. Optional documents don't count as missing
on the documents page until they're uploaded.

**Why:** Form AS/6 includes a landlord's affidavit for couples who rent.

**Source:** Form AS/6, page 6 (affidavit annexed to the lease – couples).

**Lists that changed:** Every scenario: +landlordAffidavit. Every item gained
`optional`.

## v9 — 2026-09-28

**What changed:** `relationshipEvidence` (shown as "Shared photos of you")
no longer may need a translation.

**Why:** It's photos of the couple, with nothing to translate.

**Source:** Product decision.

**Lists that changed:** No scenario gained or lost a document;
`relationshipEvidence` no longer offers a translation upload.

## v8 — 2026-09-28

**What changed:** `mayNeedTranslation` is false for the letters the couple
writes for the application: `relationshipStory` and
`foreignStayExplanation`. Confirmed false for the Israeli partner's
documents, lease and bills (no change).

**Why:** These are written for the application, in Hebrew or English.

**Source:** Product decision.

**Lists that changed:** No scenario gained or lost a document;
`relationshipStory` and `foreignStayExplanation` no longer may need a
translation.

## v7 — 2026-09-28

**What changed:** `mayNeedTranslation` is now set on every document in the
catalog, instead of being worked out from the issuer. True for 23 documents:
certificates and records that can come from anywhere, and letters and
evidence the couple may have in another language (the relationship letter,
recommendation letters, relationship evidence, shared finances, the foreign
partner's income proof). False for the 18 others: forms and affidavits in the
ministry's wording, Israeli documents and records, photos and passports.

**Why:** A document's language doesn't follow from where it's issued, and
many documents can be issued anywhere.

**Source:** Product decision.

**Lists that changed:** No scenario gained or lost a document.
`mayNeedTranslation` became true for `relationshipStory`,
`foreignStayExplanation`, `relationshipEvidence`, `recommendationLetters`,
`jointLivingEvidence`, `sharedFinances` and `foreignIncomeProof`, which have
no issuer and were false in v6. Every other document kept its value.

## v6 — 2026-09-28

**What changed:** `files` (v5) is replaced by a `mayNeedTranslation` boolean on
each item, and `translation` moved out of `certification` into it, so the
same fact isn't stored twice. Same meaning: true for every document not
issued in Israel.

**Why:** A clearer name for the one thing the page needs; the list of file
slots added nothing.

**Source:** Product decision.

**Lists that changed:** No scenario gained or lost a document; every item's
fields changed as above.

## v5 — 2026-09-28

**What changed:** Each list item now says which files it takes (`files`):
the original, plus an optional translation on every document that may be
issued abroad (where `certification.translation` is true).

**Why:** The first version of translations is simple: no language rules or
questions. The couple uploads a translation when their document needs one.
Translations aren't required, since English documents are usually accepted.

**Source:** Product decision.

**Lists that changed:** No scenario gained or lost a document; every item
gained `files`.

## v4 — 2026-09-28

**What changed:** An online (Utah) marriage certificate is now marked as
possibly needing a translation (`translation: true`), like every other
document from abroad. New constants in `certification.ts`: the languages
accepted without a translation (Hebrew and Arabic), and that English is
usually accepted in practice.

**Why:** By law, Misrad Hapnim accepts only Hebrew and Arabic without a
translation. English is usually accepted in practice, depending on the
clerk, but isn't guaranteed. The catalog had assumed English was always
accepted.

**Source:** The law, as stated by the product owner; practice for English
and for translations not needing an apostille.

**Lists that changed:** No scenario gained or lost a document.
`marriedOnline`: the marriage certificate's certification changed
(translation may be needed).

## v3 — 2026-09-28

**What changed:** `otherParentConsent` is back, next to `otherParentAddress`:
the couple brings a signed consent letter from the other parent, and the
ministry also contacts that parent itself. The v2 alias from
`otherParentConsent` to `otherParentAddress` is removed, since the id again
means the same document it meant in v1.

**Why:** Both are needed in practice; v2 read the procedure as replacing the
consent with the ministry's own contact.

**Source:** Practice, confirmed by the product owner; procedure 5.2.0008
(edition 16) §ה.2(9) for the ministry's contact.

**Lists that changed:**

- `childrenMovingWithConsent`: +otherParentConsent

## v2 — 2026-09-28

**What changed:**

- Added, for every couple: passport photos of the Israeli partner (3 copies),
  letters of recommendation, and the center-of-life documents: lease or
  purchase contract, bills, government services, Ishur Toshav, shared
  finances, and employment or income proof for each partner (6 payslips).
- Added `securityCv` for foreign partners from countries that need a
  security check (new fact `foreignNeedsSecurityCheck`, list in
  `countries.ts`), `childPoliceCertificate` (children 14 and older), and
  `childrenSchoolRecords` (children in the household, from age 6).
- `foreignCivilStatus` is now needed by every couple, including those
  married in Israel.
- `otherParentConsent` became `otherParentAddress`: the ministry writes to
  the other parent itself. Fact `otherParentConsents` became
  `otherParentInvolved`.
- `foreignEntryVisa` merged into `foreignPassport` (visa pages and stamps).
- Removed `feeReceipt` (not a document) and `centerOfLifeEvidence` (split
  into the documents above, for everyone).
- New `copies` (display only): 3 for photos, 2 for civil status documents
  and birth certificates.
- Former-USSR birth certificates issued up to 1998 need no authentication.
  `foreignFromFormerUSSR` now comes from nationality or birth only.
- Descriptions corrected: affidavits signed in front of a lawyer, passports
  valid 2 more years, civil status issued in the last 6 months, center-of-life
  proof for the last 12 months, sole custody needs proof the children live
  with the parent.

**Why:** Checked against the married-couples procedure and the AS/6
checklist, with corrections from practice.

**Source:** Procedure 5.2.0008 (edition 16, 2026-07-20) §ד.2, §ד.4, §ה.2(7),
§ה.2(9); the AS/6 checklist. 31 of 40 documents are verified. Still
unverified: the common-law documents (procedure 5.2.0009 not checked yet),
`foreignStayExplanation`, `jointChildrenBirthCertificates`, the Israeli
partner's divorce and death certificates, police certificates from
countries lived in, `childrenSchoolRecords`, `otherParentDeathCertificate`.

**Lists that changed:** Every scenario gained `israeliPhotos`,
`recommendationLetters` and the 7 center-of-life documents, and lost
`feeReceipt`. Every scenario with the foreign partner in Israel lost
`foreignEntryVisa`. Also:

- `marriedInIsrael`: +foreignCivilStatus
- `bornInUSSRWithGermanNationality`: +securityCv
- `fromUkraine`: new scenario
- `permanentResident`, `israeliLivedAbroad`: -centerOfLifeEvidence
- `childrenMovingWithConsent`: +childrenSchoolRecords +childPoliceCertificate
  +otherParentAddress -otherParentConsent
- `childrenMovingMixed`: +childrenSchoolRecords +childPoliceCertificate
- `childrenTogether`: +childrenSchoolRecords

## v1 — 2026-09-28

**What changed:** The first catalog: 31 documents for the first application in
the graduated procedure (married and common-law), with the facts, the country
lists and the certification rules.

**Why:** The document list is built from the onboarding answers.

**Source:** Written from general knowledge of procedures 5.2.0008 (married) and
5.2.0009 (common-law), and forms AS/1 and AS/6. No entry is verified yet
(`verified: false` on every document), and the Apostille Convention list in
`countries.ts` still needs checking against the HCCH status table.

**Lists that changed:** All: every scenario is new.
