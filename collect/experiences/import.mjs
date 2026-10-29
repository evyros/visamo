// Seeds the database's branch_report table, which the website's branches page counts (lib/branch-reports.ts), with
// the extracted reports (data/experiences/*.json). A one-time seed: from then on, the table grows through survey votes.
// It replaces every imported row in one transaction, so running it twice does no harm; survey votes are left alone.
// Only what the page needs goes in: the branch, the stage, how it went, when, and the wait, with a key per couple.
// Never a name, a post's text or a link.
//
//   node experiences/import.mjs           what it would write, and to which database
//   node experiences/import.mjs --yes     writes it
//
// The database is DATABASE_URL_UNPOOLED or DATABASE_URL, from the shell or else the repo's .env.local. To import into
// production, set it in the shell for that run.
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const HERE = import.meta.dirname;
const ROOT = path.resolve(HERE, "..", "..");
const DATA_DIR = path.join(ROOT, "data", "experiences");

// The page's stages (content/branches/types.ts's stageIds), all from filing online, as the extraction names them
// (schema.json): the wait to the first answer, to the entry permit (the decision on an entry-permit request), and to
// the first B/1 visa (the decision after the first appointment or the interview). Each is a pair of columns in
// branch_report, e.g. first_answer_days and first_answer_waiting; other waits aren't stored.
const STAGES = {
  firstAnswer: { services: ["application"], from: "applied", to: "first-response" },
  entryPermit: { services: ["entry-permit"], from: "applied", to: "decision" },
  b1Visa: { services: ["first-appointment", "interview", "application"], from: "applied", to: "decision" },
};

// collect/experiences/branches.json's ids, as the app's BranchCode (lib/case-options.ts). Jaffa isn't one of the
// app's branches: its reports go in with no branch, and count only toward the stages' times across all branches.
const APP_CODE = {
  "tel-aviv": "telAvivCenter",
  jerusalem: "jerusalemCenter",
  "jerusalem-east": "jerusalemEast",
  "jerusalem-south": "jerusalemSouth",
  eilat: "eilat",
  ashdod: "ashdod",
  ashkelon: "ashkelon",
  "beer-sheva": "beersheba",
  "bnei-brak": "bneiBrak",
  "ramat-gan": "ramatGanGivatayim",
  herzliya: "herzliya",
  holon: "holon",
  hadera: "hadera",
  haifa: "haifa",
  afula: "afula",
  tiberias: "tiberias",
  "kfar-saba": "kfarSaba",
  "nof-hagalil": "nofHagalilNazareth",
  netanya: "netanya",
  akko: "acre",
  "petah-tikva": "petahTikva",
  safed: "safed",
  krayot: "krayot",
  "rosh-haayin": "roshHaayin",
  "rishon-lezion": "rishonLezion",
  ramle: "ramla",
  rehovot: "rehovot",
};

/** The sources this script owns: a run replaces all of their rows. */
const IMPORTED = ["facebook_post", "facebook_comment", "aic_comment"];

const stageOf = (service, from, to) =>
  Object.entries(STAGES).find(([, s]) => s.services.includes(service) && s.from === from && s.to === to)?.[0] ?? null;
const column = (stage) => stage.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const rows = [];
for (const file of fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).sort()) {
  const thread = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
  thread.records.forEach((r, i) => {
    const row = {
      id: `${thread.source}:${thread.thread_id}:${i}`,
      source: thread.source === "aic" ? "aic_comment" : r.source_ids[0] === thread.thread_id ? "facebook_post" : "facebook_comment",
      couple_key: `${thread.source}:${r.author_id}`,
      branch: r.branch ? (APP_CODE[r.branch] ?? null) : null,
      // Only a person's own experience says how it went.
      experience: r.firsthand === "firsthand" ? r.experience : null,
      experience_month: r.experience_when ?? r.posted_at?.slice(0, 7) ?? null,
      reported_at: r.posted_at ?? thread.extracted_at,
      war_related: r.war_related,
    };
    for (const stage of Object.keys(STAGES)) {
      row[`${column(stage)}_days`] = null;
      row[`${column(stage)}_waiting`] = false;
    }
    // Each wait in its stage's columns; a second wait for the same stage in one report is left out.
    for (const w of r.waits) {
      const stage = stageOf(r.service, w.from, w.to);
      if (!stage || row[`${column(stage)}_days`] !== null) continue;
      row[`${column(stage)}_days`] = Math.round(w.days);
      row[`${column(stage)}_waiting`] = w.ongoing;
    }
    rows.push(row);
  });
}

// The milestone pass (milestones.mjs): waits from filing to the entry permit and to the B/1, which the first
// extraction wasn't asked for. Each is its own row, with nothing on how it went. A couple whose report above already
// gave the stage keeps that one. A friend's case (secondhand) is its own couple, not the writer's.
const MILESTONES_DIR = path.join(ROOT, "data", "milestones");
const POSTS_DIR = path.join(ROOT, "data", "facebook", "posts");
const postedAt = (threadId, id) => {
  const file = id === threadId ? path.join(POSTS_DIR, threadId, "post.json") : path.join(POSTS_DIR, threadId, "comments", `${id}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")).posted_at : null;
};
const given = new Set(rows.flatMap((r) => Object.keys(STAGES).flatMap((s) => (r[`${column(s)}_days`] === null ? [] : [`${r.couple_key} ${s}`]))));
let milestones = 0;
for (const file of fs.existsSync(MILESTONES_DIR) ? fs.readdirSync(MILESTONES_DIR).filter((f) => f.endsWith(".json")).sort() : []) {
  const thread = JSON.parse(fs.readFileSync(path.join(MILESTONES_DIR, file), "utf8"));
  thread.milestones.forEach((m, i) => {
    const writer = `${thread.source}:${m.author_id}`;
    const coupleKey = m.firsthand === "firsthand" ? writer : `${writer}:friend:${thread.thread_id}:${i}`;
    if (given.has(`${coupleKey} ${m.stage}`)) return;
    given.add(`${coupleKey} ${m.stage}`);
    const posted = postedAt(thread.thread_id, m.source_ids[0]) ?? thread.extracted_at;
    const row = {
      id: `${thread.source}:${thread.thread_id}:m${i}`,
      source: m.source_ids[0] === thread.thread_id ? "facebook_post" : "facebook_comment",
      couple_key: coupleKey,
      branch: m.branch ? (APP_CODE[m.branch] ?? null) : null,
      experience: null,
      experience_month: m.when ?? (m.reached ?? m.filed)?.slice(0, 7) ?? posted.slice(0, 7),
      reported_at: posted,
      war_related: m.war_related,
    };
    for (const stage of Object.keys(STAGES)) {
      row[`${column(stage)}_days`] = stage === m.stage ? Math.round(m.days) : null;
      row[`${column(stage)}_waiting`] = stage === m.stage ? m.ongoing : false;
    }
    rows.push(row);
    milestones++;
  });
}
if (milestones) console.log(`  plus ${milestones} milestone rows (data/milestones)`);

const couples = new Set(rows.map((r) => r.couple_key)).size;
const bySource = Object.fromEntries(IMPORTED.map((s) => [s, rows.filter((r) => r.source === s).length]));
console.log(`${rows.length} rows from ${couples} couples:`, bySource);
const staged = (stage) => rows.filter((r) => r[`${column(stage)}_days`] !== null).length;
console.log(`  with a branch: ${rows.filter((r) => r.branch).length}; waits by stage:`, Object.fromEntries(Object.keys(STAGES).map((s) => [s, staged(s)])));

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path.join(ROOT, file));
  } catch {
    // Missing file: the URL comes from the other file or the shell.
  }
}
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("import: set DATABASE_URL_UNPOOLED or DATABASE_URL");
  process.exit(1);
}
console.log(`Database: ${new URL(url).hostname}`);
if (!process.argv.includes("--yes")) {
  console.log("Nothing written. Run with --yes to replace the imported rows.");
  process.exit(0);
}

const COLUMNS = Object.keys(rows[0]);
const sql = neon(url);
const inserts = [];
for (let at = 0; at < rows.length; at += 200) {
  const chunk = rows.slice(at, at + 200);
  const params = chunk.flatMap((row) => COLUMNS.map((c) => row[c]));
  const values = chunk.map((_, k) => `(${COLUMNS.map((_, c) => `$${k * COLUMNS.length + c + 1}`).join(", ")})`).join(", ");
  inserts.push(sql.query(`insert into branch_report (${COLUMNS.join(", ")}) values ${values}`, params));
}
await sql.transaction([sql.query("delete from branch_report where source = any($1)", [IMPORTED]), ...inserts]);
console.log(`Replaced: ${rows.length} rows.`);
