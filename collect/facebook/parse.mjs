// Rebuilds posts/<id>/post.json, posts/<id>/comments/*.json and images.jsonl from every raw capture.
// Safe to re-run: rows are keyed by Facebook id and merged across captures.
//
//   node facebook/parse.mjs
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, RAW_DIR, writeJsonl, writePosts } from "./lib.mjs";

const posts = new Map();
const comments = new Map();
const images = new Map();

// Story and comment ids are base64 globals: "S:_I<actor>:<post>…" and "comment:<post>_<comment>".
function decodeId(id) {
  if (typeof id !== "string" || /^\d+$/.test(id)) return id ?? null;
  try {
    return Buffer.from(id, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function storyId(node) {
  if (node.post_id) return String(node.post_id);
  const decoded = decodeId(node.id);
  return decoded?.startsWith("S:") ? decoded.match(/(\d+)(?!.*\d)/)?.[1] ?? null : null;
}

function commentIds(node) {
  const decoded = decodeId(node.id);
  const m = decoded?.match(/^comment:(\d+)_(\d+)/);
  return { postId: m?.[1] ?? null, commentId: node.legacy_fbid ? String(node.legacy_fbid) : m?.[2] ?? null };
}

// Depth-first search inside one node, not descending into other stories/comments.
function findDeep(node, test, depth = 0) {
  if (!node || typeof node !== "object" || depth > 14) return undefined;
  for (const [key, value] of Object.entries(node)) {
    const hit = test(key, value);
    if (hit !== undefined) return hit;
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === "object" && (depth === 0 || !["Story", "Comment"].includes(value.__typename))) {
      const hit = findDeep(value, test, depth + 1);
      if (hit !== undefined) return hit;
    }
  }
  return undefined;
}

function merge(map, id, row) {
  const prev = map.get(id) ?? {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined || v === "") continue;
    if (prev[k] === undefined || (typeof v === "string" && v.length > String(prev[k]).length)) prev[k] = v;
  }
  map.set(id, prev);
}

const postIdFromUrl = (url) => url?.match(/\/(?:posts|permalink)\/(\d+)/)?.[1] ?? url?.match(/story_fbid=(\d+)/)?.[1] ?? null;
const groupFromUrl = (url) => url?.match(/groups\/([^/?#]+)/)?.[1] ?? null;
const unix = (t) => (typeof t === "number" ? new Date(t * 1000).toISOString() : null);

function onStory(node, ctx) {
  const id = storyId(node);
  if (!id) return ctx;
  const author = node.actors?.[0] ?? findDeep(node, (k, v) => (k === "actors" && Array.isArray(v) ? v[0] : undefined));
  const url =
    node.url ??
    node.permalink_url ??
    findDeep(node, (k, v) => (k === "url" && typeof v === "string" && /\/(posts|permalink)\//.test(v) ? v : undefined));
  // Only group posts count; the post page also carries recommended posts from elsewhere.
  const group =
    groupFromUrl(url) ??
    (node.to?.__typename === "Group" ? node.to.id : null) ??
    (id === postIdFromUrl(ctx.pageUrl) ? groupFromUrl(ctx.pageUrl) : null);
  merge(posts, id, {
    id,
    group,
    url: url ?? (group ? `https://www.facebook.com/groups/${group}/posts/${id}/` : null),
    posted_at: unix(findDeep(node, (k, v) => (k === "creation_time" && typeof v === "number" ? v : undefined))),
    author_id: author?.id,
    author_name: author?.name,
    text: node.message?.text ?? findDeep(node, (k, v) => (k === "message" && typeof v?.text === "string" ? v.text : undefined)),
    first_seen: ctx.fetchedAt,
  });
  return { ...ctx, postId: id, commentId: null };
}

function onComment(node, ctx) {
  const ids = commentIds(node);
  if (!ids.commentId) return ctx;
  // A reply sits under its parent comment's Feedback node (see walk).
  const parent = node.comment_parent?.id
    ? commentIds(node.comment_parent).commentId
    : node.depth > 0
      ? ctx.feedbackOf
      : null;
  const postId = ids.postId ?? ctx.postId ?? postIdFromUrl(node.url) ?? postIdFromUrl(ctx.pageUrl);
  merge(comments, ids.commentId, {
    id: ids.commentId,
    post_id: postId,
    // Reply URLs look like ?comment_id=<parent>&reply_comment_id=<this>.
    parent_comment_id: parent ?? (node.url?.includes("reply_comment_id=") ? node.url.match(/[?&]comment_id=(\d+)/)?.[1] : null),
    posted_at: unix(node.created_time),
    author_id: node.author?.id,
    author_name: node.author?.name,
    text: node.body?.text ?? node.preferred_body?.text,
    first_seen: ctx.fetchedAt,
  });
  return { ...ctx, postId, commentId: ids.commentId };
}

// A Photo carries the same picture at several sizes; keep the widest.
function onPhoto(node, ctx) {
  if (!node.id || !/^\d+$/.test(String(node.id))) return;
  let best = null;
  for (const [key, value] of Object.entries(node)) {
    if (key.includes("blurred") || typeof value?.uri !== "string") continue;
    if (!best || (value.width ?? 0) > (best.width ?? 0)) best = value;
  }
  if (!best) return;
  if (!ctx.postId) return; // Not attached to anything we collect (e.g. a group cover photo).
  merge(images, String(node.id), {
    id: String(node.id),
    post_id: ctx.postId,
    comment_id: ctx.commentId,
    url: best.uri,
    width: best.width,
    height: best.height,
    caption: node.accessibility_caption, // Facebook's own "May be an image of text that says…"
  });
  // Raw files are read oldest first, so the freshest signed URL ends up here.
  Object.assign(images.get(String(node.id)), { url: best.uri, width: best.width, height: best.height });
}

// Page furniture that holds Story/Photo nodes unrelated to the group: the Stories tray.
const SKIP = new Set(["unified_stories_buckets"]);

function walk(node, ctx) {
  if (Array.isArray(node)) {
    for (const item of node) walk(item, ctx);
    return;
  }
  if (!node || typeof node !== "object") return;
  if (node.__typename === "Story") ctx = onStory(node, ctx);
  else if (node.__typename === "Comment") ctx = onComment(node, ctx);
  else if (node.__typename === "Photo") onPhoto(node, ctx);
  else if (node.__typename === "Feedback" && node.id) {
    // "feedback:<post>_<comment>" belongs to a comment, "feedback:<post>" to the post.
    ctx = { ...ctx, feedbackOf: decodeId(node.id)?.match(/^feedback:\d+_(\d+)$/)?.[1] ?? null };
  }
  for (const [key, value] of Object.entries(node)) {
    if (SKIP.has(key) || !value || typeof value !== "object") continue;
    walk(value, ctx);
  }
}

// raw/<run>/<seq>-<query>.json, read in capture order so later captures win.
const files = fs
  .readdirSync(RAW_DIR)
  .filter((run) => fs.statSync(path.join(RAW_DIR, run)).isDirectory())
  .sort()
  .flatMap((run) =>
    fs
      .readdirSync(path.join(RAW_DIR, run))
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => path.join(RAW_DIR, run, f)),
  );
for (const file of files) {
  const entry = JSON.parse(fs.readFileSync(file, "utf8"));
  const ctx = { pageUrl: entry.page_url, fetchedAt: entry.fetched_at, postId: null, commentId: null, feedbackOf: null };
  for (const doc of entry.docs) walk(doc, ctx);
}

// Drop anything that isn't a group post, along with its comments and images.
for (const [id, post] of posts) if (!post.group) posts.delete(id);
for (const [id, c] of comments) if (!posts.has(c.post_id)) comments.delete(id);
for (const [id, img] of images) if (!posts.has(img.post_id)) images.delete(id);

// Every file carries every field of the schema, in this order, with null when missing.
const POST_FIELDS = ["id", "group", "url", "posted_at", "author_id", "author_name", "text", "first_seen"];
const COMMENT_FIELDS = ["id", "post_id", "parent_comment_id", "posted_at", "author_id", "author_name", "text", "first_seen"];
const shape = (fields) => (row) => Object.fromEntries(fields.map((f) => [f, row[f] ?? null]));

writePosts([...posts.values()].map(shape(POST_FIELDS)), [...comments.values()].map(shape(COMMENT_FIELDS)));
writeJsonl(path.join(DATA_DIR, "images.jsonl"), [...images.values()]);

const withText = [...posts.values()].filter((p) => p.text).length;
console.log(
  `${files.length} raw responses → ${posts.size} posts (${withText} with text), ${comments.size} comments, ${images.size} images`,
);
