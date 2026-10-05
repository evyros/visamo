# Data collection

Local-only scripts that collect research material on the B1 → A5 partner process. Their working files (raw captures, browser profiles) go to `collect/data/`, which is gitignored. The results the knowledge base relies on are written to the repo's `data/` instead, and committed (see `data/README.md`).

```sh
cd collect && npm install
```

## Facebook group

Posts, comments, images and the capture's progress (cursors, which posts have their comments) go to the repo's `data/facebook/` and are committed, so a capture can be continued from any checkout. The raw responses and the browser profile (it holds the logged-in session) stay in the gitignored `collect/data/facebook/`.

1. Capture the feed, or search results within the group. The first run opens Chrome with a fresh profile: log in there once.
   ```sh
   npm run fb:capture -- feed --group <group id or URL> --scrolls 150
   npm run fb:capture -- feed --group <group id or URL> --query "הליך מדורג"
   ```
   Each run saves the furthest point back in time it reached in the repo's `data/facebook/cursors/` (one file per group, and per search). A later, shorter run doesn't overwrite it. To continue from that point instead of from the top, add `--resume`; `--scrolls` then counts pages of about 3 posts each:
   ```sh
   npm run fb:capture -- feed --group <group id or URL> --resume --scrolls 300
   ```
   Add `--comments` to also load each post's comments as the feed brings it in (slower: a few seconds to half a minute per post, depending on how many replies it has).
2. `npm run fb:parse` writes a folder per post: `data/facebook/posts/<id>/post.json` and `comments/<comment id>.json` (replies included, linked by `parent_comment_id`), plus an `images.jsonl` index. Every run rewrites the posts and comments found in `raw/`, so don't edit them by hand. It never deletes: posts already in `data/facebook/` that this checkout's `raw/` doesn't have are left as they are.
3. `npm run fb:capture -- posts --limit 40` loads the comments of posts that don't have them yet, newest first. Re-run it until it says 0 posts (progress is kept in `expanded.json`). `--post <id>,<id>` reloads specific posts, e.g. to pick up new comments. Each post prints how many comments it got next to Facebook's own count.
4. `npm run fb:parse && npm run fb:images` downloads images into each post's `images/` folder. Image URLs expire, so do it soon after capturing.

Every response is saved as its own file, `collect/data/facebook/raw/<run>/<seq>-<query>.json`, holding Facebook's JSON as-is (about 0.5–1.5 MB each). These files are never modified. If the parser misses something, fix `parse.mjs` and re-run it; there's no need to scrape again.

Comments are loaded with the same requests Facebook's post page makes (`facebook/comments.mjs`), sent from inside the logged-in page, so no post is opened and nothing is clicked. Facebook renames these requests' `doc_id` when it deploys; the script picks up the new one whenever the page makes that request itself (the repo's `data/facebook/queries.json`). If comment loading starts failing with an error anyway, the request format has changed and `comments.mjs` needs updating.

Go slowly: keep to a few hundred posts a session. The scripts pause between actions, but heavy runs can still get the account rate-limited.

## AIC (aic.org.il)

The Israeli Association for International Couples' site: its articles (guides and news) with their comments. The events calendar and the lawyers index aren't collected. It's a small WordPress site behind Cloudflare, so it's read with a real browser, not plain HTTP requests.

1. `npm run aic:capture` opens Chrome (its own profile in `data/aic/.browser-profile/`), logs in with the test account in `aic/lib.mjs`, and visits every page in the sitemap plus every on-site link it finds, except tag and author pages (`/tag/`, `/author/`), the events calendar (`/events/`, venues, organizers) and the lawyers index (`/lawyers/` and its filter pages). Each page's HTML is saved as-is to `data/aic/raw/<run>/`, listed in that run's `index.jsonl`. Documents linked from the pages (PDF, Word…) go to `data/aic/files/`. `--only <url>,<url>` re-captures specific pages, e.g. to pick up new comments.
2. `npm run aic:parse` writes one Markdown file per article to the repo's `data/aic/<slug>.md`, from the latest capture of each page. Only articles are kept: the site's other pages (about, contact, legal, listings) hold nothing to learn from. Unlike everything under `collect/data/`, these files are committed: they're what the knowledge base is refined from. Each file has front matter (URL, author, dates, categories, tags, comment count), the article, then its comments with author and date, replies quoted under the comment they answer. `data/aic/index.md` lists every article and holds the capture date, so re-running with nothing new on the site leaves the files unchanged and a later capture's diff shows exactly what changed. The folder is rebuilt on every run; if something comes out wrong, fix `parse.mjs` and re-run it.
