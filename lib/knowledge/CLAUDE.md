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
