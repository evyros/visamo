import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkModel } from "@/lib/checks/ask";
import type { CheckLine } from "@/lib/checks/lines";
import type { CheckRating, FindingText } from "@/lib/checks/result";
import type { Part } from "@/lib/documents/points";
import type { EvalCase } from "./cases";
import type { Finding, RunGrade } from "./grade";

// A run of the evals, as it's saved (evals/.out/runs/<day>/<time>/results.json)
// and shown: plain data, everything the report needs, so an old run's report
// can be read without the code or the cases that made it. And how a run
// differs from the one before it.

export const RUNS_DIR = path.join(process.cwd(), "evals/.out/runs");

/** What a run's calls cost: as if none were cached, and what this run paid. */
export type Money = {
  /** Every call, cached ones at what they cost when made. Null if a cost is unknown. */
  cost: number | null;
  /** The calls this run made. */
  spent: number | null;
  /** The checker's calls only, at what they cost when made. */
  checkCost: number | null;
  /** The judge's calls only, at what they cost when made: 0 when it wasn't asked. */
  judgeCost: number | null;
  /** The judge's calls: more than 0 when it reviewed findings the case didn't expect. */
  judgeCalls: number;
  calls: number;
  /** Calls made, not read from the cache. */
  fresh: number;
};

/** What a case did in one run, before it's saved. */
export type RunOutcome = Money & { run: number } & (
    | { error: string; passed: false }
    | { result: { rating: CheckRating }; grade: RunGrade; passed: boolean }
  );

export type CaseOutcome = { evalCase: EvalCase; runs: RunOutcome[]; passRate: number };

/**
 * What became of a finding:
 *   expected    on a line the case expects
 *   optional    on a line the case allows either way (mayFlag)
 *   wrongList   on an expected line, but an issue for a recommended line or the other way
 *   allowed     the judge matched it to an approved finding (allowedExtra)
 *   review      the judge says it's right, and no one approved it yet
 *   wrong       the judge says it's wrong
 *   unreadable  what an unreadable result couldn't read: not graded
 */
export type FindingStatus = "expected" | "optional" | "wrongList" | "allowed" | "review" | "wrong" | "unreadable";

export type LineRef = { id: string; kind: CheckLine["kind"]; text: string; part?: Part };

export type FindingRecord = {
  kind: "issue" | "recommendation";
  line: LineRef | null;
  part?: Part;
  en: FindingText;
  he: FindingText;
  status: FindingStatus;
  /** The judge's reason, for a finding it judged. */
  reason?: string;
  /** The approved finding it matched. */
  allowed?: string;
};

export type RunRecord = Money & {
  run: number;
  passed: boolean;
  error?: string;
  rating?: CheckRating;
  ratingOk?: boolean;
  missed: LineRef[];
  findings: FindingRecord[];
};

export type FileRecord = { name: string; path: string; contentType: string; sha256: string | null };

export type CaseRecord = {
  id: string;
  folder: string;
  name: string;
  /** The document's title, as the couple's list shows it in English. */
  title: string;
  documentKey: string;
  /** The model that checked it. */
  model: string;
  scenario: string;
  today: string;
  files: FileRecord[];
  expect: { ratings: CheckRating[] | null; flagged: LineRef[]; mayFlag: LineRef[]; allowedExtra: string[] };
  /** Every line of the check, for the report's line table. */
  lines: LineRef[];
  /** Files it needs that aren't there: the case was skipped. */
  missing: string[];
  passRate: number | null;
  /** Every run passed; null when skipped. */
  passing: boolean | null;
  runs: RunRecord[];
};

export type RunMeta = {
  startedAt: string;
  /** The run's folder, from evals/.out/runs: "2026-10-03/21-35-17". */
  folder: string;
  filter: string | null;
  /** The checker's models, standard and strong. */
  checkModels: Record<string, string>;
  judgeModel: string;
  runs: number;
  rulesVersion: number;
  knowledgeVersion: number;
  commit: string | null;
  /** Uncommitted changes when it ran. */
  dirty: boolean;
};

export type RunResults = { meta: RunMeta; cases: CaseRecord[] };

const lineRef = ({ id, kind, text, part }: CheckLine): LineRef => ({ id, kind, text, ...(part && { part }) });

/** null if any is unknown. */
export const sum = (values: (number | null)[]) =>
  values.every((v) => v !== null) ? values.reduce<number>((a, b) => a + b!, 0) : null;

function findingRecords(run: Extract<RunOutcome, { grade: RunGrade }>, evalCase: EvalCase): FindingRecord[] {
  const { grade } = run;
  const flagged = new Set(evalCase.expect.flagged.map((l) => l.id));
  const lineOf = (f: Finding) => evalCase.lines.find((l) => l.id === f.line) ?? null;
  // The grade's own findings: its lists point to these.
  return grade.findings.map((finding) => {
    const line = lineOf(finding);
    const base = {
      kind: finding.kind,
      line: line && lineRef(line),
      ...(finding.part && { part: finding.part }),
      en: finding.en,
      he: finding.he,
    };
    if (grade.rating === "unreadable") return { ...base, status: "unreadable" };
    if (grade.wrongKind.some((w) => w.finding === finding)) return { ...base, status: "wrongList" };
    const unexpected = grade.unexpected.find((u) => u.finding === finding);
    if (!unexpected) return { ...base, status: line && flagged.has(line.id) ? "expected" : "optional" };
    const verdict = unexpected.verdict;
    const status: FindingStatus =
      verdict?.verdict === "allowed" ? "allowed" : verdict?.verdict === "valid" ? "review" : "wrong";
    return {
      ...base,
      status,
      reason: verdict?.reason ?? "Not judged.",
      ...(verdict?.allowed && { allowed: verdict.allowed }),
    };
  });
}

const sha256 = (file: string) => (existsSync(file) ? createHash("sha256").update(readFileSync(file)).digest("hex") : null);

function caseRecord(evalCase: EvalCase, outcome: CaseOutcome | null): CaseRecord {
  const { expect } = evalCase;
  return {
    id: evalCase.id,
    folder: evalCase.folder,
    name: evalCase.name,
    title: evalCase.title,
    model: checkModel(evalCase.check),
    documentKey: evalCase.documentKey,
    scenario: evalCase.scenario,
    today: evalCase.today,
    files: evalCase.files.map((f) => ({
      name: f.name,
      path: path.relative(process.cwd(), f.path),
      contentType: f.contentType,
      sha256: sha256(f.path),
    })),
    expect: {
      ratings: expect.ratings,
      flagged: expect.flagged.map(lineRef),
      mayFlag: expect.mayFlag.map(lineRef),
      allowedExtra: expect.allowedExtra,
    },
    lines: evalCase.lines.map(lineRef),
    missing: evalCase.missing,
    passRate: outcome?.passRate ?? null,
    passing: outcome ? outcome.passRate === 1 : null,
    runs: (outcome?.runs ?? []).map((run) => {
      const money = {
        cost: run.cost,
        spent: run.spent,
        checkCost: run.checkCost,
        judgeCost: run.judgeCost,
        judgeCalls: run.judgeCalls,
        calls: run.calls,
        fresh: run.fresh,
      };
      if ("error" in run) return { run: run.run, passed: false, error: run.error, missed: [], findings: [], ...money };
      return {
        run: run.run,
        passed: run.passed,
        rating: run.grade.rating,
        ratingOk: run.grade.ratingOk,
        missed: run.grade.missed.map(lineRef),
        findings: findingRecords(run, evalCase),
        ...money,
      };
    }),
  };
}

function git() {
  try {
    const commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim().length > 0;
    return { commit, dirty };
  } catch {
    return { commit: null, dirty: false };
  }
}

const two = (n: number) => String(n).padStart(2, "0");

/** The run's folder: its day, then its time, and the filter it ran with. */
export function runFolder(started: Date, filter: string | null) {
  const day = `${started.getFullYear()}-${two(started.getMonth() + 1)}-${two(started.getDate())}`;
  const time = `${two(started.getHours())}-${two(started.getMinutes())}-${two(started.getSeconds())}`;
  const label = filter ? `_${filter.replace(/[^\w-]+/g, "-").slice(0, 40)}` : "";
  return `${day}/${time}${label}`;
}

export function runResults(
  outcomes: CaseOutcome[],
  skipped: EvalCase[],
  about: Omit<RunMeta, "folder" | "commit" | "dirty" | "startedAt"> & { started: Date },
): RunResults {
  const { started, ...rest } = about;
  const records = [
    ...outcomes.map((o) => caseRecord(o.evalCase, o)),
    ...skipped.map((c) => caseRecord(c, null)),
  ].sort((a, b) => a.id.localeCompare(b.id));
  return {
    meta: { ...rest, startedAt: started.toISOString(), folder: runFolder(started, about.filter), ...git() },
    cases: records,
  };
}

/** The saved runs before `folder`, newest first. */
export function previousRuns(folder: string): RunResults[] {
  if (!existsSync(RUNS_DIR)) return [];
  return readdirSync(RUNS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((day) => readdirSync(path.join(RUNS_DIR, day.name)).map((time) => `${day.name}/${time}`))
    .filter((f) => f < folder && existsSync(path.join(RUNS_DIR, f, "results.json")))
    .sort()
    .reverse()
    .map((f) => JSON.parse(readFileSync(path.join(RUNS_DIR, f, "results.json"), "utf8")) as RunResults);
}

// ── Documents ────────────────────────────────────────────────────────────────

export type DocumentSummary = {
  folder: string;
  title: string;
  model: string;
  cases: number;
  ran: number;
  skipped: number;
  passing: number;
  failing: number;
  toReview: number;
  passRate: number | null;
  cost: number | null;
  spent: number | null;
  checker: number | null;
  judge: number | null;
  /** Cases where the judge reviewed findings. */
  judged: number;
  /** One check of the document, on average: the checker's calls of one run of one case. */
  perRun: number | null;
};

const ranRuns = (c: CaseRecord) => c.runs;

/** Whether the judge reviewed findings in any of the case's runs. */
export const judged = (c: CaseRecord) => c.runs.some((r) => r.judgeCalls > 0);

export function documents(results: RunResults): DocumentSummary[] {
  const folders = [...new Set(results.cases.map((c) => c.folder))].sort();
  return folders.map((folder) => {
    const cases = results.cases.filter((c) => c.folder === folder);
    const ran = cases.filter((c) => c.passing !== null);
    const runs = ran.flatMap(ranRuns);
    const checkCosts = runs.map((r) => r.checkCost);
    const checks = runs.length ? sum(checkCosts) : null;
    return {
      folder,
      title: cases[0].title,
      model: cases[0].model,
      cases: cases.length,
      ran: ran.length,
      skipped: cases.length - ran.length,
      passing: ran.filter((c) => c.passing).length,
      failing: ran.filter((c) => !c.passing).length,
      toReview: runs.flatMap((r) => r.findings).filter((f) => f.status === "review").length,
      passRate: runs.length ? runs.filter((r) => r.passed).length / runs.length : null,
      cost: sum(runs.map((r) => r.cost)),
      spent: sum(runs.map((r) => r.spent)),
      checker: sum(runs.map((r) => r.checkCost)),
      judge: sum(runs.map((r) => r.judgeCost)),
      judged: ran.filter(judged).length,
      perRun: checks === null || !runs.length ? null : checks / runs.length,
    };
  });
}

export function totals(results: RunResults) {
  const runs = results.cases.flatMap(ranRuns);
  const ran = results.cases.filter((c) => c.passing !== null);
  return {
    cases: results.cases.length,
    ran: ran.length,
    skipped: results.cases.length - ran.length,
    passing: ran.filter((c) => c.passing).length,
    failing: ran.filter((c) => !c.passing).length,
    toReview: runs.flatMap((r) => r.findings).filter((f) => f.status === "review").length,
    passRate: runs.length ? runs.filter((r) => r.passed).length / runs.length : null,
    cost: sum(runs.map((r) => r.cost)),
    spent: sum(runs.map((r) => r.spent)),
    checker: sum(runs.map((r) => r.checkCost)),
    judge: sum(runs.map((r) => r.judgeCost)),
    judged: ran.filter(judged).length,
    calls: runs.reduce((n, r) => n + r.calls, 0),
    fresh: runs.reduce((n, r) => n + r.fresh, 0),
  };
}

// ── Since the last run ───────────────────────────────────────────────────────

/** What a case reports across its runs: its checks and kinds, as "R2 issue". */
const reports = (c: CaseRecord) =>
  new Set(c.runs.flatMap((r) => r.findings.map((f) => `${f.line?.id ?? "no check"} ${f.kind}`)));

export type CaseChange = {
  id: string;
  /** Null: the case is new, or it was skipped then. */
  before: { passRate: number | null; passing: boolean | null } | null;
  /** Null: the case is gone (only in a run of every case). */
  after: { passRate: number | null; passing: boolean | null } | null;
  /** What it reports now and didn't, and the other way. */
  added: string[];
  removed: string[];
};

export type RunChanges = {
  /** The newest run before this one. */
  previous: RunMeta;
  /** Each case against the last run that ran it, filtered or not. */
  cases: CaseChange[];
  /** Each document's cost then, from the same runs. */
  costBefore: Record<string, number | null>;
};

/** How this run differs from the ones before it (`history`, newest first). */
export function changes(current: RunResults, history: RunResults[]): RunChanges | null {
  if (!history.length) return null;
  // Each case's last run.
  const before = new Map<string, CaseRecord>();
  for (const run of history) {
    for (const c of run.cases) if (c.passing !== null && !before.has(c.id)) before.set(c.id, c);
  }
  const now = new Map(current.cases.map((c) => [c.id, c]));
  const list: CaseChange[] = [];

  for (const c of current.cases) {
    if (c.passing === null) continue;
    const old = before.get(c.id);
    if (!old) {
      list.push({ id: c.id, before: null, after: { passRate: c.passRate, passing: c.passing }, added: [], removed: [] });
      continue;
    }
    const [was, is] = [reports(old), reports(c)];
    const added = [...is].filter((r) => !was.has(r)).sort();
    const removed = [...was].filter((r) => !is.has(r)).sort();
    if (old.passing === c.passing && old.passRate === c.passRate && !added.length && !removed.length) continue;
    list.push({
      id: c.id,
      before: { passRate: old.passRate, passing: old.passing },
      after: { passRate: c.passRate, passing: c.passing },
      added,
      removed,
    });
  }
  // Gone: in the last run of every case, and not in this one, which ran every case too.
  const lastFull = history.find((run) => !run.meta.filter);
  if (!current.meta.filter && lastFull) {
    for (const old of lastFull.cases) {
      if (!now.has(old.id)) {
        list.push({ id: old.id, before: { passRate: old.passRate, passing: old.passing }, after: null, added: [], removed: [] });
      }
    }
  }

  const costBefore: Record<string, number | null> = {};
  for (const doc of new Set(current.cases.map((c) => c.folder))) {
    const ids = current.cases.filter((c) => c.folder === doc && c.passing !== null).map((c) => c.id);
    const old = ids.flatMap((id) => before.get(id) ?? []);
    costBefore[doc] = old.length ? sum(old.flatMap(ranRuns).map((r) => r.cost)) : null;
  }
  return { previous: history[0].meta, cases: list.sort((a, b) => a.id.localeCompare(b.id)), costBefore };
}

// ── The terminal ─────────────────────────────────────────────────────────────

/** Dollars, with enough digits for a sum of small amounts to read right. */
export const usd = (n: number | null) =>
  n === null ? "unknown" : n === 0 ? "$0" : `$${n.toFixed(n < 0.01 ? 4 : n < 1 ? 3 : 2)}`;
/** A model id without its provider: "gemini-3.8-flash". */
export const shortModel = (model: string) => model.split("/").pop() ?? model;

export const pct = (n: number | null) => (n === null ? "–" : `${Math.round(n * 100)}%`);

/** The run in a table: a row a document, then the total. */
export function terminalSummary(results: RunResults, changed: RunChanges | null) {
  const header = ["Document", "Model", "Cases", "Passed", "Failing", "To review", "Checker", "Judge", "Cost without cache", "Per run", ""];
  const rows = documents(results).map((d) =>
    d.ran === 0
      ? [`${d.title} (${d.folder})`, shortModel(d.model), String(d.cases), "–", "", "", "", "", "", "", `${d.skipped} skipped: files missing`]
      : [
          `${d.title} (${d.folder})`,
          shortModel(d.model),
          String(d.cases),
          pct(d.passRate),
          String(d.failing),
          String(d.toReview),
          usd(d.checker),
          usd(d.judge),
          usd(d.cost),
          usd(d.perRun),
          d.skipped ? `${d.skipped} skipped` : "",
        ],
  );
  const t = totals(results);
  const total = ["Total", "", String(t.cases), pct(t.passRate), String(t.failing), String(t.toReview), usd(t.checker), usd(t.judge), usd(t.cost), "", ""];
  const all = [header, ...rows, total];
  const widths = header.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  // The name and the model left, the numbers right, the note as it is.
  const fmt = (r: string[]) =>
    r
      .map((cell, i) => (i <= 1 ? cell.padEnd(widths[i]) : i === r.length - 1 ? cell : cell.padStart(widths[i])))
      .join("  ")
      .trimEnd();
  const rule = "─".repeat(Math.max(...all.map((r) => fmt(r).length)));
  const since = changed
    ? `${changed.cases.length} case${changed.cases.length === 1 ? "" : "s"} changed since their last run.`
    : "No earlier run to compare with.";
  return [
    fmt(header),
    ...rows.map(fmt),
    rule,
    fmt(total),
    "",
    `Actual cost: ${usd(t.spent)} (${t.fresh} of ${t.calls} calls made; the rest came from the cache). ${since}`,
  ].join("\n");
}
