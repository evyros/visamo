// Turns the captured articles into one Markdown file each, comments included.
//
//   node aic/parse.mjs
//
// Reads every run in collect/data/aic/raw/ and keeps the latest capture of each page.
// Writes <repo>/data/aic/<slug>.md and <repo>/data/aic/index.md, which are committed.
// That folder is rebuilt on every run, so don't edit it by hand: fix this file and
// re-run. Only articles are kept: the site's other pages (about, contact, legal,
// listings) hold nothing to learn from.
import fs from "node:fs";
import path from "node:path";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { POSTS_DIR, RAW_DIR, SITE, readJsonl, slugOf } from "./lib.mjs";

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-", codeBlockStyle: "fenced", emDelimiter: "*" });
turndown.use(gfm);
turndown.remove(["script", "style", "noscript", "svg", "form", "button"]);
// Embedded videos and maps become links.
turndown.addRule("iframe", {
  filter: "iframe",
  replacement: (_, node) => {
    const src = node.getAttribute("src") || node.getAttribute("data-src");
    return src ? `\n\n[Embedded: ${node.getAttribute("title") || src}](${src})\n\n` : "";
  },
});

const toMarkdown = (html) =>
  turndown
    .turndown(html)
    .replace(/^(\s*)([-*]|\d+\.) {2,}/gm, "$1$2 ")
    .replace(/[ \t]+$/gm, (m) => (m === "  " ? m : ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Latest capture of each page across all runs (run folders sort by time).
const captures = new Map();
for (const run of fs.readdirSync(RAW_DIR).sort()) {
  for (const entry of readJsonl(path.join(RAW_DIR, run, "index.jsonl"))) {
    if (entry.status && entry.status >= 400) continue;
    const url = entry.final_url.split(/[?#]/)[0].replace(/comment-page-\d+\/?$/, "");
    const list = captures.get(url)?.run === run ? captures.get(url).files : [];
    list.push(path.join(RAW_DIR, run, entry.file));
    captures.set(url, { run, files: list, entry });
  }
}

const text = (el) => el?.textContent.replace(/\s+/g, " ").trim() ?? "";

// Lazy-loaded images keep the real address in data-src; links should work outside the site.
function absolutize(root) {
  for (const img of root.querySelectorAll("img")) {
    const real = img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
    if (real) img.setAttribute("src", real);
    if (img.getAttribute("src")?.startsWith("data:")) img.remove();
  }
  for (const [sel, attr] of [["a[href]", "href"], ["img[src]", "src"]]) {
    for (const el of root.querySelectorAll(sel)) {
      try {
        el.setAttribute(attr, new URL(el.getAttribute(attr), SITE).href);
      } catch {
        // Leave malformed addresses as they are.
      }
    }
  }
}

function readComments(list, depth = 0) {
  const out = [];
  for (const li of list?.children ?? []) {
    if (!li.matches("li.comment, li.pingback, li.trackback")) continue;
    const inner = li.querySelector(":scope > article") ?? li;
    const content = inner.querySelector(".ct-comment-content, .comment-content");
    if (content) absolutize(content);
    const authorClass = [...li.classList].find((c) => c.startsWith("comment-author-"));
    out.push({
      id: li.id.replace("comment-", ""),
      author: text(inner.querySelector(".ct-comment-author cite, .comment-author cite, .fn")),
      author_slug: authorClass?.slice("comment-author-".length) ?? null,
      by_post_author: li.classList.contains("bypostauthor"),
      date: inner.querySelector("time")?.getAttribute("datetime") ?? null,
      text: content ? toMarkdown(content.innerHTML) : "",
      depth,
      replies: readComments(li.querySelector(":scope > ol.children, :scope > ul.children"), depth + 1),
    });
  }
  return out;
}

const countComments = (list) => list.reduce((n, c) => n + 1 + countComments(c.replies), 0);

function renderComments(list) {
  const blocks = [];
  for (const c of list) {
    const date = c.date ? c.date.slice(0, 16).replace("T", " ") : "";
    const head = [`**${c.author || "Anonymous"}**${c.by_post_author ? " (post author)" : ""}`, date, `#${c.id}`].filter(Boolean).join(" · ");
    const body = [head, c.text].filter(Boolean).join("\n\n");
    const replies = renderComments(c.replies);
    // Replies sit inside their parent as quotes, one level per depth.
    blocks.push(replies ? `${body}\n\n${replies.replace(/^/gm, "> ").replace(/^> $/gm, ">")}` : body);
  }
  return blocks.join("\n\n---\n\n");
}

// YAML front matter; JSON strings and arrays are valid YAML.
const frontMatter = (fields) =>
  "---\n" +
  Object.entries(fields)
    .filter(([, v]) => v !== null && v !== undefined && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n") +
  "\n---\n";

function parsePost(url, files) {
  const docs = files.map((f) => parseHTML(fs.readFileSync(f, "utf8")).document);
  const document = docs[0];
  if (!document.body.classList.contains("single-post")) return null; // WordPress marks articles this way.

  const header = document.querySelector(".hero-section header.entry-header, header.entry-header");
  const title = text(document.querySelector("h1.page-title, h1.entry-title")) || text(document.querySelector("title")).replace(/\s*\|\s*AIC$/, "");
  const meta = header?.querySelector("ul.entry-meta");

  // Terms are grouped by their taxonomy, taken from the link: /category/x/ → category.
  const terms = {};
  for (const a of meta?.querySelectorAll("li.meta-categories a") ?? []) {
    const tax = new URL(a.getAttribute("href"), SITE).pathname.split("/")[1] || "terms";
    (terms[tax] ??= []).push(text(a));
  }
  const tags = [...document.querySelectorAll(".entry-tags-items a")].map(text);

  const article = document.querySelector("main article") ?? document.querySelector("main");
  const content = article?.querySelector(".entry-content") ?? article;
  let body = "";
  if (content) {
    content.querySelectorAll("#comments, .ct-comments, .author-box, .ct-related-posts-container, .ct-share-box, .comment-respond").forEach((el) => el.remove());
    absolutize(content);
    body = toMarkdown(content.innerHTML);
  }

  // A page whose comments span several pages was captured once per comments page.
  const seen = new Set();
  const comments = docs
    .flatMap((d) => readComments(d.querySelector("ol.ct-comment-list, ol.comment-list")))
    .filter((c) => !seen.has(c.id) && seen.add(c.id));
  const total = countComments(comments);

  const md =
    frontMatter({
      title,
      url,
      author: text(meta?.querySelector(".ct-meta-element-author")) || null,
      published: meta?.querySelector("li.meta-date time")?.getAttribute("datetime") ?? null,
      updated: meta?.querySelector("li.meta-updated-date time")?.getAttribute("datetime") ?? null,
      ...terms,
      tags,
      comments: total,
    }) +
    `\n# ${title}\n\n${body}\n` +
    (total ? `\n## Comments (${total})\n\n${renderComments(comments)}\n` : "");

  return { slug: slugOf(url), title, comments: total, md };
}

fs.rmSync(POSTS_DIR, { recursive: true, force: true });
fs.mkdirSync(POSTS_DIR, { recursive: true });
const posts = [];
let skipped = 0;
let capturedAt = "";
for (const [url, { files, entry }] of captures) {
  const post = parsePost(url, files);
  if (!post) {
    skipped++;
    continue;
  }
  fs.writeFileSync(path.join(POSTS_DIR, `${post.slug}.md`), post.md);
  posts.push(post);
  if (entry.fetched_at > capturedAt) capturedAt = entry.fetched_at;
}

const comments = posts.reduce((n, p) => n + p.comments, 0);
// The capture date lives here only, so a re-run with nothing new leaves the posts unchanged.
const index =
  `# aic.org.il\n\nCaptured ${capturedAt.slice(0, 10)}: ${posts.length} posts, ${comments} comments.\n\n` +
  posts
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => `- [${p.title}](${encodeURI(p.slug)}.md)${p.comments ? ` · ${p.comments} comments` : ""}`)
    .join("\n") +
  "\n";
fs.writeFileSync(path.join(POSTS_DIR, "index.md"), index);

console.log(`${posts.length} posts, ${comments} comments; ${skipped} other pages skipped`);
