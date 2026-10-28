// Prepares threads for extraction and saves what comes back as data/experiences/<source>-<thread id>.json.
// The extraction itself is done by agents following prompt.md.
//
//   node experiences/extract.mjs pending [--limit 5] [--post <id>,<id>]
//     Writes each thread that needs extracting to collect/data/experiences/input/<post id>.md, newest first,
//     and prints their paths. A thread needs it when it has no file yet, when its posts or comments changed
//     since (source_hash), or when schema.json's version changed.
//   node experiences/extract.mjs save <post id> <output.json> [--model <id>] [--out <dir>]
//     Checks the agent's output against schema.json and the thread, and writes the thread's file.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, parseArgs } from "../facebook/lib.mjs";

const HERE = import.meta.dirname;
const OUT_DIR = path.resolve(HERE, "..", "..", "data", "experiences");
const SOURCE = "facebook";
const outFile = (threadId) => path.join(OUT_DIR, `${SOURCE}-${threadId}.json`);
const INPUT_DIR = path.resolve(HERE, "..", "data", "experiences", "input");
const schema = JSON.parse(fs.readFileSync(path.join(HERE, "schema.json"), "utf8"));
const branchIds = new Set(JSON.parse(fs.readFileSync(path.join(HERE, "branches.json"), "utf8")).map((b) => b.id));

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(INPUT_DIR, { recursive: true });

function readThread(postId) {
  const dir = path.join(POSTS_DIR, postId);
  const post = JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8"));
  const commentsDir = path.join(dir, "comments");
  const comments = fs.existsSync(commentsDir)
    ? fs.readdirSync(commentsDir).map((f) => JSON.parse(fs.readFileSync(path.join(commentsDir, f), "utf8")))
    : [];
  comments.sort((a, b) => (a.posted_at ?? "").localeCompare(b.posted_at ?? "") || a.id.localeCompare(b.id));
  return { post, comments };
}

// Only what the agent reads: fields like first_seen change on every parse and mustn't trigger a re-run.
function sourceHash({ post, comments }) {
  const content = [
    [post.id, post.author_id, post.text ?? ""],
    ...comments.map((c) => [c.id, c.parent_comment_id, c.author_id, c.text ?? ""]),
  ];
  return crypto.createHash("sha256").update(JSON.stringify(content)).digest("hex").slice(0, 16);
}

function render({ post, comments }) {
  const day = (t) => (t ? t.slice(0, 10) : "unknown date");
  const lines = [
    `[${post.id}] Post · ${day(post.posted_at)} · ${post.author_name} (${post.author_id})`,
    "",
    (post.text ?? "").trim(),
    "",
    "Comments:",
    "",
  ];
  // A reply whose parent wasn't captured is shown at the top level, so it isn't lost.
  const known = new Set(comments.map((c) => c.id));
  const children = new Map();
  for (const c of comments) {
    const parent = known.has(c.parent_comment_id) ? c.parent_comment_id : "";
    children.set(parent, [...(children.get(parent) ?? []), c]);
  }
  const walk = (parent, depth) => {
    for (const c of children.get(parent) ?? []) {
      const pad = "    ".repeat(depth);
      const text = (c.text ?? "").trim().replace(/\n+/g, `\n${pad}  `);
      lines.push(`${pad}[${c.id}] ${day(c.posted_at)} · ${c.author_name} (${c.author_id}): ${text}`);
      walk(c.id, depth + 1);
    }
  };
  walk("", 0);
  if (!comments.length) lines.push("(none)");
  return lines.join("\n") + "\n";
}

function needsExtracting(postId, thread) {
  const file = outFile(postId);
  if (!fs.existsSync(file)) return true;
  const done = JSON.parse(fs.readFileSync(file, "utf8"));
  return done.source_hash !== sourceHash(thread) || done.schema_version !== schema.version;
}

// The subset of JSON Schema schema.json uses.
function validate(value, rule, at, errors) {
  if (rule.enum) {
    if (!rule.enum.includes(value)) errors.push(`${at}: ${JSON.stringify(value)} isn't one of ${rule.enum.join(", ")}`);
    return;
  }
  const types = [rule.type].flat();
  const type = value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
  if (!types.includes(type)) {
    errors.push(`${at}: expected ${types.join(" or ")}, got ${type}`);
    return;
  }
  if (type === "array" && rule.items) value.forEach((v, i) => validate(v, rule.items, `${at}[${i}]`, errors));
  if (type === "object") {
    for (const key of rule.required ?? []) if (!(key in value)) errors.push(`${at}.${key}: missing`);
    for (const [key, v] of Object.entries(value)) {
      if (rule.properties?.[key]) validate(v, rule.properties[key], `${at}.${key}`, errors);
      else if (rule.additionalProperties === false) errors.push(`${at}.${key}: not in the schema`);
    }
  }
}

function check(output, thread) {
  const errors = [];
  validate(output, schema.output, "output", errors);
  if (errors.length) return errors;
  const ids = new Set([thread.post.id, ...thread.comments.map((c) => c.id)]);
  output.records.forEach((r, i) => {
    const at = `records[${i}]`;
    validate(r, schema.record, at, errors);
    if (r.branch && !branchIds.has(r.branch)) errors.push(`${at}.branch: "${r.branch}" isn't in branches.json`);
    if (!r.source_ids?.length) errors.push(`${at}.source_ids: empty`);
    for (const id of r.source_ids ?? []) if (!ids.has(id)) errors.push(`${at}.source_ids: ${id} isn't in this thread`);
    // Only a person's own experience is judged: secondhand stories and advice feed practices.
    if (r.firsthand !== "firsthand") {
      if (r.experience !== null) errors.push(`${at}.experience: must be null for ${r.firsthand}`);
      for (const [aspect, value] of Object.entries(r.aspects ?? {}))
        if (value !== "not-mentioned") errors.push(`${at}.aspects.${aspect}: must be not-mentioned for ${r.firsthand}`);
    }
    // The events are listed in the order they happen.
    const events = schema.record.properties.waits.items.properties.from.enum;
    (r.waits ?? []).forEach((w, j) => {
      if (events.indexOf(w.from) >= events.indexOf(w.to)) errors.push(`${at}.waits[${j}]: ${w.from} doesn't come before ${w.to}`);
    });
  });
  if (!output.relevant && output.records.length) errors.push("relevant: false, but there are records");
  return errors;
}

// When the record's first source was posted: the fallback for experience_when.
function postedAt(record, thread) {
  const byId = new Map([[thread.post.id, thread.post], ...thread.comments.map((c) => [c.id, c])]);
  return byId.get(record.source_ids[0])?.posted_at ?? null;
}

const args = parseArgs(process.argv.slice(2));
const [command, ...rest] = args._;

if (command === "pending") {
  const wanted = args.post ? String(args.post).split(",") : fs.readdirSync(POSTS_DIR);
  const threads = wanted
    .filter((id) => fs.existsSync(path.join(POSTS_DIR, id, "post.json")))
    .map((id) => ({ id, thread: readThread(id) }))
    .filter(({ id, thread }) => args.post || needsExtracting(id, thread))
    .sort((a, b) => (b.thread.post.posted_at ?? "").localeCompare(a.thread.post.posted_at ?? ""));
  const picked = args.limit ? threads.slice(0, Number(args.limit)) : threads;
  for (const { id, thread } of picked) {
    const file = path.join(INPUT_DIR, `${id}.md`);
    fs.writeFileSync(file, render(thread));
    console.log(`${file}\t${thread.comments.length} comments`);
  }
  console.error(`${picked.length} of ${threads.length} threads to extract`);
} else if (command === "save") {
  const [postId, outputFile] = rest;
  const thread = readThread(postId);
  const output = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  const errors = check(output, thread);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  const out = {
    source: SOURCE,
    thread_id: postId,
    source_hash: sourceHash(thread),
    schema_version: schema.version,
    extracted_at: new Date().toISOString(),
    model: args.model ?? null,
    relevant: output.relevant,
    records: output.records.map((r) => ({ ...r, posted_at: postedAt(r, thread) })),
  };
  // --out writes somewhere else, e.g. to compare models without touching the data.
  const file = args.out ? path.join(path.resolve(args.out), path.basename(outFile(postId))) : outFile(postId);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
  console.log(`${postId}: ${output.relevant ? "relevant" : "not relevant"}, ${out.records.length} records`);
} else {
  console.error("Usage: node experiences/extract.mjs pending [--limit n] [--post id,id] | save <post id> <output.json>");
  process.exit(1);
}
