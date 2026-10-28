// Turns data/experiences/*.json into per-branch numbers. No model involved: re-run it after every extraction.
// Writes collect/data/experiences/records.jsonl (every record, one per line, for ad-hoc queries)
// and collect/data/experiences/summary.json (per branch), and prints the summary.
//
//   node experiences/aggregate.mjs [--since 2025-10] [--min 8]
//
// Satisfaction: among couples with a firsthand experience at the branch that said how it went, how positive it was
// (positive 1, mixed ½, negative 0; neutral left out). A couple counts once: the average of its experiences there.
// Busy: an index where 1 is the national level, from two parts, both leaving out what the war caused:
// - reports: the share of couples reporting overload (an appointment months away, no appointments, a long queue,
//   no reply), in any kind of record, over the national share. Refused walk-ins are a policy, not overload.
// - waits: at the stages that show the branch's own load (WAIT_STAGES), each wait over the national median for its
//   stage. Other stages (interview to decision) often wait on headquarters or a committee, not the branch.
// The two are averaged on a log scale; waits weigh more the more of them there are.
// Everything is pulled toward the national figure (PRIOR couples', WAIT_PRIOR waits' worth), so a branch with few
// reports can't top the list.
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "../facebook/lib.mjs";

const HERE = import.meta.dirname;
const DATA_DIR = path.resolve(HERE, "..", "..", "data", "experiences");
const OUT_DIR = path.resolve(HERE, "..", "data", "experiences");
const branches = JSON.parse(fs.readFileSync(path.join(HERE, "branches.json"), "utf8"));
const PRIOR = 5;
const BUSY = new Set(["appointment-far", "no-appointments-available", "long-queue", "no-reply"]);
const WAIT_STAGES = ["applied>first-response", "appointment-set>appointment"];
const WAIT_PRIOR = 3;
// Added to both sides of a wait's ratio, so "same day" against a 30-day median isn't infinitely fast.
const WAIT_OFFSET = 7;
const SCORE = { positive: 1, mixed: 0.5, negative: 0 };

const args = parseArgs(process.argv.slice(2));
const since = args.since ? String(args.since) : null;
const min = Number(args.min ?? 8);

const records = [];
for (const file of fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"))) {
  const thread = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
  for (const r of thread.records) {
    const when = r.experience_when ?? r.posted_at?.slice(0, 7) ?? null;
    if (since && (!when || when < since)) continue;
    records.push({ source: thread.source, thread: thread.thread_id, when, ...r });
  }
}
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "records.jsonl"), records.map((r) => JSON.stringify(r)).join("\n") + "\n");

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null;
};
const couple = (r) => `${r.source}:${r.author_id}`;

// Per couple, per branch: their satisfaction (average of their scored experiences) and whether they reported overload.
function couples(list) {
  const byCouple = new Map();
  for (const r of list) {
    const c = byCouple.get(couple(r)) ?? { scores: [], busy: false, experiences: { positive: 0, negative: 0, neutral: 0, mixed: 0 } };
    if (r.firsthand === "firsthand" && r.experience) {
      c.experiences[r.experience]++;
      if (r.experience in SCORE) c.scores.push(SCORE[r.experience]);
    }
    if (!r.war_related && r.busy_signals.some((s) => BUSY.has(s))) c.busy = true;
    byCouple.set(couple(r), c);
  }
  return [...byCouple.values()];
}

const all = couples(records);
const scored = all.filter((c) => c.scores.length);
// The waits a branch's load shows in: the stages in WAIT_STAGES, not caused by the war.
const loadWaits = (list) =>
  list.flatMap((r) => (r.war_related ? [] : r.waits.map((w) => ({ stage: `${w.from}>${w.to}`, days: w.days }))))
    .filter((w) => WAIT_STAGES.includes(w.stage));
const national = {
  satisfaction: mean(scored.map((c) => mean(c.scores))),
  busy: all.filter((c) => c.busy).length / all.length,
  wait_medians: Object.fromEntries(WAIT_STAGES.map((s) => {
    const days = loadWaits(records).filter((w) => w.stage === s).map((w) => w.days);
    return [s, { n: days.length, median_days: median(days) }];
  })),
};

const summary = branches.map((b) => {
  const list = records.filter((r) => r.branch === b.id);
  const cs = couples(list);
  const rated = cs.filter((c) => c.scores.length);
  const sat = rated.map((c) => mean(c.scores));
  const busyCount = cs.filter((c) => c.busy).length;
  const reportsScore = (busyCount + PRIOR * national.busy) / (cs.length + PRIOR);
  const reportsLog = Math.log(reportsScore / national.busy);
  // Per stage, the branch's median against the national one: one "appointment" can be a document hand-in two days
  // away and the next an interview a year away, so a median holds up where an average of every wait wouldn't.
  const stages = WAIT_STAGES.map((s) => {
    const days = loadWaits(list).filter((w) => w.stage === s).map((w) => w.days);
    return { n: days.length, log: days.length ? Math.log((median(days) + WAIT_OFFSET) / (national.wait_medians[s].median_days + WAIT_OFFSET)) : 0 };
  });
  const ratios = { length: stages.reduce((a, s) => a + s.n, 0) };
  const waitsLog = stages.reduce((a, s) => a + s.n * s.log, 0) / (ratios.length + WAIT_PRIOR);
  const weight = ratios.length / (ratios.length + WAIT_PRIOR);
  const waits = {};
  for (const r of list) for (const w of r.waits) (waits[`${w.from}>${w.to}`] ??= []).push(w.days);
  return {
    id: b.id,
    name: b.name,
    couples: cs.length,
    records: list.length,
    ranked: cs.length >= min,
    satisfaction: {
      rated: rated.length,
      raw: sat.length ? mean(sat) : null,
      score: (sat.reduce((a, b) => a + b, 0) + PRIOR * national.satisfaction) / (sat.length + PRIOR),
      experiences: cs.reduce((acc, c) => {
        for (const k in c.experiences) acc[k] = (acc[k] ?? 0) + c.experiences[k];
        return acc;
      }, {}),
    },
    busy: {
      index: Math.exp((reportsLog + weight * waitsLog) / (1 + weight)),
      couples: busyCount,
      raw: cs.length ? busyCount / cs.length : null,
      reports_ratio: reportsScore / national.busy,
      waits: { n: ratios.length, ratio: Math.exp(waitsLog) },
      signals: list.flatMap((r) => (r.war_related ? [] : r.busy_signals)).reduce((acc, s) => ((acc[s] = (acc[s] ?? 0) + 1), acc), {}),
    },
    waits: Object.fromEntries(Object.entries(waits).map(([k, d]) => [k, { n: d.length, median_days: median(d) }])),
  };
});

const out = {
  generated_at: new Date().toISOString(),
  since,
  min_couples: min,
  prior_couples: PRIOR,
  busy_signals: [...BUSY],
  wait_stages: WAIT_STAGES,
  records: records.length,
  couples: all.length,
  national,
  branches: summary.sort((a, b) => b.couples - a.couples),
};
fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(out, null, 2) + "\n");

const pct = (x) => (x == null ? "  -" : `${Math.round(x * 100)}%`.padStart(4));
const times = (x) => `${x.toFixed(2)}×`;
const medians = WAIT_STAGES.map((s) => `${s} ${national.wait_medians[s].median_days}d (${national.wait_medians[s].n})`).join(", ");
console.log(`${records.length} records, ${all.length} couples. National: satisfaction ${pct(national.satisfaction)}, overload reports ${pct(national.busy)}`);
console.log(`National wait medians: ${medians}`);
console.log(`${"branch".padEnd(24)} couples  satisfaction (raw, rated)   busy  = reports × waits (n)`);
for (const b of out.branches.filter((b) => b.couples)) {
  console.log(
    `${(b.ranked ? "" : "· ") + b.name}`.padEnd(24) +
      `${String(b.couples).padStart(7)}  ${pct(b.satisfaction.score)} (${pct(b.satisfaction.raw)}, ${String(b.satisfaction.rated).padStart(2)})` +
      `        ${times(b.busy.index)}  ${times(b.busy.reports_ratio)}  ${times(b.busy.waits.ratio)} (${b.busy.waits.n})`,
  );
}
console.log(`· fewer than ${min} couples: not ranked`);
