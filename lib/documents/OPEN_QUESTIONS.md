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

## Not modelled yet

- **Cases where the chat should advise a lawyer.** The chat prompt
  (`lib/chat/prompt.ts`) names only some of them: a refusal, staying without
  a valid visa, a criminal record, custody disputes. Still to add:
  - Previous applications that were refused (דחיית בקשות קודמות).
  - A criminal or security record (עבר פלילי או ביטחוני).
  - A stay in Israel without legal status (שהייה בלתי חוקית בישראל).
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
