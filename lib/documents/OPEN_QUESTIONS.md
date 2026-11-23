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

- **Japan's police certificate is sealed.** It comes in an envelope
  addressed to the authority it's for, and opening it voids it (Osaka
  Prefectural Police, criminal record certificate FAQ). Unknown: how the
  apostille is added to a sealed certificate, whether Misrad Hapnim takes it
  sealed, and how the couple uploads it for the check without opening it.
- **The language of some countries' documents** isn't in their guides, so the
  translation step assumes the country's likely language (languages.ts):
  Turkmenistan's certificates (Turkmen assumed; the guide names them in
  Russian; a legalization agency says that since a 2004 presidential
  resolution, No. 6931, civil-status certificates are filled in Turkmen on a
  form whose labels are also in English, nothing official found), Nepal's
  police certificate (Nepali assumed; unofficial sources say it's in Nepali
  and English, nothing official found), and India's police certificate
  (English or Hindi assumed; nothing found).
- **Document languages still unconfirmed** (checked against official sources
  in November 2026; only unofficial or conflicting evidence found):
  - Kyrgyzstan: the marriage certificate is in Russian and Kyrgyz, and civil
    registry offices work in both; whether every birth certificate is
    bilingual, which would make the Russian route enough.
  - The police certificates of Belarus, Kazakhstan, Kyrgyzstan and Kosovo.
  - Peru's police certificate: a consulate says it issues it in Spanish and
    English under an agreement with the judiciary; whether every consulate
    does, and how it's apostilled for Israel.
  - Pakistan: whether NADRA and police character certificates always include
    English.
  - Tanzania: the birth certificate, civil status and police certificate.
  - Cameroon: whether bilingual forms are filled in English or French only.
  - Seychelles: whether certificates are in English, and whether Creole
    appears.
  - Malta: the certificates' headings are in Maltese and English; the entries
    may be in Maltese.
- **Multilingual certificates and convictions.** Germany's, Austria's,
  Denmark's, Sweden's, Switzerland's and Iceland's police certificates are in
  English (among other languages) only when they show no convictions;
  convictions are shown in the country's language. Unknown: whether Misrad
  Hapnim accepts these multilingual forms, and Switzerland's multilingual
  civil-status certificate, without a translation in practice.
- **Chile's civil status:** the civil registry lists an "informe de no
  matrimonio" (ChileAtiende), which may contradict the guide's line that it
  issues nothing to say so. Not checked.
- **China's notarial certificates come with an English translation.** For use
  abroad, a Chinese notary office binds an English translation into the
  certificate (公证书), with a certificate that it conforms to the Chinese
  original (US State Department guidance, as quoted by several sources).
  Chinese is a language notaries in Israel translate, so by the rule a
  translation made abroad will probably be rejected. Unknown: whether Misrad
  Hapnim accepts the notary office's English, like Thailand's foreign-ministry
  translation, or asks for a notarized translation from Israel.

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

- **Tanzania** (researched November 2026, from official pages; `TZ` in the
  issuers; `TZ` in `LEGALIZATION`, with `mission: "KE"`, unverified).
  Unknown:
  - Whether the procedure (1.3.0001) names the consul "in the country" or
    the one accredited to it; the chain follows the Israeli embassy in
    Nairobi's own pages. Other countries an Israeli embassy serves from
    elsewhere (Nairobi also serves Uganda, Malawi and the Seychelles) still
    get the general description, ending at "the Israeli embassy".
  - Whether the Nairobi embassy legalizes Tanzanian documents in practice
    (its authentication page doesn't name countries), and whether Misrad
    Hapnim accepts that. No Tanzanian case found yet.
  - Where the foreign ministry certifies: its 2018 announcement says Dodoma
    (Tuesdays and Thursdays, 15,000 shillings a copy); Belgium's embassy
    page (Feb 2025) says Dar es Salaam. The guides name neither.
  - Whether a married partner can still get a certificate of single status,
    and what shows the status before the marriage; whether RITA's
    certificate of no impediment (for marrying abroad, 300,000 shillings) is
    accepted in its place. Whether either can be had from abroad other than
    online (RITA's FAQ mentions sending the RGM form through an embassy).
  - Whether ZCSRA issues Zanzibar's single status certificate itself (the
    Tanzanian embassy names it as Zanzibar's registrar of marriages), and
    how Zanzibar documents are verified before the foreign ministry (the
    ministry's announcement names only RITA).
  - Denmark's embassy asks for supporting evidence for a newly re-issued
    Tanzanian birth certificate; whether Israeli offices do too.

- **Turkmenistan** (researched November 2026, from Turkmen official pages;
  `TM` in the issuers, no `LEGALIZATION` entry). Unknown:
  - Decided (product owner, November 2026): the guides and steps don't
    mention legalizing a notarized copy. Turkmenistan's MFA says documents
    are legalized "as a rule" as notarized copies (notary, Ministry of
    Adalat, MFA Consular Service Department, then the foreign mission), but
    the originals can all be had, so the guides only say it's legalized,
    ending at the Israeli embassy in Ashgabat. Searched November 2026: no
    Turkmen case in the Facebook group or on AIC, and no case of a
    legalized notarized copy from any country. Revisit if a clerk rejects
    a legalized copy, or a couple can't get the original legalized.
  - Whether the Israeli embassy in Ashgabat currently legalizes (Israeli
    missions suspended some consular services in 2025), its fee and
    whether it needs an appointment.
  - Who issues the certificate of marital status inside Turkmenistan (the
    official pages only cover asking for it through an embassy).
  - The police certificate inside Turkmenistan (MVD order No. 91 of
    26 July 2025) is from a law firm's summary, not the order's text.
  If the chain is confirmed, add `TM` to `LEGALIZATION`.

- **Nepal** (researched November 2026, quickly; `NP` in the issuers).
  Answered (November 2026): the Israeli embassy in Kathmandu takes
  legalizations only through VFS Kathmandu, with no visit to the embassy
  (its authentication page, updated 24 June 2024, and its consular page,
  updated 1 October 2024, which applies VFS to all foreigners); in the
  guides. VFS's own fees and hours aren't confirmed (its site blocks
  automated reading). Unknown: whether
  the police clearance certificate, issued online, is a digital document
  (1.3.0001 §4.3.3 wants an electronic apostille for one, and Nepal has
  none) or is printed and stamped for the foreign ministry; whether the
  ward office's certificates are in Nepali only, and if so whether a notary
  in Israel translates from Nepali or the double translation through
  English is needed; what a divorced or widowed Nepali shows for their
  status. The local verification before the foreign ministry is in the
  obtain step's text, not a link of the chain.

- **Argentina** (researched November 2026, from the foreign ministry's and
  the Colegio de Escribanos' pages; `AR` in the issuers). Every Argentine
  apostille has been a file with a digital signature since 2019, so the
  civil status (certificado de soltería), even on paper, comes with an
  apostille that's a file attached to a scan. Unknown: how Misrad Hapnim
  treats that (the guide says to bring the paper certificate too); whether
  the certificate of single status from one province is enough for someone
  who lived in several. The marriage certificate (no `AR` entry): one couple
  (August 2026) says the office refused their Argentine marriage documents,
  asking for the judge's name on the apostille and the "original" marriage
  certificate; not understood yet.

- **Peru** (researched November 2026, quickly; `PE` in the issuers).
  Unknown: whether Misrad Hapnim asks only for the Poder Judicial's
  criminal record, or also for the police's (antecedentes policiales) or
  the INPE's (antecedentes judiciales), which IRCC asks foreigners for;
  whether a criminal record issued online (a digitally signed file) with
  the foreign ministry's electronic apostille is accepted (1.3.0001 §4.3.3
  allows a digital police certificate with an electronic apostille);
  whether RENIEC's copy printed at home can be apostilled; what a
  divorced or widowed Peruvian shows for their status.

- **Italy** (researched November 2026, from official pages; `IT` in the
  issuers). Unknown: whether ANPR issues the certificate of free status to
  Italians registered abroad (AIRE) today (an ANPR GitHub issue from 2019
  says it doesn't); whether Misrad Hapnim accepts a free-status certificate
  that certifies the status only as of the date the person left Italy;
  whether the multilingual birth extract's code legend includes English;
  whether a criminal record certificate issued digitally can get an
  apostille.

- **Poland** (researched November 2026, from gov.pl, the MSZ apostille
  page and the Ministry of Justice's KRK FAQ; `PL` in the issuers).
  Unknown: whether Misrad Hapnim accepts the abridged birth copy (odpis
  skrócony), not only the full one the guide asks for; for the status
  before the marriage (researched: the full marriage copy has a civil
  status field, art. 88; a transcription copies only what the foreign
  certificate states, art. 37 supplementation can add it), whether a Cyprus
  marriage certificate states each spouse's prior status, whether Misrad
  Hapnim counts a Polish record made by transcription as a marriage
  certificate "from the partner's country" (§ד.2.ה), and how readily USCs
  supplement the status field; whether a USC posts a paper copy or certificate to Israel (gov.pl
  says "to the address in the request", free, without naming abroad);
  whether a Polish apostille needs a translation (its fields may already
  be in English). Community posts: one Polish partner was asked to show
  the marriage was registered in Poland, others weren't
  (facebook-28992865190365766); one was told her Polish documents were
  about to expire (facebook-28924963180489301; the civil-status
  certificate is valid 6 months).

- **Netherlands** (researched November 2026, from rechtspraak.nl, the
  municipalities of The Hague, Rotterdam and Groningen, Justis and
  NetherlandsWorldwide; `NL` in the issuers; deeper pass the same day).
  - **English on the extracts:** answered (product owner, November 2026):
    in practice the English on them is accepted; if not, the clerk asks for
    a translation. Matches the translation step. One Dutch partner was asked
    in September 2026 (facebook-28549274534724836).
  - **Courts posting abroad:** unknown (the product owner doesn't know
    either); not stated outright. Every location
    takes requests by post and returns them to "your own address";
    Amsterdam's English form asks for the applicant's country and offers an
    emailed invoice, and Haarlem's and Alkmaar's English pages address
    foreign applicants. Payment by post is a payment request, payable from
    abroad. The guides say anyone can file it, which covers family in the
    Netherlands either way.
  - **Appointments:** Middelburg needs one (by email). No appointment:
    Amsterdam, Utrecht, Arnhem, Nijmegen, Roermond, Assen. Oost-Brabant
    takes them only in 's-Hertogenbosch, not Eindhoven. The rest don't say
    (rechtspraak.nl location pages, read November 2026).
  - **RNI status:** answered. The civil status registered at deregistration
    is copied into the RNI and not updated after (NetherlandsWorldwide, "Hoe
    verander ik mijn gegevens in de RNI?"). The product owner confirmed
    (November 2026) that the RNI extract plus an affidavit for the time
    since is enough, as the guide's general rule says.
  - **Dutch embassy declaration:** unknown. The embassy in Tel Aviv issues a
    civil-status declaration ("tamtsiet tishoem") by email to Dutch citizens
    living in Israel and not in the BRP, as a multilingual form (Dutch,
    English, French, German), from the RNI extract plus local documents.
    Not offered as the document, since offices have refused foreign-embassy
    declarations made in Israel (certification.md); whether Misrad Hapnim
    takes it for the Netherlands is unknown to the product owner too.
  - **AIC's Netherlands page** (volunteer post, 2022–23) says no
    civil-status certificate exists and suggests an affidavit at the Israeli
    embassy in The Hague; a 2025 comment there points to the BRP extract
    with burgerlijke staat, which is what the guide asks for.
  - **The apostille signature:** Leeuwarden's court page says to ask the
    municipality for a signature by an official authorized for apostilles;
    Eindhoven says its international BRP extracts are always signed by a
    registrar (ABS), other extracts often not.

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
- **Philippines** (2026-11-22). Verified: since 16 March 2026, PSA
  e-certificates for Apostille Convention countries get only an electronic
  apostille (Philippine embassy in Cairo advisory; paper only for
  non-members), and a CENOMAR request returns an Advisory on Marriages when a
  marriage is on record (PSA citizen's charter). Open, from practice:
  - Whether the Advisory on Marriages itself comes with the e-apostille: the
    sources list birth, marriage, death and CENOMAR only. `foreignCivilStatus`
    `PH` stays `electronic`.
  - Married abroad, marriage not reported to the PSA: whether a CENOMAR that
    still says single is accepted (the guide's general rule), or the office
    asks for proof of the change in the Philippines (the embassy's Report of
    Marriage), as a 2022 AIC comment says.
  - A divorce granted abroad: whether the office asks for the Philippine
    court's recognition and the annotated PSA marriage certificate, or the
    foreign decree is enough. The guide says only how the Philippines treats
    it.
  - At the appointment: how couples show the e-certificate and e-apostille,
    which can't be printed (phone, USB, the online application).
  - The NBI clearance from Israel: written from the Tel Aviv embassy's pages
    as quoted in search results (it gives out the form and notarizes it) and
    AIC; the embassy's site blocks automated reading, so the current steps
    and fee weren't read directly.

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
