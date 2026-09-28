# Former USSR, and the security check

## Former USSR

The 15 former Soviet republics, by today's codes: AM, AZ, BY, EE, GE, KG,
KZ, LT, LV, MD, RU, TJ, TM, UA, UZ.

- **Nationals of, or people born in, former-USSR countries are referred to
  Nativ** (לשכת הקשר נתיב) for an opinion (5.2.0008 §ד.4). A step in the
  process, not a document. The catalog doesn't show it yet.
- **Original former-USSR birth certificates issued up to 1998 need no
  authentication** (§ד.2.ה). The catalog marks the birth certificate with
  `exemptIfIssuedUntil: 1998` when the birth country is one of them.
- The fact `foreignFromFormerUSSR` is by **nationality or birth country**, not
  countries lived in, to match the Nativ rule.
- An Israeli who immigrated or naturalized in the last 10 years is checked
  with Nativ (from the former USSR) or the Jewish Agency (elsewhere) (§ה.2(3)).
  The office does this; no document.

## The security check and the security CV

- Applicants who need a security check fill in a **full CV form** (§ד.2.ט):
  not a job CV, but a history of employment and life, for security clearance.
- The procedure calls these "risk countries" without listing them. From
  practice: **Russia, Ukraine and the Arab countries**. The catalog uses
  Russia, Ukraine and the Arab League states (`SECURITY_CHECK` in
  `lib/documents/countries.ts`), which may be partial.
- Matched by **nationality or birth country** (confirmed: a German national
  born in Ukraine gets it).
