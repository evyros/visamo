import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { loadMessages } from "@/i18n/messages";
import { CHECK_MODEL } from "@/lib/chat/openrouter";
import { askCheck } from "@/lib/checks/ask";
import { MAX_CHECK_PAGES, prepareContent } from "@/lib/checks/files";
import { checkShape } from "@/lib/checks/lines";
import { RULES_VERSION, checkContext, checkMessages } from "@/lib/checks/prompt";
import type { CheckResult } from "@/lib/checks/result";
import { KNOWLEDGE_VERSION } from "@/lib/knowledge-base";
import { cachedCompleteJson, type EvalCompletion } from "../cache";
import { loadCases, type EvalCase } from "./cases";
import { gradeRun, passes, toReview } from "./grade";
import { JUDGE_MODEL, judge } from "./judge";
import { saveRun } from "./report";
import { sum, type CaseOutcome, type Money, type RunOutcome } from "./results";

// The document check's evals: each case (evals/checks/*/cases.json) checked
// as the app checks it, EVAL_RUNS times (the model doesn't answer the same
// way twice), each run graded (grade.ts), with the judge on the findings
// nobody expected. A case passes when every one of its runs does.
//
//   npm run eval:checks                       every case
//   EVAL_FILTER=foreignPhotos npm run ...     the cases whose id has it
//
// Each run is saved to evals/.out/runs/<day>/<time>/ (results.json and
// report.html), each case compared with its last run; the newest report is also
// evals/.out/runs/latest.html.

const RUNS = Number(process.env.EVAL_RUNS ?? 3);
const FILTER = process.env.EVAL_FILTER || null;

const started = new Date();
const cases = loadCases().filter((c) => !FILTER || c.id.includes(FILTER));
const outcomes: CaseOutcome[] = [];

/** What calls cost: as made (cached ones too), and what this run paid. */
function money(checkCalls: EvalCompletion[], judgeCalls: EvalCompletion[]): Money {
  const all = [...checkCalls, ...judgeCalls];
  return {
    cost: sum(all.map((c) => c.costUsd)),
    spent: sum(all.map((c) => (c.cached ? 0 : c.costUsd))),
    checkCost: sum(checkCalls.map((c) => c.costUsd)),
    judgeCost: sum(judgeCalls.map((c) => c.costUsd)),
    judgeCalls: judgeCalls.length,
    calls: all.length,
    fresh: all.filter((c) => !c.cached).length,
  };
}

const prepare = (evalCase: EvalCase) =>
  prepareContent(evalCase.files, evalCase.check.maxPages ?? MAX_CHECK_PAGES, (file) =>
    readFile(file.path).then((b) => new Uint8Array(b)),
  );

async function runOnce(
  evalCase: EvalCase,
  run: number,
  context: string,
  prepared: Awaited<ReturnType<typeof prepare>>,
): Promise<RunOutcome> {
  const checkCalls: EvalCompletion[] = [];
  const judgeCalls: EvalCompletion[] = [];
  let result: CheckResult;
  if (!prepared.ok) {
    // A file PDFium or sharp can't open: the app says so without asking the model.
    result = { rating: "unreadable", issues: [], recommendations: [] };
  } else {
    try {
      const messages = await checkMessages({ ...evalCase, context, files: prepared.parts });
      result = (await askCheck(messages, checkShape(evalCase.check), checkCalls, cachedCompleteJson(`check:${run}`))).result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { run, error: message, passed: false, ...money(checkCalls, judgeCalls) };
    }
  }

  const grade = gradeRun(result, evalCase.expect, evalCase.lines);
  if (grade.unexpected.length && prepared.ok) {
    const complete = cachedCompleteJson(`judge:${run}`);
    const verdicts = await judge(evalCase, context, prepared.parts, grade.unexpected, async (...args) => {
      const call = await complete(...args);
      judgeCalls.push(call);
      return call;
    });
    verdicts.forEach((verdict, i) => (grade.unexpected[i].verdict = verdict));
  }
  return { run, result, grade, passed: passes(grade), ...money(checkCalls, judgeCalls) };
}

async function evaluate(evalCase: EvalCase): Promise<CaseOutcome> {
  const prepared = await prepare(evalCase);
  if (!prepared.ok && "error" in prepared) throw new Error(`${evalCase.id}: the files are ${prepared.error}`);
  const context = checkContext(evalCase.details, evalCase.branch, evalCase.item, await loadMessages("en"));
  const runs = await Promise.all(Array.from({ length: RUNS }, (_, run) => runOnce(evalCase, run, context, prepared)));
  return { evalCase, runs, passRate: runs.filter((r) => r.passed).length / runs.length };
}

describe(`document checks (${CHECK_MODEL}, judged by ${JUDGE_MODEL}, ${RUNS} runs each)`, () => {
  for (const evalCase of cases) {
    if (evalCase.missing.length) {
      it.skip(`${evalCase.id}: add ${evalCase.missing.join(", ")}`);
      continue;
    }
    it.concurrent(evalCase.id, async () => {
      const outcome = await evaluate(evalCase);
      outcomes.push(outcome);
      const failed = outcome.runs.filter((r) => !r.passed);
      expect(failed.length, `${evalCase.id} failed ${failed.length} of ${outcome.runs.length} runs:\n${failed.map(describeFailure).join("\n")}`).toBe(0);
    });
  }

  afterAll(() => {
    if (!outcomes.length) return;
    const saved = saveRun(outcomes, cases.filter((c) => c.missing.length), {
      started,
      filter: FILTER,
      checkModel: CHECK_MODEL,
      judgeModel: JUDGE_MODEL,
      runs: RUNS,
      rulesVersion: RULES_VERSION,
      knowledgeVersion: KNOWLEDGE_VERSION,
    });
    const relative = (file: string) => path.relative(process.cwd(), file);
    process.stdout.write(`\n${saved.summary}\n\nReport: ${relative(saved.report)}\n        (also ${relative(saved.latest)})\n`);
  });
});

/** Why a run failed, in a line, for the test's message. */
function describeFailure(run: RunOutcome) {
  if ("error" in run) return `  run ${run.run + 1}: ${run.error}`;
  const { grade } = run;
  const why = [
    !grade.ratingOk && `rated ${grade.rating}`,
    ...grade.missed.map((l) => `missed ${l.id}`),
    ...grade.wrongKind.map((w) => `${w.line.id} as ${w.finding.kind}`),
    ...grade.unexpected
      .filter((u) => u.verdict?.verdict === "invalid")
      .map((u) => `wrong finding "${u.finding.en.title}" (${u.verdict!.reason})`),
  ].filter(Boolean);
  const review = toReview(grade).length;
  return `  run ${run.run + 1}: ${why.join("; ")}${review ? ` (+${review} to review)` : ""}`;
}
