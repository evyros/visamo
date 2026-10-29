// Saves an agent's milestone waits for one thread (milestones-prompt.md) as data/milestones/facebook-<post id>.json,
// after checking them. A one-time pass over the threads that mention the entry permit or the B/1, for the seed
// (import.mjs): the first extraction wasn't asked for these two waits.
//
//   node experiences/milestones.mjs save <post id> <output.json>
import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR } from "../facebook/lib.mjs";

const HERE = import.meta.dirname;
const OUT_DIR = path.resolve(HERE, "..", "..", "data", "milestones");
const branchIds = new Set(JSON.parse(fs.readFileSync(path.join(HERE, "branches.json"), "utf8")).map((b) => b.id));
const datePattern = /^\d{4}(-\d{2}(-\d{2})?)?$/;

const [command, postId, file] = process.argv.slice(2);
if (command !== "save" || !postId || !file) {
  console.error("Usage: node experiences/milestones.mjs save <post id> <output.json>");
  process.exit(1);
}

const dir = path.join(POSTS_DIR, postId);
const commentsDir = path.join(dir, "comments");
const ids = new Set([postId, ...(fs.existsSync(commentsDir) ? fs.readdirSync(commentsDir).map((f) => f.replace(/\.json$/, "")) : [])]);

const output = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
if (!output || !Array.isArray(output.milestones)) errors.push("the file must hold { \"milestones\": [...] }");
(output.milestones ?? []).forEach((m, i) => {
  const at = `milestones[${i}]`;
  const allowed = ["source_ids", "author_id", "firsthand", "branch", "branch_text", "stage", "filed", "reached", "days", "ongoing", "when", "war_related", "text"];
  for (const key of Object.keys(m)) if (!allowed.includes(key)) errors.push(`${at}.${key}: not a field`);
  for (const key of allowed) if (!(key in m)) errors.push(`${at}.${key}: missing`);
  if (!Array.isArray(m.source_ids) || !m.source_ids.length || m.source_ids.some((id) => !ids.has(id))) errors.push(`${at}.source_ids: ids from this thread`);
  if (typeof m.author_id !== "string" || !m.author_id) errors.push(`${at}.author_id: a string`);
  if (!["firsthand", "secondhand"].includes(m.firsthand)) errors.push(`${at}.firsthand: firsthand or secondhand`);
  if (m.branch !== null && !branchIds.has(m.branch)) errors.push(`${at}.branch: "${m.branch}" isn't in branches.json`);
  if (!["entryPermit", "b1Visa"].includes(m.stage)) errors.push(`${at}.stage: entryPermit or b1Visa`);
  for (const key of ["filed", "reached", "when"]) if (m[key] !== null && !datePattern.test(m[key])) errors.push(`${at}.${key}: YYYY-MM-DD, YYYY-MM, YYYY or null`);
  if (typeof m.days !== "number" || m.days < 0 || m.days > 2000) errors.push(`${at}.days: a number of days`);
  if (typeof m.ongoing !== "boolean" || typeof m.war_related !== "boolean") errors.push(`${at}: ongoing and war_related are booleans`);
  if (typeof m.text !== "string" || !m.text) errors.push(`${at}.text: the words it was stated in`);
});
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const saved = { source: "facebook", thread_id: postId, extracted_at: new Date().toISOString(), milestones: output.milestones };
fs.writeFileSync(path.join(OUT_DIR, `facebook-${postId}.json`), JSON.stringify(saved, null, 2) + "\n");
console.log(`${postId}: ${output.milestones.length} milestones`);
