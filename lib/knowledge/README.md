# Visamo domain knowledge

What we know about the Israeli partner-visa process (the graduated procedure,
ההליך המדורג), gathered while designing the onboarding and the document
catalog. Read this before changing the onboarding questions or
`lib/documents/`.

## How to weigh sources

1. **The product owner's corrections from practice** come first. They were
   given in the design sessions and are marked "(practice)" in these files.
2. **The procedures' text**: 5.2.0008 (married) and 5.2.0009 (common-law).
3. **Forms and their checklists** (AS/6).
4. **Lawyers' websites and general knowledge**: never enough alone. An entry
   based only on these stays `verified: false` in the catalog.

When practice and the procedure's text disagree, both are written down here,
with which one the app follows.

## Files

- [process.md](process.md): what the process is, who it's for, what's out of scope.
- [onboarding.md](onboarding.md): each onboarding question, why it's asked, and the UX decisions.
- [documents.md](documents.md): the document list for the first application, with every correction.
- [certification.md](certification.md): apostille, legalization, translation, where you married.
- [children.md](children.md): the foreign partner's children moving to Israel.
- [former-ussr-and-security.md](former-ussr-and-security.md): Nativ, the 1998 exemption, the security CV.
- [sources.md](sources.md): every source, where to find it, and how far it's been checked.
- [open-questions.md](open-questions.md): what's still unknown or unverified.
