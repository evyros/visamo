# Extracting milestone waits from a thread

You're reading one thread from a Facebook group of international couples going through the Israeli partner-visa process with Misrad Hapnim. Find every wait someone reports **from filing their partner-visa application to one of two milestones**:

- `entryPermit`: the **entry permit** for a foreign partner who is abroad (היתר כניסה; people also call it "the invitation", הזמנה, or אסמכתא): Misrad Hapnim's approval for the partner to enter Israel for the process.
- `b1Visa`: the **first B/1 visa** of the partner-visa process (ב/1, "B1", "work visa" in this context): issued at the first appointment, or after an interview.

These are research data: they'll be counted to show how long each milestone takes, overall and per branch. Extract what the thread says, and nothing it doesn't.

## Input

- The thread: the post, then its comments. Each line starts with its id in brackets. Replies are indented under the comment they answer.
- `collect/experiences/branches.json`: the branches, with their ids and the names people use for them.

## What counts

A wait counts when it **starts when the couple filed** (sent the online partner-visa application, or handed in the first documents for it) and **ends at the milestone** (the permit or the B/1 was issued), or is still running.

- "We applied in March and got the B1 in August" → `b1Visa`, 150 days.
- "Filed on 2 May, the invitation for my husband arrived on 20 June" → `entryPermit`, 49 days.
- "It's been 4 months since we applied and still no entry permit" → `entryPermit`, 120 days, `ongoing: true`.
- "We got the B/1 at the first appointment, 3 months after applying" → `b1Visa`, 90 days.

**The start has to be the filing itself.** An appointment, an interview, or handing in documents at the office isn't the filing, unless they say it's when they applied. "At our first appointment they gave the B/1 on the spot" is a wait only when they also say how long after filing that appointment was; "the permit came the same day as the appointment" is not a 0-day wait.

Doesn't count:

- Waits between other events: filing to the first answer or to an appointment, an appointment to the interview, the interview to the decision, appointment dates, renewals, A/5, permanent residence, citizenship.
- Tourist visas and ETA-IL, B/2 extensions, invitations of parents or other relatives, work visas that aren't the partner-visa B/1.
- Generalizations with no case behind them ("usually it takes 3 months", "it can take up to a year").
- A wait with no length you can tell ("it took forever", "we waited a while").
- Experiences at border control or a consulate.

A thread can have no milestones at all; that's a valid answer.

## The fields

- **source_ids**: the post and comment ids it's taken from.
- **author_id**: the id of the person whose case it is, as it appears in the thread. **firsthand**: `firsthand` for their own (or their partner's) case, `secondhand` for a specific case of someone they know.
- **branch**: an id from `branches.json`, or null. The same rules as always: from the comment itself, then the same author's other comments in the thread; the post's branch belongs only to the post's author; "same here" doesn't carry a branch; never guess. **branch_text**: the words they used for it, or null.
- **stage**: `entryPermit` or `b1Visa`.
- **filed**, **reached**: the dates, as exact as stated (`2026-03-14`, `2026-03`, or null). Resolve "last month" from the comment's date.
- **days**: the wait in days, stated or worked out from the dates (a week is 7, a month is 30; "March to August" is 150). For an ongoing wait, the days so far.
- **ongoing**: true when they're still waiting for the milestone.
- **when**: when the milestone came (or now, for an ongoing one), `YYYY-MM`, or `YYYY` when only the year is known, or null.
- **war_related**: true when the war or the security situation caused the delay.
- **text**: the words the wait was stated in, copied as written.

**One per person, per milestone**, unless they describe two separate processes (a second partner, years apart).

## Output

A JSON object, nothing else in the file:

```json
{ "milestones": [ { "source_ids": ["…"], "author_id": "…", "firsthand": "firsthand", "branch": "hadera", "branch_text": "Hadera", "stage": "b1Visa", "filed": "2026-03", "reached": "2026-08", "days": 150, "ongoing": false, "when": "2026-08", "war_related": false, "text": "applied in March, got the B1 in August" } ] }
```
