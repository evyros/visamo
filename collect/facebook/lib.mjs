import fs from "node:fs";
import path from "node:path";

// Committed, in the repo's data/. The raw responses (large) and the browser profile
// (the logged-in session) stay in the gitignored collect/data/.
export const DATA_DIR = path.resolve(import.meta.dirname, "..", "..", "data", "facebook");
const LOCAL_DIR = path.resolve(import.meta.dirname, "..", "data", "facebook");
export const RAW_DIR = path.join(LOCAL_DIR, "raw");
export const POSTS_DIR = path.join(DATA_DIR, "posts");
export const PROFILE_DIR = path.join(LOCAL_DIR, ".browser-profile");
export const CURSORS_DIR = path.join(DATA_DIR, "cursors");
export const EXPANDED_FILE = path.join(DATA_DIR, "expanded.json");

for (const dir of [DATA_DIR, RAW_DIR, POSTS_DIR, CURSORS_DIR]) fs.mkdirSync(dir, { recursive: true });

// `--key value` and bare `--flag` pairs; the first non-flag word is the command.
export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      args._.push(a);
      continue;
    }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) args[a.slice(2)] = true;
    else args[a.slice(2)] = argv[++i];
  }
  return args;
}

// Facebook answers GraphQL with a `for (;;);` guard and several JSON documents
// separated by newlines (streamed/deferred fragments). Return each one parsed.
export function parseBodies(text) {
  const stripped = text.replace(/^for \(;;\);/, "");
  try {
    return [JSON.parse(stripped)];
  } catch {
    // Several documents, one per line.
  }
  const out = [];
  for (const line of stripped.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
      // Partial or non-JSON chunk; the raw file still holds it.
    }
  }
  return out;
}

export function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export function writeJsonl(file, rows) {
  fs.writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
}

// Each post is a folder: posts/<id>/post.json, comments/<comment id>.json and
// images/ (filled by images.mjs). posts/ is committed but raw/ isn't, so a parse
// only adds and updates: a post or comment missing from raw/ (another checkout,
// lost raw files) is left as it is, never deleted.
export const postDir = (postId) => path.join(POSTS_DIR, String(postId));

// Folder names only: Finder leaves .DS_Store files in here.
function postIds() {
  return fs
    .readdirSync(POSTS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

// Overwrites the row on disk with the parsed one, keeping the earlier first_seen
// in case the raw file that saw it first is gone.
function writeRow(file, row) {
  const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
  if (old?.first_seen && (!row.first_seen || old.first_seen < row.first_seen)) row = { ...row, first_seen: old.first_seen };
  fs.writeFileSync(file, JSON.stringify(row, null, 2) + "\n");
}

export function writePosts(posts, comments) {
  const byPost = Map.groupBy(comments, (c) => c.post_id);
  for (const post of posts) {
    const dir = path.join(postDir(post.id), "comments");
    fs.mkdirSync(dir, { recursive: true });
    writeRow(path.join(postDir(post.id), "post.json"), post);
    for (const c of byPost.get(post.id) ?? []) writeRow(path.join(dir, `${c.id}.json`), c);
  }
}

export function readPosts() {
  return postIds()
    .map((id) => path.join(postDir(id), "post.json"))
    .filter((file) => fs.existsSync(file))
    .map((file) => JSON.parse(fs.readFileSync(file, "utf8")));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const between = (min, max) => min + Math.floor(Math.random() * (max - min));
