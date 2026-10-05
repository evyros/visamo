// Records the data Facebook sends the browser while you browse a group.
//
//   node facebook/capture.mjs feed  --group <id|slug|url> [--query "הליך מדורג"] [--scrolls 150] [--resume] [--comments]
//   node facebook/capture.mjs posts [--limit 40] [--post <id>,<id>]
//
// `feed` scrolls the group (or the group's search results for --query). It saves
// where it stopped in data/facebook/cursors/; `--resume` continues from there
// instead of scrolling from the top again.
// `--comments` also loads each new post's comments as soon as the feed shows it.
// `posts` loads the comments of every post found so far that doesn't have them yet
// (run parse.mjs first). Comments are loaded by comments.mjs, without opening posts.
// Each response becomes one file in collect/data/facebook/raw/<run>/; parse.mjs turns them into rows.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { chromium } from "playwright";
import { createCommentLoader } from "./comments.mjs";
import {
  CURSORS_DIR,
  EXPANDED_FILE,
  PROFILE_DIR,
  RAW_DIR,
  between,
  parseArgs,
  parseBodies,
  readPosts,
  sleep,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const mode = args._[0];
if (mode !== "feed" && mode !== "posts") {
  console.error(
    "usage: capture.mjs feed --group <id|url> [--query q] [--scrolls n] [--resume] [--comments] | capture.mjs posts [--limit n]",
  );
  process.exit(1);
}

const runId = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = path.join(RAW_DIR, `${runId}-${mode}`);
let captured = 0;
let skipped = 0;

// Only responses carrying posts, comments or photos are kept. The rest (login,
// 2FA, notifications, chat, ads, telemetry) never touches the disk.
const CONTENT = /"__typename":"(Story|Comment|Photo)"/;

// One file per response, e.g. raw/<run>/00042-GroupsCometFeedRegularStoriesPaginationQuery.json,
// holding Facebook's JSON as-is (several documents when the response was streamed).
function record({ body, ...entry }) {
  if (!CONTENT.test(body)) {
    skipped++;
    return;
  }
  if (mode === "feed" && args.comments) {
    // Links to this group's posts (JSON-escaped: groups\/<group>\/permalink\/<id>); the page
    // also links to posts elsewhere, which aren't collected.
    for (const m of body.matchAll(postLink)) if (!expanded.has(m[1])) waiting.add(m[1]);
  }
  captured++;
  fs.mkdirSync(runDir, { recursive: true });
  const file = path.join(runDir, `${String(captured).padStart(5, "0")}-${entry.name || entry.kind}.json`);
  const docs = parseBodies(body);
  fs.writeFileSync(file, JSON.stringify({ fetched_at: new Date().toISOString(), ...entry, docs }, null, 2) + "\n");
}

// The feed and search queries that load the next batch of posts.
const PAGINATION = /^(GroupsCometFeedRegularStoriesPaginationQuery|SearchComet\w*Paginat\w*Query)$/;
let template = null; // The first pagination request this session; --resume replays it with our cursor.

// Each page of results ends with page_info.end_cursor: where the next page starts.
function nextCursor(docs) {
  for (const doc of docs) {
    if (doc.label?.endsWith("$page_info") && doc.data?.page_info) return doc.data.page_info;
  }
  const seen = [];
  (function find(node, inFeedback) {
    if (!node || typeof node !== "object" || seen.length) return;
    if (!inFeedback && typeof node.page_info?.end_cursor === "string") seen.push(node.page_info);
    for (const [key, value] of Object.entries(node)) find(value, inFeedback || key === "feedback");
  })(docs[0]);
  return seen[0] ?? null;
}

function cursorFile() {
  const slug = String(args.group).match(/groups\/([^/?#]+)/)?.[1] ?? args.group;
  const what = args.query ? `search-${String(args.query).replace(/[^\p{L}\p{N}]+/gu, "_")}` : "feed";
  return path.join(CURSORS_DIR, `${slug}-${what}.json`);
}

// How far back a page reaches: its newest post. (The oldest would be thrown off by
// old posts shared inside new ones.)
function pageReach(body) {
  const times = [...body.matchAll(/"creation_time":(\d+)/g)].map((m) => Number(m[1]));
  return times.length ? new Date(Math.max(...times) * 1000).toISOString() : null;
}

// The saved cursor only moves back in time, so a quick run for new posts
// doesn't throw away how deep earlier runs got.
function saveCursor(name, pageInfo, reach) {
  const file = cursorFile();
  const saved = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  if (saved?.reached && reach && reach > saved.reached) return;
  fs.writeFileSync(
    file,
    JSON.stringify(
      { name, end_cursor: pageInfo.end_cursor, has_next_page: pageInfo.has_next_page, reached: reach, saved_at: new Date().toISOString() },
      null,
      2,
    ),
  );
}

// Your own Chrome, with a separate profile kept in collect/data/: log in once, it stays logged in.
const context = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: "chrome",
  headless: false,
  viewport: null,
  args: ["--start-maximized"],
});
const page = context.pages()[0] ?? (await context.newPage());
const comments = createCommentLoader(page);

// Posts whose comments were loaded already (by `posts` or `feed --comments`).
const expanded = new Set(fs.existsSync(EXPANDED_FILE) ? JSON.parse(fs.readFileSync(EXPANDED_FILE, "utf8")) : []);
const waiting = new Set(); // Group posts seen in this `feed --comments` run, comments not loaded yet.
const groupSlug = String(args.group ?? "").match(/groups\/([^/?#]+)/)?.[1] ?? String(args.group ?? "");
const postLink = new RegExp(`groups\\\\?/${groupSlug.replace(/\W/g, "\\$&")}\\\\?/(?:permalink|posts)\\\\?/(\\d+)`, "g");

async function loadComments(postId, label) {
  const { loaded, total } = await comments.load(postId);
  expanded.add(postId);
  fs.writeFileSync(EXPANDED_FILE, JSON.stringify([...expanded]));
  const short = total !== null && loaded < total ? "  (fewer than Facebook's count)" : "";
  console.log(`${label}post ${postId}: ${loaded}/${total ?? "?"} comments${short}`);
}

async function loadWaitingComments() {
  for (const postId of [...waiting]) {
    waiting.delete(postId);
    await loadComments(postId, "\n");
    await sleep(between(3000, 8000));
  }
}

page.on("response", async (res) => {
  if (!res.url().includes("/api/graphql")) return;
  const request = res.request();
  let name = "";
  try {
    name = new URLSearchParams(request.postData() ?? "").get("fb_api_req_friendly_name") ?? "";
  } catch {}
  comments.observe(request, name);
  let body;
  try {
    body = await res.text();
  } catch {
    return; // Navigated away before the body arrived.
  }
  if (mode === "feed" && PAGINATION.test(name)) {
    template ??= { name, url: request.url(), postData: request.postData(), headers: request.headers() };
    // While resuming, the cursor is advanced by the resume loop, not by pages the site loads itself.
    const pageInfo = nextCursor(parseBodies(body));
    if (!args.resume && pageInfo?.end_cursor) saveCursor(name, pageInfo, pageReach(body));
  }
  record({ kind: "graphql", name, page_url: page.url(), body });
});

// The first screen of a page (the post itself on a permalink, the first feed
// items) is embedded in the HTML rather than fetched over GraphQL.
async function recordEmbedded() {
  const blobs = await page
    .$$eval('script[type="application/json"]', (els) => els.map((e) => e.textContent ?? ""))
    .catch(() => []);
  for (const body of blobs) {
    record({ kind: "embedded", page_url: page.url(), body });
  }
}

async function open(url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await sleep(between(3000, 5000));
  const loggedOut = page.url().includes("/login") || (await page.locator('input[name="email"]').count()) > 0;
  if (loggedOut) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    await rl.question("Log in to Facebook in the browser window, then press Enter here… ");
    rl.close();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await sleep(between(3000, 5000));
  }
  await recordEmbedded();
}

function groupBase(group) {
  const slug = String(group).match(/groups\/([^/?#]+)/)?.[1] ?? group;
  return `https://www.facebook.com/groups/${slug}`;
}

async function captureFeed() {
  if (!args.group) throw new Error("--group is required");
  const base = groupBase(args.group);
  const url = args.query
    ? `${base}/search/?q=${encodeURIComponent(args.query)}`
    : `${base}/?sorting_setting=CHRONOLOGICAL`;
  await open(url);
  if (args.comments) await comments.ready();

  const maxScrolls = Number(args.scrolls ?? 150);
  if (args.resume) return resumeFeed(maxScrolls);
  let idle = 0;
  for (let i = 0; i < maxScrolls && idle < 8; i++) {
    const before = captured;
    await page.mouse.wheel(0, between(1200, 2800));
    await sleep(between(2500, 5500));
    if (i > 0 && i % 25 === 0) await sleep(between(20000, 40000)); // Read a bit, like a person.
    idle = captured === before ? idle + 1 : 0;
    process.stdout.write(`\rscroll ${i + 1}/${maxScrolls} · ${captured} responses`);
    if (args.comments) await loadWaitingComments();
  }
  process.stdout.write("\n");
}

// Continues from the saved cursor: waits for the page's own first "load more"
// request, then repeats it with the saved cursor, one page of posts at a time.
async function resumeFeed(maxPages) {
  const file = cursorFile();
  if (!fs.existsSync(file)) throw new Error(`Nothing to resume: ${path.relative(process.cwd(), file)} doesn't exist yet.`);
  let cursor = JSON.parse(fs.readFileSync(file, "utf8"));
  if (cursor.has_next_page === false) return console.log("Already at the end of the feed.");
  console.log(`Resuming from ${cursor.reached?.slice(0, 10) ?? "the saved position"}`);

  for (let i = 0; i < 15 && !template; i++) {
    await page.mouse.wheel(0, between(1200, 2800));
    await sleep(between(2500, 4500));
  }
  if (!template) throw new Error("The page never asked for more posts, so there's no request to resume with.");

  const variables = JSON.parse(new URLSearchParams(template.postData).get("variables") ?? "{}");
  if (!("cursor" in variables)) {
    throw new Error(`Unexpected ${template.name} request (no cursor variable; has: ${Object.keys(variables).join(", ")})`);
  }
  // Headers the browser lets a page set; cookies and the rest are added by Chrome itself.
  const headers = Object.fromEntries(
    Object.entries(template.headers).filter(([k]) => k === "content-type" || k.startsWith("x-")),
  );

  for (let i = 0; i < maxPages; i++) {
    const body = new URLSearchParams(template.postData);
    body.set("variables", JSON.stringify({ ...variables, cursor: cursor.end_cursor }));
    const text = await page.evaluate(
      async ({ url, headers, body }) => (await fetch(url, { method: "POST", headers, body, credentials: "include" })).text(),
      { url: template.url, headers, body: body.toString() },
    );
    const pageInfo = nextCursor(parseBodies(text));
    if (!pageInfo?.end_cursor) throw new Error("Facebook's answer had no next-page cursor; stopping (the saved cursor is unchanged).");
    const reach = pageReach(text);
    saveCursor(template.name, pageInfo, reach);
    cursor = pageInfo;
    process.stdout.write(`\rpage ${i + 1}/${maxPages} · back to ${reach?.slice(0, 10) ?? "?"} · ${captured} responses`);
    if (args.comments) await loadWaitingComments();
    if (pageInfo.has_next_page === false) {
      process.stdout.write("\nReached the end of the feed.");
      break;
    }
    await sleep(between(3000, 7000));
    if (i > 0 && i % 25 === 0) await sleep(between(20000, 40000));
  }
  process.stdout.write("\n");
}

async function capturePosts() {
  // Newest first, so a limited run covers the latest discussions.
  const posts = readPosts()
    .filter((p) => p.group)
    .sort((a, b) => (b.posted_at ?? "").localeCompare(a.posted_at ?? ""));
  if (!posts.length) throw new Error("No posts yet: run `capture.mjs feed` and then `parse.mjs` first.");
  // --post <id>[,<id>…] (re)loads just those posts, even if they were loaded before.
  const only = args.post ? new Set(String(args.post).split(",")) : null;
  const todo = only
    ? posts.filter((p) => only.has(p.id))
    : posts.filter((p) => !expanded.has(p.id)).slice(0, Number(args.limit ?? 40));
  console.log(`${todo.length} posts to load comments for (${expanded.size} done before)`);
  if (!todo.length) return;

  await open(`https://www.facebook.com/groups/${todo[0].group}`);
  await comments.ready();
  for (const [i, post] of todo.entries()) {
    await loadComments(post.id, `[${i + 1}/${todo.length}] `);
    await sleep(between(3000, 8000));
  }
}

try {
  if (mode === "feed") await captureFeed();
  else await capturePosts();
} finally {
  await sleep(2000); // Let in-flight responses finish writing.
  await context.close();
  console.log(`${captured} responses with content saved to ${path.relative(process.cwd(), runDir)}/ (${skipped} others ignored)`);
}
