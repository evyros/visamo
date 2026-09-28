# Document catalog changelog

Every change to what any couple's document list contains, newest first. The
version is `CATALOG_VERSION` in `catalog.ts`; the format is in `CLAUDE.md`.

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
