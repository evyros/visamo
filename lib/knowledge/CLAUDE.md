# The knowledge base

**This folder is shown to users** (couples going through the process, for
example through the app's chat). It is not documentation of the app.

## What goes here

Facts about the Israeli partner-visa process: what the process is, which
documents are needed and why, how documents are certified and translated,
and the rules for children, the former USSR and the security check.

## What never goes here

- The app's code, file names, field names, catalog ids, versions or tests.
- How the app works, or why a screen or question was designed a certain way.
  Onboarding decisions: `components/app/onboarding-decisions.md`.
- Open questions and what isn't verified yet: `lib/documents/OPEN_QUESTIONS.md`.
- The history of corrections ("an earlier note said…"). State what's true now.
- Who gave a correction ("the product owner").
- How to verify a document: what to look for on it, red flags, the details
  offices check. That's in `lib/documents/checks.ts`, which only the
  document checker reads. Here, say what a document is and what's asked for;
  where offices ask for more, say so in general terms.

## One guide per document

Each document on the documents page has a guide in `documents/<id>.md`, named
after its catalog id: what it is, how to get it, what it should include, and
the questions couples ask about it, with their answers. Every guide opens
with what the messages already have: the title in English and Hebrew, and
the page's English description:

```md
# Birth certificate (תעודת לידה)

The original, from the country of birth.

<the guide>
```

The loader (`lib/knowledge-base.ts`) adds the guides after `documents.md`,
grouped like the page, moving each one's headings under its group. So:

- **The opening comes from the messages.** Never edit it by hand: change the
  title or description in `i18n/messages/`, then run `npm run guides:sync`.
  The tests fail while an opening doesn't match. Write the guide as what
  comes after the description: don't repeat it.
- **Every guide follows the same skeleton**, in this order. Leave out a
  section with nothing to say in it; never add an empty one, and never add
  other `##` sections.

  ```md
  # <title> (<Hebrew title>)

  <page description>

  <What it is, and when it's needed: a short paragraph, no heading.>

  ## How to get it

  <Who issues it, where and how to apply, how long it takes.>

  ## What it should include

  <What has to be on it or attached to it: names, dates, signatures,
  certification, copies.>

  ## If you don't have it

  <The alternatives, and what makes that case strong.>

  ## Questions

  <The questions couples ask about it, with their answers.>
  ```

- **Only the title is a `#` heading.** The sections are the `##` headings
  above.
- **Only what's about that document.** What applies to many documents
  (copies, the 12 months of center of life, translation) stays in
  `documents.md` or `certification.md`; a guide links to it, one folder up
  (`[certification.md](../certification.md)`). The tests check every link.
- **Variants by country or situation** go inside the section they change,
  under a `###` heading (`### United States`) or a bold label (**If you
  rent:**), so the right one is easy to find.
- **Questions go last, under `## Questions`**: each question in bold on its
  own line, its answer below it.

  ```md
  ## Questions

  **Do both of us need to be named on the lease?**
  Yes. It isn't written in the procedure, but in practice…
  ```

  Only questions about this document. A question about many documents ("Do
  I need to translate everything?") goes in the general file it's about,
  once, not in each guide.
- **No guide without facts.** A document nothing is known about yet beyond
  its page description has only the opening: the models get its title and
  description. A new document's file is created by `npm run guides:sync`.
- How to verify the document still never goes here (above).

## How to write it

- For couples: plain words, second person where it helps, no jargon without
  an explanation. Hebrew terms next to English ones where people will meet
  them (שומה, אישור תושב).
- **Law and practice, told apart.** When the procedure's text and how offices
  actually work differ, say both: "By law…, in practice…". Practice comes from
  the product owner's experience; write it as "in practice", never hide the
  law.
- Cite the procedure section when a fact comes from one (5.2.0008 §ד.2.ה).
- **Name each document the way Misrad Hapnim asks for it**, as the
  documents page titles it ("A joint bank account confirmation", "Payslips"),
  never as a general category ("Shared finances", "Income proof"). Say
  plainly that it's asked for. Put alternatives under their own "If you
  don't have…" point that reads as a fallback, and say what makes that
  case strong.
- **Go into more detail than the documents page.** The page's descriptions
  are kept short; this folder has the full picture: alternatives,
  exceptions, and why a requirement is stricter than the official one. Never
  trim it to match the page. When the page asks for more than the official
  rule (12 payslips instead of 3), say both and why.
- When a correction about the process comes up in a session, update the
  relevant file here in the same session (and the catalog, if it changes a
  document).
