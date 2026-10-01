# Document catalog changelog

Every change to what any couple's document list contains, newest first. The
version is `CATALOG_VERSION` in `catalog.ts`; the format is in `CLAUDE.md`.

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
