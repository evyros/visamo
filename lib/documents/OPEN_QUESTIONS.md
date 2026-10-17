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

- **Thailand joins the Apostille Convention on 28 February 2027** (accession
  lodged 30 June 2026; Thai MFA notices of 1 and 6 July 2026), unless a
  member state objects before then. Not in the guides yet: they hold no
  pending changes. In March 2027, check the HCCH status table for Israel,
  then rewrite the Thailand sections of the birth certificate, civil status
  and police certificate guides, and the `TH` entries in `countries.ts`
  (`APOSTILLE` and `LEGALIZATION`). Documents legalized before then should
  stay accepted.

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
