# Open questions about the catalog

What isn't verified or modelled yet. Internal: not part of the knowledge base
shown to users (`lib/knowledge/`).

## Not verified in the catalog

- The common-law documents: the evidence of living together (procedure
  5.2.0009 not checked).
- Police certificates from **other countries lived in**: the rule (6 months in
  a row, not before 14) is from AIC's reading of the January 2024 procedures,
  not checked against the procedure text. Also from AIC, not the procedures:
  a police certificate from every country of citizenship, and a civil-status
  document from every country on the police list.
- The couple's children together: their birth certificates.
- The Israeli partner's previous spouse's death certificate.
- School records: whose children (current reading in `lib/knowledge/children.md`).
- The other parent's death certificate.
- The Apostille Convention country list.
- Whether the security-check country list is complete.
- **Health insurance for the foreign partner.** In the catalog for every
  couple (v27), as practice: the product owner's case, and AIC's list of
  documents PIBA may ask for. Neither procedure 5.2.0008 nor the AS/6
  checklist mentions it (5.2.0008 §ד.3 lets the clerk ask for any other
  document). Unknown: whether it's always asked for, at which stage (a
  partner abroad has no policy in Israel yet), and what period it has to
  cover.
- **Sole custody or sole guardianship?** Without the other parent's consent,
  procedure 5.2.0008 §ה.2(9)י asks for a ruling of sole **custody**
  (משמורת בלעדית) with proof the child lives with the parent. Form AS/6
  (in the application, under the children coming along) asks for sole **guardianship** (אפוטרופסות בלעדית), from a court
  ruling or a court-approved divorce agreement. In Israeli law these differ:
  guardianship is the legal parental rights, custody is who the child lives
  with. Which one the office actually asks for is unknown; the knowledge
  base and the documents page say "custody or guardianship" until it's
  settled.

- A foreign partner who is self-employed abroad: what replaces the Israeli
  accountant's confirmation, tax assessment and business-file confirmation.

- **Evidence of living together (`jointLivingEvidence`) overlaps** with the
  lease, the bills and the joint bank account, which are documents of their
  own. Kept for now; it may be removed later because of the overlap.

- **Legalization chains** (`LEGALIZATION` in `countries.ts`): none checked
  by a person yet. Thailand's, from procedure 1.3.0001 §3.1.2.1, the Thai
  MFA's manual (March 2025) and the Israeli embassy in Bangkok's page (last
  updated June 2024). Unknown for Thailand: whether the MFA's sticker
  certifies the issuing official's signature or only the translation
  (1.3.0001 §2.1.5.4 asks for the first); whether a notary in
  Israel translates from Thai or from the legalized English translation; the
  Israeli embassy's fee (535 baht in 2024). A document already in English,
  like the police certificate, needs no English translation (product
  owner).

- **Cuba** (researched November 2026; `CU` in `LEGALIZATION` and the
  issuers). Canada as the third country is the product owner's; the
  Canadian steps (Global Affairs Canada, then the Israeli embassy in
  Canada) follow §3.1.3 as written, though §3.1.2.2 lets the Israeli consul
  in Canada certify Canadian signatures directly. Unknown:
  - Decided (product owner, November 2026): a clerk accepts a Cuban chain
    with no foreign-ministry signature, and the guides and steps say so.
    Why: Cuba falls under §3.1.3, whose first step is only "certified by
    the issuing country" (no ministry named; §3.1.1's justice-then-foreign-
    ministry order is for the usual chain); the Ministry of Justice's
    legalization is Cuba's only one since 3 Feb 2025 ("solo cambia quien
    actúa", Granma), and the Netherlands' official page and Spain's
    consulate take it in MINREX's place. No Israeli case found either way:
    revisit if a clerk asks for MINREX.
  - The Canadian embassy in Havana's own page (international.gc.ca, Havana
    info, read November 2026) offers authentication "to Canadian citizens
    and, in limited cases, to non-Canadian citizens if the documents are
    intended for use in Canada". Whether it does it for Cuban documents
    going to Israel is only the product owner's confirmation. Since Canada
    joined the Apostille Convention (11 Jan 2024), Global Affairs Canada
    can't apostille the embassy's certificate (art. 1(3)(a) excludes
    consular documents), so its step is a non-apostille authentication,
    then the Israeli embassy's legalization.
  - Whether certificates issued online through the Bienestar platform,
    which by Reglamento art. 273.2 skip the Ministry of Justice's "prior
    legalization", still need its single legalization before an embassy.
  - The police certificate for abroad: the Ministry of Justice says only
    the CJI branches handle it; April 2026 news says the collective law
    firms (ONBC). Res. 486/2025 lists the international law firms.
  - Stamp (sello) amounts and real waiting times.
  - Whether Ley 180's certificate of capacity to marry abroad is accepted
    as the civil status before a marriage.
  Recheck if Cuba joins the Apostille Convention (not on the HCCH table of
  30 June 2026).

- **Thailand joins the Apostille Convention on 28 February 2027** (accession
  lodged 30 June 2026; Thai MFA notices of 1 and 6 July 2026), unless a
  member state objects before then. Not in the guides yet: they hold no
  pending changes. In March 2027, check the HCCH status table for Israel,
  then rewrite the Thailand sections of the birth certificate, civil status
  and police certificate guides, and the `TH` entries in `countries.ts`
  (`APOSTILLE` and `LEGALIZATION`). Documents legalized before then should
  stay accepted.
- **Pregnancy** (`lib/knowledge/pregnancy.md`, 2026-10-18). Left out as
  unverified or thin: the airlines' pregnancy limits (week 28 / 36, a
  general rule with no Israeli source); offices asking for an ultrasound
  (one Facebook report); DNA samples given at a consulate; whether 5.2.0004
  (2005) was updated after HCJ 10533/04 (2011: a genetic test only as a last
  resort); how National Insurance handles a common-law partner on BL/303 in
  practice (the law covers her, §1 "אשתו"); whether months on a B/1 count
  for maternity pay under its "valid foreign worker visa" wording; how long
  a family-court paternity ruling takes; whether Tipat Halav funds tests for
  women without insurance; a father's paternity leave on a B/1;
  second-parent recognition for same-sex couples.

## Not modelled yet

- **Countries without an Israeli mission** (1.3.0001 §3.1.3): legalized
  through a third country's mission. Their steps show the general chain.
- **A document whose issuing country isn't known from onboarding**
  (`issuedBy: "unknown"`: divorce decrees, children's documents): its steps
  say "if it was issued abroad". Asking for the country per item would give
  it the full steps and a place in the plan's countries.

- **Cases where the chat should advise a lawyer.** The chat prompt
  (`lib/chat/prompt.ts`) names only some of them: a refusal, a criminal
  record, custody disputes. Still to add:
  - Previous applications that were refused (דחיית בקשות קודמות).
  - A criminal or security record (עבר פלילי או ביטחוני).
  - Minor children coming with the foreign partner (קטינים נלווים).
  - Previous relationships with a partner in Israel (קשרים זוגיים קודמים
    בישראל).
  - A past asylum application (בקשת מקלט בעבר).
  - A large age gap between the partners (פערי גיל משמעותיים).
  - A relatively short relationship (קשר קצר יחסית).
  - Significant contradictions between documents (סתירות משמעותיות
    במסמכים).
  - Difficulty getting documents from the country of origin (קושי בהשגת
    מסמכים ממדינת המוצא).

  Unknown: whether the chat only flags these when the user raises them, or
  onboarding should ask about them too.

- Anything extra for a permanent resident as the Israeli side (their own
  status, a longer period). Kept as it is for now (practice).
- The renewal stages.
- Screening for the excluded cases (the Palestinian territories, the listed
  countries, the Law of Return).
