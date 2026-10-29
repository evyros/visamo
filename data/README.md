# Data

Research material converted from the sources in `collect/`, one folder per source. It's what the knowledge base in `lib/knowledge` is refined from. Restate what you learn there in our own words rather than copying passages.

These folders are generated: don't edit them by hand. Fix the source's parser in `collect/` and re-run it.

- `facebook/`: posts and comments from Facebook groups, with their images (`posts/`, from `npm run fb:parse` and `npm run fb:images` in `collect/`), plus the capture's progress files (`cursors/`, `expanded.json`, `queries.json`) so a capture can continue where it stopped. They're parsed from raw responses kept locally in `collect/data/facebook/raw/`, which isn't committed.
- `aic/`: aic.org.il, the Israeli Association for International Couples. Its articles (guides and news) with their comments, one Markdown file per article (`npm run aic:parse` in `collect/`).
- `experiences/`: what couples reported in each Facebook thread, as records (`collect/experiences/`: agents following `prompt.md`, saved by `extract.mjs`): the branch, the stage, how it went, the waits. One file per thread.
- `milestones/`: a second pass over the threads that mention the entry permit or the B/1, for the waits from filing to each (`milestones-prompt.md`, saved by `milestones.mjs`). One file per thread.

`experiences/` and `milestones/` seeded the website's branch reports once (`collect/experiences/import.mjs`); from then on they grow through the survey, in the database.

The posts and comments are kept as captured, including people's names and personal details. This repo is private; keep it that way while this folder is in it.
