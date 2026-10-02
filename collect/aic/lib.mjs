import fs from "node:fs";
import path from "node:path";

export const SITE = "https://aic.org.il";
export const DATA_DIR = path.resolve(import.meta.dirname, "..", "data", "aic");
export const RAW_DIR = path.join(DATA_DIR, "raw");
export const FILES_DIR = path.join(DATA_DIR, "files");
// The Markdown is the committed result, outside collect/: <repo>/data/aic/.
export const POSTS_DIR = path.resolve(import.meta.dirname, "..", "..", "data", "aic");
export const PROFILE_DIR = path.join(DATA_DIR, ".browser-profile");

for (const dir of [DATA_DIR, RAW_DIR, FILES_DIR]) fs.mkdirSync(dir, { recursive: true });

// Test account for the members area. Nothing personal behind it.
export const USERNAME = "webaspect1@gmail.com";
export const PASSWORD = "a9525899307262634";

// `--key value` and bare `--flag` pairs; other words go to `_`.
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

export function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const between = (min, max) => min + Math.floor(Math.random() * (max - min));

// Uploaded documents worth keeping next to the pages (images aren't downloaded).
export const DOCUMENT = /\.(pdf|docx?|xlsx?|pptx?|odt|rtf|txt|zip)$/i;

// Page URLs and file names derive from the path: /lawyers/adv-x/ → lawyers__adv-x.
export function slugOf(url) {
  const p = decodeURIComponent(new URL(url).pathname).replace(/^\/|\/$/g, "");
  return p ? p.replaceAll("/", "__") : "home";
}
