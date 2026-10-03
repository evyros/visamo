import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { reportHtml } from "./html";
import { RUNS_DIR, changes, previousRuns, runResults, terminalSummary, type RunResults } from "./results";

// Saves a run of the evals: its results and its report, in a folder of its
// own (evals/.out/runs/<day>/<time>/), with the newest report also at
// evals/.out/runs/latest.html. Each case is compared with its last run.

export function saveRun(...args: Parameters<typeof runResults>) {
  const results: RunResults = runResults(...args);
  const changed = changes(results, previousRuns(results.meta.folder));
  const dir = path.join(RUNS_DIR, results.meta.folder);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "results.json"), JSON.stringify(results, null, 2) + "\n");
  const report = path.join(dir, "report.html");
  writeFileSync(report, reportHtml(results, changed, dir));
  // The same report, its links made from where it is.
  const latest = path.join(RUNS_DIR, "latest.html");
  writeFileSync(latest, reportHtml(results, changed, RUNS_DIR));
  return { summary: terminalSummary(results, changed), report, latest };
}
