# Messages

`messages/en.json` is the source of truth for keys; `messages/he.json` has the
same keys (the build fails otherwise). `format()` in `messages.ts` fills in
`{placeholder}`s.

## Two titles for each document

Every document (`app.documents.items.<id>`) has two titles:

- **`title`: its full name**, which tells it apart from every other document,
  whose it is included: "Salary slips of the foreign partner", "Children's
  passports". It's the name everywhere outside the documents page: the
  knowledge base's guide openings (synced from it, `npm run guides:sync`),
  the chat's document list, the check, the admin pages.
- **`shortTitle`: the label on the documents page**, which groups the
  documents under each partner's name, so it never says whose it is:
  "Salary slips" (תלושי שכר), "Passports" (דרכונים). Two documents can share
  one. Where a short title is shown outside those groups, the partner's name
  goes with it: `documentTitle(key, texts, locale, names)` gives "Salary slips
  (John)" (`app.documents.whose`), as in the activity feed.

When the two would be the same ("Birth certificate"), write it in both.

## What a document has to show: impersonal

The bullets of what a document has to show (`app.documents.points`) say what's
needed, not who: "Proof of marital status (single)", "הוכחה למצב אישי
(רווקות)". In Hebrew, use the status noun (רווקות, גירושין, אלמנות), never a
gendered adjective with a slash (רווק/ה).

`lib/messages-hebrew.test.ts` checks these.
