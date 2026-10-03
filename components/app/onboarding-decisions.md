# Onboarding: what's asked and why

Internal design notes for the onboarding wizard. The facts about the process
behind these questions are in `lib/knowledge/` (shown to users).

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
- **Other countries lived in for 6 months or more in a row, from age 14**,
  besides the nationality: yes/no, then a list. That's the procedures' rule
  for a police certificate from another country (since January 2024); a
  country lived in only before 14 doesn't count. The hint also asks to add
  any other country of citizenship, even one never lived in: offices ask for
  a police certificate from each, so one list covers both, without a
  separate citizenship question. The hint: "Not counting visits and
  vacations. Also add any other country of citizenship, even one never lived
  in. Use today's countries. For example, the USSR is now Russia, Ukraine and
  others." Each country adds a police certificate and a proof of civil
  status.
- **Where they are now:** in Israel with a valid visa / in Israel without one
  / outside Israel. "Without one" shows a yellow notice recommending a
  lawyer, but doesn't block finishing: the documents are the same, and
  Visamo still helps with them. It adds no document (the explanation letter
  was dropped in catalog v18). "With a valid visa" includes a tourist
  visit: visiting is allowed; only coming to stay needs the entry permit
  first. The nationality
  also tells the chat whether a partner abroad enters on an ETA-IL or needs a
  B/2 from the consulate (`lib/visa-exempt.ts`); that's not a question.
- **Name ever changed?**
- **Children from a previous relationship?** If yes, **any under 18 and
  moving to Israel?** If yes, **the other parent's situation**, as a
  multi-choice (siblings can have different other parents): agrees to the
  move / a court gave sole custody or approved the move / died / not listed
  on the birth certificate.

Israeli side only:
- **Where do you live now?** In Israel / outside Israel. Replaced "lived
  outside Israel in recent years?": what matters is where they are now, so
  the chat can tell a couple who both live abroad apart. Living in Israel
  keeps the lease on the list for a couple who never lived together.

## Step 3: your relationship (about the couple)

- **Married or common-law.** These are two separate procedures.
- **Where did you marry:** in Israel (rabbinate or another religious court) /
  in another country (then which) / online (e.g. Utah). See `lib/knowledge/certification.md`
  for why.
- **Do you live together, or have you lived together before?** Asked of
  every couple, married or common-law, then the year they moved in together.
  Living together gets the couple's lease, in both names. A couple who never
  lived together gets the Israeli partner's own lease instead, and the
  landlord's affidavit, when the Israeli partner lives in Israel. Only
  when the Israeli partner lives abroad too are they left out: the couple
  proves the relationship in other ways (`lib/knowledge/documents.md`).
- **Children together?**

## Step 4: branch

"Do you know your branch?" with two cards: I know my branch / Not sure yet.
The branch list only appears for the first. A plain Skip button was too easy
to miss, and it left Continue greyed out for anyone who didn't see it.

## Step 5: stage

The stages offered follow from the answers before: each couple has its own
track (`lib/stages.ts`). A partner abroad waits for an entry permit and
arrives; a couple who both live abroad starts by getting the entry permit at
the consulate, and files after arriving (the document list is still only the
Misrad Hapnim file's); a partner from the former USSR goes through Nativ; a married
couple gets the B/1 before the interview and ends at A/5, a common-law couple
is interviewed first and ends at B/1. Onboarding offers the track up to
the interview; the approval is reached from the overview. The interview is
one stage with its date: once the date has passed, the overview and the chat
treat it as waiting for the decision.
Plus renewal, which isn't supported yet (see `lib/knowledge/process.md` for
the process). Renewal blocks finishing with a yellow notice.

Going back and changing an answer can take the chosen stage off the track;
then the stage step has to be answered again.

After the first stage, the partner's location and the Israeli's residence
mean where they were when the process started: a move to Israel since then
is a stage ("together in Israel"), not a details edit. The details form says
so. A details edit that changes the track asks for the stage again before
saving.

## Server rules

The server repeats the browser's rules: exactly one Israeli side; each
person answers only their role's questions; follow-ups only when their
question was answered that way; no country listed twice, and not the
nationality among "other countries"; a stage on the couple's track.
