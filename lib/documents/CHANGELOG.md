# Document catalog changelog

Every change to what any couple's document list contains, newest first. The
version is `CATALOG_VERSION` in `catalog.ts`; the format is in `CLAUDE.md`.

## v62 — 2026-11-27

**What changed:** New `CA` (Canada) entry for the birth certificate in
`issuers.ts`, with its guide section and messages: the long-form
certificate, with the parents' names, from the vital statistics office of
the province or territory of birth; the apostille from the province
(Alberta, British Columbia, Ontario, Quebec, Saskatchewan) or Global Affairs
Canada. The police certificate's messages and guide section (no change to
its entry) now name Global Affairs Canada for the apostille, and say who
takes the fingerprints abroad. The civil status's messages and guide section
(no change to its entry either) name the apostille office the same way as
the birth certificate's.

**Why:** Canadian birth certificates got the general steps, which don't say
that provinces issue a short form without the parents' names. The police
certificate's apostille said only "from Canada", though a provincial office
can't apostille the RCMP's federal check.

**Source:** international.canada.ca, Authentication of documents:
Requirements; Global Affairs Canada, Five tips for authenticating Canadian
documents (January 2025); CIC News, Long-form birth certificates (June
2026: provincial names, Ontario's birth certificate with parental
information); rcmp.ca, Where to go (outside Canada).

**Lists that changed:** none by key (no scenario has a Canadian partner).

## v61 — 2026-11-26

**What changed:** Colombia's birth certificate and civil status (`CO` in
`issuers.ts`) are no longer `electronic`: the couple gets a paper certified
copy, whose apostille is only a file, so the steps say to send the paper
copy again. The police certificate stays `electronic`. The general rules on
digital-only documents, electronic apostilles and what the notary's
certificate says are in `certification.md`; the Argentina and Philippines
sections and messages now say the files are accepted when the clerk can
check them online, not that the clerk may push back.

**Why:** The product owner verified how Misrad Hapnim treats them: paper
where a country issues paper; a digital-only document or an apostille
issued only electronically, when the clerk can check it online; for
Colombia, a paper certified copy with its electronic apostille, translated
by the notary as a true copy and as computerized information.

**Source:** the product owner's practice (2026-11-26).

**Lists that changed:** none by key (no scenario has a Colombian partner).

## v60 — 2026-11-26

**What changed:** New `CO` (Colombia) entries in `issuers.ts`, with guide
sections and messages, all three `electronic`: the birth certificate (a
certified copy of the registro civil de nacimiento from the notaría or
Registraduría where the birth was registered), the civil status (Colombia
issues no certificate of single status: the birth record with its notes,
valid for marriage, issued in the last 3 months, or a consulate's
declaración de estado civil), and the police certificate (the certificado de
antecedentes judiciales, issued with its apostille only online by the
Cancillería). Colombia is also in `VISA_EXEMPT` again (not part of the
lists).

**Why:** Colombian documents got the general steps, which say to get the
original on paper and send it by courier. Colombia apostilles only online,
as a file, a notary's copy of a civil record is never handed over, and the
police certificate isn't issued on paper at all. Israel restored Colombia's
visa exemption on 1 September 2026.

**Source:** cancilleria.gov.co, Guía Apostilla y Legalización de Registros
Civiles; registraduria.gov.co, Apostilla del registro civil;
antecedentes.policia.gov.co, Preguntas frecuentes (Decree 19 of 2012,
art. 93); Colombian consulates in Quito, Milan and Bilbao (civil status);
embassies.gov.il/colombia, Israel and Colombia Agree on Mutual Visa
Exemption.

**Lists that changed:** none by key (no scenario has a Colombian partner).

## v59 — 2026-11-24

**What changed:** New `marriageCertificateAbroad` entries in `issuers.ts`,
with guide sections and messages: Denmark (`DK`, `english: "onRequest"`),
the municipality's international certificate in five languages, or the
parish's Danish/English one after a wedding in the Church of Denmark; Sweden
(`SE`, `english: "onRequest"`), which issues no marriage certificate: the
extract from the population register "120 med alla relationer", in English,
from Skatteverket, with a notary public's apostille.

**Why:** Marriage certificates from Denmark and Sweden got the general
steps: "the original, from Sweden", which doesn't exist, and a Danish or
Swedish translation, without saying either can be had in English.

**Source:** kk.dk, Få en ny vielsesattest; aabenraa.dk, Marriage Registry
Office; personregistrering.dk, Vielsesattest ved kirkelig vielse;
skatteverket.se, Information om personbevis för utländska myndigheter,
Information to foreign authorities and Personbevis.

**Lists that changed:** none by key (no scenario married in Denmark or
Sweden).

## v58 — 2026-11-24

**What changed:** The Faroe Islands (`FO`) are in `APOSTILLE`: their
documents get an apostille, no longer consular legalization. Denmark's guide
sections and messages (no entry changed in `issuers.ts`): the claim that a
digitally signed document can't get a physical apostille is gone (the
ministry prints one forwarded from Digital Post and apostilles it on paper,
or gives a digitally signed one an e-Apostille); the paper advice now rests
on the parish's digital certificates being valid only as files. The birth
and baptism certificate is only for a baptism in the Church of Denmark, and
a birth registered in Southern Jutland gets a personattest from that
municipality. The civil status's personattest shows the current status and
its date, from the parish office; the residence certificate with the civil
status is the municipality's civilstandsattest. The police certificate can
be ordered at a police station or by post from abroad, and the police can
send it straight to the ministry.

**Why:** Denmark withdrew its territorial declaration for the Faroe Islands
on 14 October 2021 (in force 13 December 2021); Greenland is still excluded.
A review of Denmark's sections against the issuing authorities' pages.

**Source:** Dutch treaty database (depositary), Apostille Convention,
Denmark's declarations; um.dk, Legalisering af danske dokumenter, Generelt
and Straffeattester; personregistrering.dk, Personattest and Fødsels- og
dåbsattest; borger.dk, Attester and Bestil Fødsels- og dåbsattest;
politi.dk, Bestil privat straffeattest and Straffeattest, når du bor i
udlandet; kk.dk and aarhus.dk, Bestil bopælsattest og civilstandsattest.

**Lists that changed:** none by key (no scenario has the Faroe Islands).

## v57 — 2026-11-23

**What changed:** Argentina (`AR` in `issuers.ts`): a new
`foreignBirthCertificate` entry, `electronic`; the `foreignPoliceCertificate`
entry is now `electronic`, so neither has a send step. The civil status
stays a paper `document`. Their guide sections and messages: the birth
certificate (partida de nacimiento) and the criminal record certificate come
only as files with a digital signature, with an electronic apostille; the
criminal record is apostilled only within 90 days of its issue; the
certificate of single status covers only marriages registered in that
province, and its apostille is a file attached to a scan; the province's
notaries' association apostilles too, not only in Buenos Aires.

**Why:** The Registro Nacional de Reincidencia issues every certificate
electronically, and every Argentine apostille has been a digitally signed
file since 2019, so the steps sent a paper original that doesn't exist.
1.3.0001 §4.3.3 accepts a digital police certificate with an electronic
apostille. The birth certificate had no entry.

**Source:** cancilleria.gob.ar, Apostilla / Legalización con validez
internacional – TAD; colegio-escribanos.org.ar, Apostillas (FAQ);
argentina.gob.ar, Legalizar o apostillar un documento a través de TAD;
portal.gba.gob.ar, Constancia negativa de matrimonio; Facebook group
threads, May 2026 (Argentine birth certificates).

**Lists that changed:** none by key (no scenario has Argentina).

## v56 — 2026-11-23

**What changed:** France's civil status (`foreignCivilStatus`, `FR` in
`issuers.ts`) is `documentOrAffidavit`, no longer `document`: the card offers
the affidavit in its place, and with France as the nationality, one
affidavit can cover the civil status and the children
(`oneAffidavit`). France's guide sections and messages: the civil status
names the certificate of non-remarriage and says someone with no French
birth record can't get it; the civil status and the police certificate say
the notaries' apostille is electronic, so ask for a paper printout with a
stamp and handwritten signature; the police certificate's 3 months is the
notaries' condition for the apostille; the birth certificate loses its
durations.

**Why:** Many town halls don't issue the certificat de célibat (Paris
issues it only at a foreign authority's request), and the French consulate
in Switzerland says it doesn't issue it either. Someone who
only lived in France has no French birth record to get it against, and the
civil status is asked for each country lived in. Couples report both: a
town hall's certificate accepted, and an affidavit used for France.

**Source:** service-public.fr F1400 (apostille, electronic, paper printout)
and F1420 (bulletin n° 3); notaires.fr FAQ on apostilling the bulletin n° 3
(less than 3 months); paris.fr, certificats et attestations (célibat,
non-remariage); French consulate general in Switzerland, déclaration sur
l'honneur de célibat; Facebook group threads, June and July 2026.

**Lists that changed:** none by key; livedInThreeCountries:
foreignCivilStatus:FR offers the affidavit, and it and
previousChildrenAffidavit are `oneAffidavit`.

## v55 — 2026-11-22

**What changed:** The joint affidavit (`affidavitCommonLaw`) is `later` only
when both partners are abroad (`{ all: ["foreignAbroad", "israeliAbroad"] }`,
like `statusApplicationMarried`), no longer whenever the foreign partner is
abroad. With the Israeli partner in Israel, it's listed with the documents
for the online application. The `"clerk"` signing's step texts say so: both
partners sign it and send it with the online application, digitally if one
of them is abroad, and the clerk fills in the office's section at the
appointment and may ask them to sign it again. New scenario
`commonLawBothAbroad`.

**Why:** Couples send it signed by both with the online application, a
foreign partner abroad signing it digitally, so listing it after arrival
contradicted the card, the group's intro ("the online application is filed
without them") and the chat. With both abroad, the online application is
filed only once they're in Israel, so it stays in the after-arrival group.

**Source:** Form 5.2.0009_a; practice (product owner; Facebook group threads,
June and September 2026).

**Lists that changed:** commonLawBothAbroad: new scenario. commonLawApart:
same keys; affidavitCommonLaw moves out of the after-arrival group.

## v54 — 2026-11-17

**What changed:** The Netherlands has an issuer for `foreignBirthCertificate`,
restating its new guide section: `document`, `english: "onRequest"`. The
international extract of the birth record (internationaal uittreksel
geboorteakte), from the municipality where the birth was registered, with
its headings explained in ten languages, English among them; the full copy
(afschrift) is Dutch only. Its `foreignCivilStatus` and
`foreignPoliceCertificate` texts are corrected: the apostille comes from a
district court location that issues apostilles, on the paper original only,
and some locations need an appointment (the old text said none did); it can
be asked for in English, and anyone can file it. The RNI extract shows the
status on the date of leaving, isn't updated after it (an affidavit covers
the time since), and is posted only to the RNI address abroad.
The VOG is applied for through the municipality by someone registered in the
Netherlands, and to Justis by email only by someone who isn't; it has to be
on paper, since a digital VOG can't get an apostille. The Netherlands'
certification is unchanged: apostille.

**Why:** Dutch birth certificates had only the general steps, and the
civil-status and police-certificate steps said every court takes apostilles
without an appointment and sent every VOG applicant to Justis.

**Source:** rechtspraak.nl, Apostille en legalisatie (paper only, designated
locations, any court regardless of issuer) and the court pages for Amsterdam
(no appointment) and Middelburg (appointment by email; languages Dutch,
English, German, French, Spanish, Italian); denhaag.nl, Geboorteakte
aanvragen and Meertalig modelformulier aanvragen (afschrift Dutch only;
international extract explained in 10 languages, with the parents);
government.nl, extract or official copy of a civil status record;
denhaag.nl, Rotterdam and Groningen, uittreksel BRP and uittreksel RNI
(international versions; RNI status on the date of deregistration, posted to
the RNI address); NetherlandsWorldwide, changing your RNI data (civil status
not updated after deregistration); Justis, VOG FAQ (visa or emigration: municipality in
writing, or Justis by email if not registered; proof it's needed, such as a
web page) and NetherlandsWorldwide, VOG outside the Netherlands (paper only;
Dutch only; name the requiring country).

**Lists that changed:** none (no scenario's list changed; the issuers table did).

## v53 — 2026-11-17

**What changed:** Poland has issuers for `foreignBirthCertificate`,
`foreignCivilStatus` and `foreignPoliceCertificate`, restating its new guide
sections, all `document`. Birth certificate: the full copy of the birth
record (odpis zupełny), on paper, from any civil registry office (USC).
Civil status: a certificate of civil status (zaświadczenie o stanie
cywilnym), on paper, from any USC, after a marriage abroad is transcribed.
Police certificate: information from the National Criminal Register (KRK),
on paper, from any KRK information point, in person or by post from abroad.
Every apostille is by the Ministry of Foreign Affairs (MSZ) in Warsaw,
directly, and it mails documents back only within the EU/EEA and
Switzerland. Poland's certification is unchanged: apostille. No `english`:
all three are issued in Polish.

**Why:** Polish documents had only the general steps, with no issuing
office or apostille authority.

**Source:** gov.pl: Uzyskaj odpis aktu stanu cywilnego; Odpis aktu stanu
cywilnego – informacje o dokumencie; Uzyskaj zaświadczenie o stanie
cywilnym; Polska w Grecji, Uzyskanie odpisów akt stanu cywilnego (consuls
can't obtain them; certificates valid 6 months); Polska w Izraelu and
Polska w USA, transkrypcja; Ministry of Foreign Affairs (gov.pl/web/dyplomacja),
Apostille; Ministry of Justice (arch-bip.ms.gov.pl), Krajowy Rejestr Karny,
Pytania i odpowiedzi; biznes.gov.pl, Zaświadczenie z KRK; Prawo o aktach
stanu cywilnego (art. 49 on the certificate's contents).

**Lists that changed:** none (no scenario's list changed; the issuers table did).

## v52 — 2026-11-15

**What changed:** Issuers can say a document can be issued in English
(`english: "onRequest"`): Denmark, Estonia, Sweden and Thailand for
`foreignBirthCertificate`; Denmark, Estonia, Iceland, the Netherlands and
Sweden for `foreignCivilStatus`; Denmark, Iceland, Switzerland and Thailand
for `foreignPoliceCertificate`. Or that it's always in English, among other
languages (`english: "always"`): Germany's `foreignBirthCertificate`;
Switzerland's `foreignCivilStatus`; Austria's, Germany's, Japan's, Portugal's
and Sweden's `foreignPoliceCertificate`. Each restates its guide section,
updated from official sources (Japan's police certificate also comes sealed;
Austria's partial extract is German only; Portugal's birth certificate also
has a multilingual model). The translation step carries it, and its
words now follow the language the document is assumed to be in
(`languages.ts`): the issuing country's likely language, or its languages
where it has several or issues in English (`COUNTRY_LANGUAGES`). The step names
the language and says what to do in it (usually nothing for English, a notary
in Israel for a language one knows, abroad into English with its own
certification for any other), then in any other language. Where the country
isn't known, or speaks Arabic, it explains every language. An affidavit in
place of a document the country doesn't issue (India's civil status) has its
translation step without the country, since it's written where it's signed.

**Why:** Every translation step said "By a notary in Israel", which
contradicted the knowledge and the checker for a language no notary in Israel
translates, like Estonian.

**Source:** lib/knowledge/translation-languages.md and certification.md
(procedure 1.3.0001 §5); the document guides' country sections.

**Lists that changed:** none (no scenario's list changed; the issuers table did).

## v51 — 2026-11-14

**What changed:** Estonia has issuers for `foreignBirthCertificate`,
`foreignCivilStatus` and `foreignPoliceCertificate`, restating its new guide
sections, all `document`. Birth certificate: a repeat birth certificate in
English, from the local government of a county centre or an Estonian
embassy. Civil status: an extract from the population register in English,
with the marital status and spouses, from the same offices or a notary.
Police certificate: a notice from the Criminal Records Database, on paper,
by post or email. Every apostille is by any notary in Estonia. Estonia's
certification is unchanged: apostille.

**Why:** Estonian documents had only the general steps, with no issuing
office or apostille authority.

**Source:** Centre of Registers and Information Systems (rik.ee), Criminal
Records Database: FAQ, Issuing a notice from database, State fee; Ministry
of the Interior (siseministeerium.ee): Release of data from the population
register, Vital statistics procedures; CIEC practical guide, Estonia
(languages of certificates and extracts); Chamber of Notaries (notar.ee),
Apostille; Tallinn, Extractions from the Population Register; Estonian
embassies in Washington, Seoul, Rome and Ottawa (ordering documents, state
fees); Ministry of Foreign Affairs (vm.ee), Estonian representations (Tel
Aviv).

**Lists that changed:** none (steps only).

## v50 — 2026-11-11

**What changed:** Greece and Cyprus have issuers for
`foreignPoliceCertificate` and `foreignCivilStatus`, restating their new
guide sections. Police certificate: for Greece, the public prosecutor's
office at the court of first instance (born in Greece) or the Ministry of
Justice's Criminal Records Department (born abroad), apostilled by the
court of first instance or the Decentralized Administration; for Cyprus,
the police's Previous Convictions Registry, apostilled by the Ministry of
Justice and Public Order. Civil status: for Greece, the certificate of
family status from the municipality, apostilled by the Decentralized
Administration (`document`); for Cyprus, the certificate of no impediment
from the Civil Registry and Migration Department, issued only for a
planned marriage (`documentOrAffidavit`, like the United Kingdom). Both
countries' certification is unchanged: apostille.

**Why:** Greek and Cypriot police certificates and civil-status documents
had only the general steps, with no issuing office or apostille authority.

**Source:** Greece: mitos.gov.gr (copy of criminal record; certificate of
family status; Hague apostille, e-apostille); Decentralized Administration
of Attica, Hague apostille page; Greek embassy in Ukraine, copy of criminal
record; Ministry of Interior, marriage registrations. Cyprus: Cyprus
Police, Previous Convictions Registry, and gov.cy Criminal Certificate
Issuance (DIGIPOL); Ministry of Justice and Public Order, Apostille;
Ministry of Interior, Non-Impediment Certificate (20 June 2025); Embassy of
Cyprus in Berlin, certificate of clear criminal record.

**Lists that changed:** none (steps of Greek and Cypriot police
certificates and civil-status documents: their office, details and
apostille authority).

## v49 — 2026-11-10

**What changed:** A legalization can end at the Israeli embassy in another
country, where Israel has relations with the issuing one but no embassy in
it (`mission` in `LEGALIZATION`; `via` stays for countries without
relations). The step's line names both countries ("In Tanzania, then in
Kenya"), the last office is "the Israeli embassy in Kenya", and the closing
sentence says the embassy there serves the country, in place of "It can
only be done in Tanzania". Tanzania is the first: the foreign ministry, then
the Israeli embassy in Kenya (Nairobi), where it had the general
description (the ministry of justice, the foreign ministry, the Israeli
embassy). The Tanzanian issuer texts no longer explain the embassy's place,
only how to hand the original in there.

**Why:** Tanzanian documents' steps said the legalization ends at an
Israeli embassy in Tanzania, which doesn't exist; the embassy in Nairobi
serves Tanzania.

**Source:** MFA and East African Cooperation of Tanzania, public
announcement on certification of documents (7 Nov 2018); NetherlandsWorldwide,
"Legalisation of documents from Tanzania"; Embassy of Denmark in Dar es
Salaam, legalisation; Embassy of Israel in Nairobi, consular services
(accredited to Tanzania) and authentication of public documents (updated
3 Jun 2024).

**Lists that changed:** none (steps of every Tanzanian document that's
legalized: their line, offices and closing sentence).

## v48 — 2026-11-10

**What changed:** Tanzania has issuers for `foreignBirthCertificate`,
`foreignCivilStatus` and `foreignPoliceCertificate`, restating their new
guide sections: RITA for the birth certificate (ZCSRA for a birth in
Zanzibar), RITA's Registrar General of Marriages for the certificate of
single status (ZCSRA for Zanzibar), and the Forensic Bureau of the CID in
Dar es Salaam for the police clearance certificate (the CID in Zanzibar for
Zanzibar's records). Its legalization is unchanged: not in the Apostille
Convention, the general description, no `LEGALIZATION` entry. The texts say
the issuing office verifies the document before the foreign ministry, and
that the chain ends at the Israeli embassy in Nairobi, accredited to
Tanzania.

**Why:** Tanzanian documents had the right certification (legalization),
but no issuing office, and nothing said Israel's embassy for Tanzania is in
Kenya.

**Source:** RITA, marriages and divorce services and fees (rita.go.tz);
eRITA portal; MFA and East African Cooperation of Tanzania, public
announcement on certification of documents (7 Nov 2018); Embassy of Tanzania
in Tel Aviv, police clearance certificate and marriage pages; IRCC, "How to
get a police certificate – Mainland Tanzania and Zanzibar" (7 Sep 2023);
NetherlandsWorldwide, "Legalisation of documents from Tanzania"; Embassy of
Israel in Nairobi, consular services (accredited to Tanzania) and
authentication of public documents (updated 3 Jun 2024).

**Lists that changed:** none (steps of Tanzanian birth certificates, civil
status and police certificates: their office and details).

## v47 — 2026-11-10

**What changed:** Turkmenistan has issuers for `foreignBirthCertificate`,
`foreignCivilStatus` and `foreignPoliceCertificate`, restating their new
guide sections: the civil registry office (ЗАГС) for a new copy of the
birth certificate, the certificate of marital status (справка о семейном
положении) through a Turkmen embassy or consulate (no office named inside
Turkmenistan), and the Ministry of Internal Affairs (МВД) for the
certificate of no criminal liability. Its legalization is unchanged: not
in the Apostille Convention, the general description, through the Israeli
embassy in Ashgabat.

**Why:** Turkmen documents had the right certification (legalization,
Israel has an embassy there), but no issuing office.

**Source:** MFA of Turkmenistan, Consular Service (mfa.gov.tm/en/articles/57,
legalization for use abroad); Embassy of Turkmenistan in Moscow
(russia.tmembassy.gov.tm: duplicate certificates, marital status, no
criminal liability, legalization); Embassy of Turkmenistan in Ankara
(non-marriage registration, criminal record); MVD order No. 91 of
26 July 2025 (via Schmidt & Schmidt).

**Lists that changed:** none (steps of Turkmen birth certificates, civil
status and police certificates: their office and details).

## v46 — 2026-11-08

**What changed:** Sweden has an issuer for `foreignBirthCertificate`,
restating its new guide section: the Tax Agency (Skatteverket)'s extract
from the population register "with all relations", in English, with an
apostille from any notary public. It's the same extract as the Swedish
personal status.

**Why:** The Swedish personal status already said the extract serves as the
birth certificate too, but the birth certificate itself had only the general
steps.

**Source:** AIC, "Official Documentation from Sweden" (utdrag om
folkbokföring med alla relationer på engelska, from Skatteverket; apostille
from any notarius publicus); the Sweden section of the personal status
guide.

**Lists that changed:** none (steps of Swedish birth certificates: their
office).

## v45 — 2026-11-04

**What changed:** Nepal has issuers for `foreignBirthCertificate`,
`foreignCivilStatus` and `foreignPoliceCertificate`, restating their new
guide sections: the ward office for the birth registration certificate and
the unmarried certificate, the Nepal Police headquarters for the police
clearance certificate. Its legalization chain (the foreign ministry, then
the Israeli embassy) is unchanged.

**Why:** Nepalese documents had the right chain, but no issuing office.

**Source:** NetherlandsWorldwide, "Legalisation of documents from Nepal";
IRCC, "How to get a police certificate – Nepal"; MoFAGA circular of
3 Dec 2020 on verifying local documents before consular attestation (The
Himalayan Times, 4 Dec 2020); procedure 1.3.0001 §3.1.2.1.

**Lists that changed:** none (steps of Nepalese birth certificates, civil
status and police certificates: their office).

## v44 — 2026-11-03

**What changed:** Removed `israeliDivorceDecree` and
`israeliSpouseDeathCertificate`, and retired their ids. The Israeli
partner's ID card guide says a divorced or widowed Israeli partner brings no
divorce or death certificate, and has the registry updated first if it
doesn't record the divorce or the death.

**Why:** Misrad Hapnim sees the Israeli partner's civil status in the
population registry. If the registry isn't up to date, updating it is a
step of its own, before the application and outside the graduated
procedure.

**Source:** Product decision; AIC's list of documents asks the Israeli
partner only for the ID card, and its lawyer answers that PIBA has the
Israeli side's personal status (one caveat: a divorce certificate may be
asked for).

**Lists that changed:** bothPreviouslyMarried: -israeliSpouseDeathCertificate.

## v43 — 2026-11-03

**What changed:** Peru has issuers for `foreignBirthCertificate`,
`foreignCivilStatus` and `foreignPoliceCertificate`, restating their new
guide sections: RENIEC for the birth record and the certificate that no
marriage is registered, the Poder Judicial's Registro Nacional de Condenas
for the criminal record, and the apostille from the foreign ministry.

**Why:** Peruvian documents had only the general steps, without their
offices.

**Source:** gob.pe: RENIEC, "Solicitar copia certificada de acta o partida
en Reniec" (updated 5 Oct 2026) and "Solicitar Constancia Negativa de
Inscripción de Nacimiento, Matrimonio y Defunción en Reniec" (updated 3 Oct
2026); IRCC, "How to get a police certificate – Peru".

**Lists that changed:** none (steps of Peruvian birth certificates, civil
status and police certificates: their office and apostille authority).

## v42 — 2026-11-03

**What changed:** Cuba has issuers for `foreignBirthCertificate`,
`foreignCivilStatus` and `foreignPoliceCertificate`, restating their new
guide sections. A legalization can now go on through a third country
(`via` in `LEGALIZATION`, with the chain links `viaEmbassy`,
`viaForeignMinistry` and `viaIsraeliConsulate`): the authenticate step
carries `via`, and its text names the third country. Cuba's chain: the
Ministry of Justice, then the Canadian embassy in Havana, Global Affairs
Canada and the Israeli embassy in Canada.

**Why:** Cuban documents had the usual chain, ending at an Israeli embassy
in Cuba, which doesn't exist: Israel and Cuba have no diplomatic relations.
Since 3 February 2025 Cuba's Ministry of Justice legalizes documents for use
abroad, in place of the foreign ministry.

**Source:** Procedure 1.3.0001 §3.1.3 (31.8.2022); Canada as the third
country (product owner); MINREX, 3 Feb 2025; Ley 180/2025 and its
Reglamento (Res. 61/2026, Gaceta Oficial No. 26, 16 Mar 2026); MINJUS,
Registro Central de Sancionados; Res. 486/2025 and Res. 37/2026.

**Lists that changed:** none (steps of Cuban birth certificates, civil
status and police certificates: their office, and the chain through Canada).

## v41 — 2026-10-18

**What changed:** Form AS/6 has a new point, `as6HomeOwnership`, next to
`as6LandlordAffidavit` and under the same condition: a couple who owns their
home shows proof of it (a land registry extract, נסח טאבו) instead of the
landlord's affidavit. Its bullet is separate from the renters' one. It has no
check part of its own: the landlord's part accepts the affidavit, a letter
from a landlord who won't sign it, or proof of owning the home.

**Why:** Onboarding doesn't ask whether the couple rents or owns. The
landlord's part of the check is now required, so a couple who owns their
home needs a way to meet it, and to see on the card what to bring.

**Source:** Visamo's practice: AS/6, the landlord's affidavit (affidavit
annexed to the lease – couples).

**Lists that changed:** none (a point on `statusApplicationMarried` in every
married scenario with the landlord's affidavit: marriedInCyprus,
marriedInIsrael, marriedOnline, marriedInEgypt, foreignFirst,
bornInUSSRWithGermanNationality, fromUkraine, fromJordan,
livedInThreeCountries, foreignAbroad, foreignWithoutVisa, foreignNameChanged,
bothPreviouslyMarried, permanentResident, bothAbroad,
marriedNeverLivedTogether, childrenStayingBehind, childrenMovingWithConsent,
childrenMovingMixed, childrenTogether).

## v40 — 2026-10-18

**What changed:** `foreignBirthCertificate` has issuers for Germany, France,
the United Kingdom, Italy, the Philippines, Thailand and Ukraine, restating
their new guide sections: the card names each one's office and apostille
authority. Issuers can be `electronic`: issued for Israel only as a file,
with an electronic apostille. Such an item's steps have no `send` step, and
its `obtain` step says so instead of asking for a paper original. The
Philippines' birth certificate, CENOMAR (`foreignCivilStatus`) and
marriage certificate are electronic: `marriageCertificateAbroad` is now in
`issuedDocuments`, with the Philippines as its only entry. France's apostille authority, for the civil status and the
police certificate, is now the notaries' centres (messages only).

**Why:** The countries most couples come from had only the general steps.
Since March 2026 the Philippines issues PSA certificates for Israel only
with an electronic apostille, and the general steps told couples to ask
for a paper original and courier it. Since May 2025 French apostilles come
from notaries, not the courts of appeal.

**Source:** The guide sections in `lib/knowledge/documents/`
(foreignBirthCertificate, foreignCivilStatus, foreignPoliceCertificate),
researched October 2026 from official sources of each country.

**Lists that changed:** none (steps of Philippine birth certificates,
CENOMARs and marriage certificates: no `send` step).

## v39 — 2026-10-17

**What changed:** `statusApplicationMarried`'s signing is two steps: the
partners' declarations (by name, the Israeli partner's alone when the
foreign partner's is a document of its own), and, where the card has the
landlord's affidavit, a step of its own for the landlord (`by: "landlord"`).
The declarations' steps, and `foreignDeclarationMarried`'s, say a Misrad
Hapnim registrar can confirm them too.

**Why:** One line had the couple's declarations and the landlord's
affidavit, which someone else signs, and only if they rent.

**Source:** AS/6 (each declaration's and the landlord's affidavit's
confirmation, by a lawyer or a registrar).

**Lists that changed:** none (`statusApplicationMarried`'s steps).

## v38 — 2026-10-17

**What changed:** The foreign partner's signature by email is a step, not a
point: `statusApplicationMarried` gets a `signByEmail` step, before the
declarations' signing, when the foreign partner is abroad and the Israeli
partner in Israel, and the `as6ForeignSignsByEmail` point is gone. Every
signing step has a short line and its own full text.

**Why:** The card mixed what the document has to show with what to do: the
points say what's in it, the steps what to do, with the details in their
full text.

**Source:** Practice (product owner).

**Lists that changed:** none (`statusApplicationMarried`'s steps and points
in `foreignAbroad` and `marriedNeverLivedTogether`).

## v37 — 2026-10-17

**What changed:** A new point on `statusApplicationMarried`,
`as6ForeignSignsByEmail`, when the foreign partner is abroad and the Israeli
partner in Israel: the foreign partner signs only page 3 now (the applicants'
declaration), by email, with no original; the rest once they're in Israel.

**Why:** Couples didn't know how the foreign partner signs the application
from abroad.

**Source:** Practice (product owner).

**Lists that changed:** none (a point on `statusApplicationMarried` in
`foreignAbroad` and `marriedNeverLivedTogether`).

## v36 — 2026-10-17

**What changed:**
- The children's affidavit is a document of its own, `previousChildrenAffidavit`,
  for every couple, with the `children` / `noChildren` point and its own check.
  `foreignCivilStatus` keeps its id and keys (existing uploads stay) and
  shows only the status: its children point and the children's affidavit step
  are gone, and so are the card's step parts.
- A new `later` condition lists a document apart, after the others, as done
  once the foreign partner is in Israel, and leaves it out of the progress:
  - `previousChildrenAffidavit` and `affidavitCommonLaw`, whenever the
    foreign partner is abroad;
  - `statusApplicationMarried`, when both partners are abroad;
  - `foreignHealthInsurance`, when the foreign partner is abroad and the
    Israeli partner in Israel.
- With the foreign partner abroad and the Israeli partner in Israel, form AS/6's
  foreign partner's declaration is a document of its own,
  `foreignDeclarationMarried` (listed apart, with the declaration's lines,
  required). AS/6 drops that part, and `as6ForeignDeclarationLater` is gone.
- `foreignHealthInsurance` is back for every couple: with the rest when both
  are in Israel or both abroad.

**Why:** A foreign partner abroad signs the children's affidavit, their AS/6
declaration and the joint affidavit only once they're in Israel, and couples
in Israel often declare the status and the children in one affidavit. Listing
these apart, by where the partners are rather than by stage, lets couples see
them from the start without counting them against the online application.

**Source:** 5.2.0008 §ד.2.ה, §ד.2.ז; AS/6; practice (product owner).

**Lists that changed:** every scenario: +previousChildrenAffidavit.
`foreignAbroad`, `marriedNeverLivedTogether`: +foreignDeclarationMarried.
`commonLawApart`, `foreignAbroad`, `bothAbroad`, `marriedNeverLivedTogether`,
`neverLivedTogetherBothAbroad`: +foreignHealthInsurance.

## v35 — 2026-10-17

**What changed:** The common-law affidavit (`affidavitCommonLaw`) links to
its form, 5.2.0009_a, like the other forms.

**Why:** Couples had to find the form on gov.il themselves.

**Source:** Procedure 5.2.0009, the affidavit form (5.2.0009_a)

**Lists that changed:** none (only the form link)

## v34 — 2026-10-16

**What changed:** `foreignHealthInsurance` only when the foreign partner is
in Israel (`foreignInIsrael`).

**Why:** A partner still abroad was told to get Israeli health insurance
now. Neither procedure asks for insurance, and in practice it's needed for
the stay in Israel: the office may ask for it once the partner is here.
A consulate may ask both-abroad couples for travel insurance for the entry,
but that's the consulate's own list, not the file's.

**Source:** Procedures 5.2.0008 and 5.2.0009 (no insurance in §ג.5 or the
document list in §ד.2); AIC's document list, where it's an additional
document PIBA may ask for during the process.

**Lists that changed:** `commonLawApart`, `foreignAbroad`, `bothAbroad`,
`marriedNeverLivedTogether`, `neverLivedTogetherBothAbroad`:
-foreignHealthInsurance.

## v33 — 2026-10-16

**What changed:** Every item now carries its steps (`steps.ts`): getting the
original from the country that issued it, its apostille or legalization,
sending it to Israel (unless both partners are abroad, and bring it when
they move), its translation, and who it's signed in front of. `mayNeedTranslation` is replaced by
`translation`: `"notarized"` for official documents, `"self"` for the
couple's everyday documents (`jointLivingEvidence`, `housingContract`,
`utilityBills`, `foreignHealthInsurance`, `sharedBankAccount`,
`bankStatements`, `israeliIncomeProof`, `foreignIncomeProof`), `"none"` as
before. `signAtAppointment` is replaced by `signing`: `"clerk"` for
`affidavitCommonLaw` as before, and `"lawyer"` for `statusApplicationMarried`
(both declarations, and the landlord's affidavit). Legalization chains by
country (`countries.ts`): Thailand, Ethiopia and Nepal, without the ministry
of justice; Thailand with the English translation the Thai MFA legalizes.
How each country provides the birth certificate, the civil status and the
police certificate (`issuers.ts`), from the guides' country sections: the
steps name the office and the apostille authority, and where a country
issues no civil-status document, an affidavit about the civil status
replaces it. The civil status of the nationality always gets its affidavit
about children: no country's document proves them. Where the document may
not be had, or the country isn't in the table, the card says an affidavit
about the civil status can replace it (`orAffidavit`).

**Why:** The page told couples every translatable document needs a
notarized translation, while their everyday documents only need their own
(`lib/knowledge/certification.md`). Signing in front of a lawyer wasn't
shown. A legalization was described the same way for every country.

**Source:** Procedure 1.3.0001 §3.1.1, §3.1.2.1; AS/6, both declarations and
the landlord's affidavit; the Thai MFA's legalization manual (March 2025);
the Embassy of Israel in Bangkok, authentication of public documents.

**Lists that changed:** none (no keys added or removed); the items' steps
and translation changed in every scenario.

## v32 — 2026-10-15

**What changed:** `ishurToshav` (the municipality confirmation of your center
of life) is now asked for only from married couples, still only when at least
one partner lives in Israel
(`{ all: [married, { any: [israeliInIsrael, foreignInIsrael] }] }`).

**Why:** The document is an item on the AS/6 checklist, which is the married
couples' application. Procedure 5.2.0009 (common-law) has no such item: its
§ד.2.ח, word for word the same as 5.2.0008's, only names services from
government institutions, including the municipality, among the proofs of a
center of life (`governmentServices`). The AIC thread on it, too, calls it an
appendix to AS/6.

**Source:** AS/6 checklist; 5.2.0008 §ד.2.ח; 5.2.0009 §ד.2.ח.

**Lists that changed:** commonLawLivingTogether, commonLawApart,
commonLawForeignDivorced: -ishurToshav.

## v31 — 2026-10-04

**What changed:** `ishurToshav` (the municipality confirmation of your center
of life) is now asked for only when at least one partner lives in Israel
(`{ any: [israeliInIsrael, foreignInIsrael] }`), like `governmentServices`.

**Why:** The municipality confirms a home in its locality, registered for
arnona. A couple who both live abroad has no home in Israel to confirm.

**Source:** Product decision; 5.2.0008 §ד.2.ח, AS/6 checklist, as before.

**Lists that changed:** bothAbroad, neverLivedTogetherBothAbroad: -ishurToshav.

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
