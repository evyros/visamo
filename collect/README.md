# Data collection

Local-only scripts that collect research material on the B1 → A5 partner process. Everything they write goes to `data/`, which is gitignored: it includes other people's posts and photos of their documents, so it never leaves this machine.

```sh
cd collect && npm install
```

## Facebook group

1. Switch your Facebook interface to English (it makes "View more comments" detection reliable).
2. Capture the feed, or search results within the group. The first run opens Chrome with a fresh profile: log in there once.
   ```sh
   npm run fb:capture -- feed --group <group id or URL> --scrolls 150
   npm run fb:capture -- feed --group <group id or URL> --query "הליך מדורג"
   ```
   Each run saves the furthest point back in time it reached in `data/facebook/cursors/` (one file per group, and per search). A later, shorter run doesn't overwrite it. To continue from that point instead of from the top, add `--resume`; `--scrolls` then counts pages of about 3 posts each:
   ```sh
   npm run fb:capture -- feed --group <group id or URL> --resume --scrolls 300
   ```
3. `npm run fb:parse` writes a folder per post: `data/facebook/posts/<id>/post.json` and `comments/<comment id>.json` (replies included, linked by `parent_comment_id`), plus an `images.jsonl` index. These are rebuilt from `raw/` on every run, so don't edit them by hand.
4. `npm run fb:capture -- posts --limit 40` opens each post and expands all of its comments. Re-run it until every post is done (progress is kept in `expanded.json`).
5. `npm run fb:parse && npm run fb:images` downloads images into each post's `images/` folder. Image URLs expire, so do it soon after capturing.

Every response is saved as its own file, `data/facebook/raw/<run>/<seq>-<query>.json`, holding Facebook's JSON as-is (about 0.5–1.5 MB each). These files are never modified. If the parser misses something, fix `parse.mjs` and re-run it; there's no need to scrape again.

Go slowly: keep to a few hundred posts a session. The scripts pause between actions, but heavy runs can still get the account rate-limited.
