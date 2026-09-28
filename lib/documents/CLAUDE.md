# The document catalog

This folder decides which documents a couple needs for their Misrad Hapnim
file. It's pure TypeScript: no database, no React, no messages. Tests:
`npm test`.

The facts behind it (what each document is, the law and the practice, the
sources) are in `lib/knowledge/`. Read it before changing the catalog, and
record new facts about the process there too. **`lib/knowledge/` is shown to
users**: write it for couples, and never put the app's internals in it (see
its CLAUDE.md). What's unverified or not modelled yet goes in
`OPEN_QUESTIONS.md` here.

## How it fits together

- `facts.ts`: turns a case (the onboarding answers) into named yes/no facts,
  and the countries documents come from. The only file that reads answers.
- `conditions.ts`: a condition is data built from fact names: a fact,
  `{ all: [...] }`, `{ any: [...] }` or `{ not: ... }`. Evaluating one also
  returns the facts that made it match (the "why" shown to the couple).
- `catalog.ts`: every document, whose it is, its category, its condition
  (`when`, left out for every couple), `each` for one item per country,
  `issuedBy` and `exemption` for its certification, `copies` (shown to the
  couple only), and `optional` for a document whose need depends on
  something onboarding doesn't ask (the description says when).
- `certification.ts` and `countries.ts`: apostille, consular legalization or
  none, from the issuing country; whether a translation may be needed, and
  the languages accepted without one.
- `build.ts`: `buildDocumentList(case)` → the list. The list is never stored;
  progress is saved per item `key`.
- `scenarios.ts`: example couples. Tests check some lists exactly;
  `catalog.lock.json` records every one.

## Rules

- **Put logic in facts, not conditions.** If a condition gets complicated,
  make it a derived fact in `facts.ts`, with a test in `facts.test.ts`, and a
  reason text in both message files (`app.documents.because.<fact>`).
- **Facts describe the case, not the questions** (`foreignDivorced`, not
  `partner.previousMarriages === "divorced"`).
- **Document ids are permanent.** Saved progress is keyed by them. Never rename
  or reuse one. A document replaced by another: map the old id to the new one
  in `DOCUMENT_ALIASES`. A document removed without a replacement: add its id
  to `RETIRED_DOCUMENT_IDS`.
- **Every document has messages** in `i18n/messages/en.json` and `he.json`,
  under `app.documents.items.<id>` (`title`, `description`). A document with
  `each` has `{country}` in its title. The tests check this.
- **A new kind of case gets a new scenario.** Don't edit an existing scenario
  to fit a new rule; its recorded list is how a change is reviewed.
- **Set `verified: true`** only when a person checked the entry against its
  `source`.

## Changing what couples get: the version

Any change that changes a couple's list needs a new catalog version. That
includes the catalog, the facts, the country lists and the certification
rules. Wording in the messages, `source` and `verified` don't.
`catalog.test.ts` fails when the lists change without a new version, and says
which scenarios changed. To release a change:

1. Raise `CATALOG_VERSION` in `catalog.ts` by one.
2. Add an entry at the top of `CHANGELOG.md`, in this format:

   ```md
   ## v<N> — <YYYY-MM-DD>

   **What changed:** <documents or rules added, removed or changed>

   **Why:** <the reason: a procedure change, a mistake found, a new kind of case>

   **Source:** <procedure number and section, form, or other reference>

   **Lists that changed:** <the scenarios and their +added / -removed keys, from the test output>
   ```

3. Run `npm run catalog:lock`. It records the new version and fingerprint in
   `catalog.lock.json`, and prints the lists that changed. Never edit the
   lock file by hand.
