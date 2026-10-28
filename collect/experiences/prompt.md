# Extracting experiences from a thread

You're reading one thread from a Facebook group of international couples going through the Israeli partner-visa process with Misrad Hapnim (the Population and Immigration Authority, PIBA). Turn it into records: one record per experience a person describes with Misrad Hapnim: a branch, the online forms, the phone line.

The records are research data. They'll be counted and sliced later: by branch, by stage of the process, by how people felt, over time. Extract what the thread says, and nothing it doesn't.

## Input

- The thread: the post, then its comments. Each line starts with its id in brackets. Replies are indented under the comment they answer.
- `collect/experiences/schema.json`: the record's fields and allowed values.
- `collect/experiences/branches.json`: the branches, with their ids and the names people use for them.

## What becomes a record

- **A person describing something that happened to them (or their partner) with Misrad Hapnim**: an application, an appointment, an interview, a renewal, a phone call or an email, a visit, the online forms. `firsthand: "firsthand"`. A comment that tells their own story and then gives advice is `firsthand`.
- **A story about someone they know** ("my friend in Haifa waited a year"). `firsthand: "secondhand"`.
- **Advice that states how a named office works** ("Hadera doesn't take walk-ins"). `firsthand: "advice"`.
- **An opinion of a named office**, even a bare one ("Haifa are excellent", "Ramat Gan was easy"). `firsthand: "firsthand"` with `service: "general"`, and `confidence: "low"` when it doesn't say it's their own experience.
- **A question that states something Misrad Hapnim did**: asked for a document or a guarantee, set a date, refused, hasn't answered for a stated time ("we were asked for a guarantee, how do we pay it?", "applied 6 weeks ago, nothing yet").

Not a record:
- Questions with nothing Misrad Hapnim did in them, including "I applied and I'm waiting" with no wait stated.
- Generic advice ("it depends on your branch", "email them"), explanations of the law or the procedure, "good luck", tags of other people.
- A result mentioned with no story about getting it ("voting for the first time", "my wife has citizenship now").
- Experiences with border control at the airport, consulates abroad, Bituach Leumi, or other authorities. Only Misrad Hapnim.

A thread can have no records at all; that's a valid answer. A thread is `relevant: false` when it isn't about Misrad Hapnim or the visa process at all: social and off-topic threads (introductions, holidays, elections, Hebrew lessons, flats for rent), and other authorities and services (banks, the Ministry of Transport, Bituach Leumi). Those have no records.

**One record per event: per person, office, stage and time.** The same person describing the same visit in the post and in three replies is one record, with all those ids in `source_ids`. A new record when any of these changes:
- the office: a person who moved from Ramat Gan to Tel Aviv gets two records.
- the stage: a first appointment and, later, an interview at the same branch are two records if they say something about each.
- the time: "last year they checked our printed documents, this year only the uploaded ones" is two records, each with its own `experience_when`. Changes over time are what the data is for: never merge them into one `mixed` record.

  Earlier times are easy to miss when they're mentioned in passing, so look for them in every comment: "the previous two years we brought everything printed; this year we got an SMS to upload it all" is two records (the earlier years, and this year). So is "in earlier renewals at the old Bialik Street office we never filled in a form; now they ask for it". The earlier one gets the year if it can be told, and its own experience.

## The branch

- Map the office to an id in `branches.json` by its name or aliases, in any language or spelling. Put the words they used in `branch_text`.
- Where the branch comes from, in order: the comment itself; then the same author's other comments in the thread (a reply to "which branch?"). **The post's branch belongs only to the post's author.** A reply saying "same here" or "we waited 8 months too" doesn't mean the same branch.
- "Jerusalem" with no part of the city is `jerusalem`. "Tel Aviv" with no detail is `tel-aviv`; Jaffa, Yafo or Salame is `jaffa`.
- If the office can't be tied to the person, or isn't in the list, `branch: null`. Never guess. The record still counts.
- Things that aren't a branch stay `branch: null`: the online forms, the national call center (*3450), the guarantees unit at the airport, headquarters. What they were is told by `channels` and `service`.

## Channels

How they dealt with Misrad Hapnim, every one the record mentions: `in-person` (at an office, by appointment or walk-in), `email`, `phone` (a branch or *3450), `sms` (a text message from the office), `online` (the online application, the site, appointment booking), `mail` (by post). Empty when the text doesn't say.

## The fields

- **summary**: one English sentence, enough for a person reviewing the record to check it against the thread.
- **service**: what the experience is about.
  - `application`: the online application, until the first answer from the office. Trying to submit it and failing counts too.
  - `first-appointment`: the first meeting at the branch (handing over documents, the first visa).
  - `interview`: the interview before A/5 or for the gradual process, and its decision. An A/5 given at the interview is `interview`.
  - `renewal`: renewing a B/1 or A/5 visa. `upgrade`: moving from B/1 to A/5 when it isn't decided at an interview, or to permanent residence.
  - `citizenship`: the citizenship application, its interview, the decision and the ceremony.
  - `reentry-permit`: permission to leave and come back during the process.
  - `entry-permit`: the foreign partner's entry permit, whether the Israeli partner asks for it in Israel or the foreign partner applies from abroad.
  - `relative-invitation`: inviting parents or other relatives to visit. `visa-extension`: extending a tourist visa.
  - `guarantee`: the deposit or bank guarantee Misrad Hapnim asks for, and handing it in.
  - `general`: the office or the process as a whole, with no single stage ("we did the whole process at Ramat Gan, it was easy", "Haifa are excellent").
  - `other`: a stage that isn't any of these (registering a baby, a passport). When the stage is clear from the thread's topic but not the comment, use the thread's.
  - Something that happens at many stages takes the stage it happened at: a visa sticker in the passport, proof of an extended visa, a document accepted or refused (a translation, a certificate). A sticker for the first B/1 is `first-appointment`; for an extended A/5, `renewal`. Only when the stage can't be told at all, `other`.
- **track**: `married` or `common-law` only when the person says so or it's clear (a wedding, a husband or wife). Otherwise null.
- **dates**: only what's stated or can be worked out exactly ("we applied on July 3" in a post from 2026 is `2026-07-03`; "in July" is `2026-07`). Use the comment's date to resolve "last month", "two weeks ago". Leave the rest null.
- **waits**: every wait stated between two events of the process, in days (a week is 7, a month is 30), with the words it was stated in. The events, in the order they happen:
  - `applied`: the application was sent (online, by email, or handed in).
  - `first-response`: the office's first answer to it: a request for documents, an appointment, a refusal.
  - `appointment-set`: they were given an appointment. `appointment`: the appointment's own day.
  - `interview`: the interview (before A/5, for the gradual process, or for citizenship).
  - `decision`: the office's answer after an appointment or interview: the visa, the approval, a refusal.
  - `ceremony`: the citizenship ceremony.

  Examples: "applied in May, they answered in July" is `applied` → `first-response`, 60. "They gave us an appointment in 8 months" is `appointment-set` → `appointment`, 240. "8 months from the interview to the answer" is `interview` → `decision`, 240. A wait still going on counts, with `ongoing: true` and the days so far ("applied 3 months ago, nothing yet": `applied` → `first-response`, 90). An answer given on the spot is 0 days.

  Not a wait: how long the whole process took or has taken ("we're 5 years into the process"), hours spent at the office on the day, time they spent themselves (filling in a form, gathering documents), and waits whose start or end isn't clear ("for the A5 I waited 6 months", from what?). Leave those out.
- **experience_when**: when it happened: `YYYY-MM` when the month can be told (for "yesterday" or "this week", the comment's month), `YYYY` when only the year can ("about two years ago", "in 2022"). Null when neither can be told: don't fall back to the comment's date, that's added separately.
- **experience**: how the person felt about dealing with this office.
  - `positive`, `negative`, `mixed` (both, e.g. a kind clerk and a 9-month wait), `neutral` (factual, no judgment).
  - Judge whether the person is saying how dealing with the office went, or reporting a fact about how it works:
    - "It went smoothly", "no problems at all", "got the answer on the same day", "they were lovely", "excellent office" say how it went: `positive`.
    - "We went without printed copies, no issues", "they accepted the English certificate", "they didn't ask for a translation", "got the sticker with no problem" answer a question about what the office does: `neutral`, and the fact goes in `practices` ("Doesn't need printed copies of documents uploaded online").
    - The same on the negative side: "they asked for an apostille" is a fact (`neutral`, with `strictness: negative` when it's more than the official list). "They sent us home after 3 hours over one missing paper" says how it went: `negative`.
  - `neutral` is also for reports that say what happened without saying how it went ("the interview was 30 minutes, they asked how we met").
  - Judge the office, not the law. A refusal because of the rules, explained well, isn't negative for the office. A refusal with no explanation, or after conflicting instructions, is.
  - Null for `secondhand` and `advice`.
- **aspects**: each `positive`, `negative`, `neutral`, or `not-mentioned`. Use `not-mentioned` whenever the text says nothing about it; don't infer from the overall mood. Only `firsthand` records are judged: for `secondhand` and `advice`, every aspect is `not-mentioned` (what they say goes in `practices`).
  - `staff`: how the clerks treated them.
  - `communication`: answering emails and phones, explaining what's needed, letting them know about changes.
  - `organization`: appointments kept, documents not lost, consistent instructions, the process at the office, mistakes in what they issued (a wrong name on a visa).
  - `strictness`: how demanding they were about documents and rules. `negative` means more demanding than expected or than the official list; `positive` means flexible or reasonable.
- **busy_signals**: only what the text says. `appointment-far` is an appointment months away. `no-reply` is emails or calls not answered. Fill it for every kind of record, `advice` and `secondhand` too: "Tel Aviv answers emails with a backlog of a month and a half" is `no-reply`; "they hand out a limited number of queue numbers at 8, come at 7" is `long-queue`; "interviews are about seven months away" is `appointment-far`. The same fact also goes in `practices`.
- **practices**: how this office works, as short English sentences that would hold for other couples ("Asks for the documents 3 months before the interview", "Interviews the partners separately", "Gives the A/5 for two years", "Issues the A/5 and ID card on the spot"). Not the person's own case details, and not rules that apply everywhere ("a guarantee isn't required in every file"): only what this office does, or does differently.
- **war_related**: true when the war or the security situation caused what happened (cancelled appointments, closed offices).
- **confidence**: `high` when the record is stated plainly; `medium` when you had to combine comments or interpret; `low` when it's unclear but still worth keeping.

## Language

Posts are in English, Hebrew, and sometimes other languages. Records are always in English. Copy names and ids exactly as they appear.

## Output

A JSON object, matching `output` in the schema, with each record matching `record`. Nothing else in the file.

```json
{ "relevant": true, "records": [ … ] }
```

`relevant` is whether the thread is about Misrad Hapnim or the visa process at all, even when it has no records (see "What becomes a record").
