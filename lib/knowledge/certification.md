# Certification and translation

## Where you married

- **In Israel, through the rabbinate or another religious court:** already in
  the Population Registry. The Israeli certificate needs no certification or
  translation.
- **In another country:** the foreign certificate, certified by that country
  (below), translated unless in Hebrew or Arabic (see Translation below), and
  registered in Israel.
  This is why onboarding asks which country.
- **Online (e.g. Utah):** issued in English by a Utah county, so by law it
  needs a translation, though in practice it's usually accepted in English.
  The apostille comes from the **Utah Lieutenant Governor**, not
  from the country the couple was in during the ceremony. That's why online
  is its own option without a country. Israel registers these marriages since
  the Supreme Court ruling of 2022.

## Apostille or consular legalization

- A country in the **Hague Apostille Convention**: an apostille from that
  country.
- Any other country: **consular legalization** (that country's foreign
  ministry, then the Israeli consulate).
- The member list is `lib/documents/countries.ts`. It was written from memory
  and still has to be checked against the HCCH status table. Kosovo, the
  Faroe Islands and Greenland were left out on purpose; Senegal is the least
  certain.
- Foreign documents in general follow procedure 1.3.0001 (referenced by
  5.2.0008 §ד.2.ה). Not read yet.

## Translation

- **By law, Misrad Hapnim accepts only Hebrew and Arabic without a
  translation.** Every other language needs a certified (notarized)
  translation (the AS/6 checklist says notarized).
- **English, in practice:** most clerks read English well enough that they
  usually accept an English document without a translation, especially a
  short one. It depends on the clerk handling the file. If they don't accept
  it, they tell you to translate it. So an English document is "usually fine,
  but be ready to translate", not "never needs a translation" (practice).
- **The translation doesn't need an apostille.** Only the original document
  does (practice).
- An earlier note here said Hebrew and English need no translation. That was
  wrong: it's Hebrew and Arabic by law, with English usually accepted in
  practice.
- In code: `LANGUAGES_WITHOUT_TRANSLATION` and `ENGLISH_USUALLY_ACCEPTED` in
  `lib/documents/certification.ts`.

## Exemption

Original former-USSR birth certificates issued up to 1998 need no
authentication (5.2.0008 §ד.2.ה). See former-ussr-and-security.md.
