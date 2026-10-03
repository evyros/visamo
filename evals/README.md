# Evals

The AI features, run against the real models and graded against cases a
person approved, so a change to a prompt, a document's checks or the knowledge
base shows what it broke and what it fixed. They cost money and take minutes,
so they're apart from `npm test` (vitest.evals.config.mts). Model calls are
cached in `evals/.cache` by what was sent: running again after a change only
pays for what the change touched (`EVAL_NO_CACHE=1` asks again). 8 cases
run at once (`EVAL_CONCURRENCY`), each sending its runs together; a call
OpenRouter turns away for now is made again after the wait it asks for.

## The document check (`evals/checks`)

```
npm run eval:checks                        every case
EVAL_FILTER=foreignPhotos npm run eval:checks     a document's cases
EVAL_FILTER="statusApplicationMarried/no request marked|foreignPhotos/clean" npm run eval:checks
                                           several cases, between "|"
```

A folder per document, named by its catalog id, with its files in `files/`
and its cases in `cases.json` (the format is in `checks/cases.ts`). One clean
document per type, and a file for each defect worth testing. Many cases can
share a file: a case can set its own couple (`scenario`, from
lib/documents/scenarios.ts), `today` or `branch`, so "issued too long ago"
is the clean file with a later `today`, and "no apostille" is the clean file
without its apostille file. Only fake people, on real templates: these files
are in the repo.

Each case runs `EVAL_RUNS` times (3), as the app checks it. A run passes when:

- its rating is one the case allows,
- it reported every check in `flagged` (checks in `mayFlag` can go either way),
- no finding is in the wrong list (an issue for a recommended check), and
- every finding the case didn't expect is judged right.

The checker gives each finding the id of the check it's for, so this is plain
code. The findings the case didn't expect go to the judge (a stronger model,
`EVAL_JUDGE_MODEL`, shown the same files): it calls each one approved (it
matches the case's `allowedExtra`), right but not reviewed yet, or wrong. A
wrong one fails the run. A right one doesn't, but it's listed under "To
review" in the report: approve it into `allowedExtra` (or the check into
`flagged` or `mayFlag`), or fix the files if it found a flaw in them.

A case passes when all its runs pass. A case whose files aren't in `files/` yet is skipped, with what to add.

### The report

The terminal shows a row per document: its pass rate, failing cases,
findings to review, its cost without the cache (the checker's, the judge's
and both), and what one run of a case costs on average; then the total, and the run's actual
cost (calls already made come from the cache, and cost nothing again).

Every run is saved, not committed, to `evals/.out/runs/<day>/<time>/`:
`results.json` (all of it, as data) and `report.html`. The newest report is
also `evals/.out/runs/latest.html`: open it in a browser. It's made from the
results by a template (no model writes it), and shows:

- what changed since each case's last run: cases that started or stopped
  passing, and checks they report now and didn't, or the other way;
- each document's title and id, its cost split into the checker's and the
  judge's, and what one run of a case costs; ⚖️ marks the cases and runs
  where the judge reviewed findings;
- each case: the couple, the files (click one to see it, or open it in a
  new tab), what it expects, and every run's findings, each with its check
  and what became of it (expected, approved, to review, wrong), and the
  judge's reason;
- each check's catch rate and wrong findings.

Every section starts folded; its heading says what needs attention.

### From a dismissal

A finding a couple dismissed as the check's mistake is a case: copy the files
from the run into `files/`, and write the case with what the check should
have said. The case for it fails until the check is fixed.
