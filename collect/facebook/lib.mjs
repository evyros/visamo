import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = path.resolve(import.meta.dirname, "..", "data", "facebook");
export const RAW_DIR = path.join(DATA_DIR, "raw");
export const POSTS_DIR = path.join(DATA_DIR, "posts");
export const PROFILE_DIR = path.join(DATA_DIR, ".browser-profile");
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
// images/ (filled by images.mjs). Rewritten on every parse so it mirrors the
// latest parse; downloaded images are never deleted.
export const postDir = (postId) => path.join(POSTS_DIR, String(postId));

export function writePosts(posts, comments) {
  const byPost = Map.groupBy(comments, (c) => c.post_id);
  const keep = new Set(posts.map((p) => String(p.id)));
  for (const id of fs.readdirSync(POSTS_DIR)) {
    if (keep.has(id)) continue;
    fs.rmSync(path.join(postDir(id), "post.json"), { force: true });
    fs.rmSync(path.join(postDir(id), "comments"), { recursive: true, force: true });
    if (!fs.readdirSync(postDir(id)).length) fs.rmdirSync(postDir(id));
  }
  for (const post of posts) {
    const dir = path.join(postDir(post.id), "comments");
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(postDir(post.id), "post.json"), JSON.stringify(post, null, 2) + "\n");
    for (const c of byPost.get(post.id) ?? []) {
      fs.writeFileSync(path.join(dir, `${c.id}.json`), JSON.stringify(c, null, 2) + "\n");
    }
  }
}

export function readPosts() {
  return fs
    .readdirSync(POSTS_DIR)
    .map((id) => path.join(postDir(id), "post.json"))
    .filter((file) => fs.existsSync(file))
    .map((file) => JSON.parse(fs.readFileSync(file, "utf8")));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const between = (min, max) => min + Math.floor(Math.random() * (max - min));
