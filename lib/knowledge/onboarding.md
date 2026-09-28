# Onboarding: what's asked and why

Everything the document list needs is asked in onboarding. Nothing is left
for the documents page, even if onboarding gets longer for some couples.
Nothing is saved until the last step.

## Step 1: about you. Step 2: about your partner

The steps stay "you" and "your partner", not "the Israeli" and "the foreign
partner", so each login keeps its own person.

- **Name, gender.**
- **"Are you an Israeli citizen or a permanent resident?"** Three radio cards
  side by side, like gender: Citizen / Permanent resident / Neither. Only the
  user is asked. The partner is the other side, so two Israelis or two
  foreigners can't be entered. If the user is "Neither", the partner step
  asks "Is your partner a citizen or a permanent resident?" (two cards).
- **Changing sides after going back** (to or from "Neither") swaps the roles.
  It clears both people's role questions and makes the user go through the
  partner step again. Name, gender, previous marriages and the relationship
  answers are kept. Citizen ↔ permanent resident is not a swap.
- **Previous marriages** (both people): No / divorced / widowed / both. Each
  ending adds a document. The Israeli's past marriages matter too.

Foreign partner only:
- **Nationality.**
- **"Were you born in {country}?"** Yes / No. A second country list only on
  "No". About 95% are born in their nationality's country. Pre-filling the
  birth country would be skipped without reading, so it's a question. The
  hint: "By today's borders. For example, born in Soviet Kyiv counts as
  Ukraine." The country lists only have today's countries.
- **Other countries lived in as an adult**, besides the nationality: yes/no,
  then a list. The hint: "Not counting visits and vacations. Use today's
  countries. For example, the USSR is now Russia, Ukraine and others." Each
  country adds a police certificate (not yet verified; see open questions).
- **Where they are now:** in Israel with a valid visa / in Israel without one
  / outside Israel.
- **Name ever changed?**
- **Children from a previous relationship?** If yes, **any under 18 and
  moving to Israel?** If yes, **the other parent's situation**, as a
  multi-choice (siblings can have different other parents): agrees to the
  move / a court gave sole custody or approved the move / died / not listed
  on the birth certificate.

Israeli side only:
- **Lived outside Israel in recent years?** Kept, even though it no longer
  adds a document (practice).

## Step 3: your relationship (about the couple)

- **Married or common-law.** These are two separate procedures.
- **Where did you marry:** in Israel (rabbinate or another religious court) /
  in another country (then which) / online (e.g. Utah). See certification.md
  for why.
- **Common-law: do you live together, and since what year.**
- **Children together?**

## Step 4: branch

"Do you know your branch?" with two cards: I know my branch / Not sure yet.
The branch list only appears for the first. A plain Skip button was too easy
to miss, and it left Continue greyed out for anyone who didn't see it.

## Step 5: stage

See process.md. Renewal blocks finishing with a yellow notice.

## Server rules

The server repeats the browser's rules: exactly one Israeli side; each
person answers only their role's questions; follow-ups only when their
question was answered that way; no country listed twice, and not the
nationality among "other countries".
