import "server-only";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { loadMessages } from "@/i18n/messages";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import type { Completion } from "@/lib/chat/openrouter";
import type { Plan } from "@/lib/chat/plans";
import { db } from "@/lib/db";
import { casePerson, cases, documentCheck, user } from "@/lib/db/schema";
import { checkFor, type DocumentCheck } from "@/lib/documents/checks";
import { caseCreditTotals } from "@/lib/credits";
import { recordEvent } from "@/lib/events";
import { checkContext, contextHash } from "./prompt";
import type { CheckResult } from "./result";

// Document checks in the database: every run of every item's check (the
// latest finished one is the item's result), and the case's balance, which
// lib/credits.ts spends and refunds.

/**
 * A check running longer than this was cut off (the route's maxDuration is
 * 120s): another may start. Its spend was never refunded, which is rare
 * enough to leave to support.
 */
const RUNNING_EXPIRES_SECONDS = 150;

/** The case's plan, the checks it has left, and how many it was granted and used (lib/credits.ts). */
export async function checkBalance(caseId: string) {
  const [[row], totals] = await Promise.all([
    db.select({ plan: cases.plan, left: cases.checksLeft }).from(cases).where(eq(cases.id, caseId)).limit(1),
    caseCreditTotals(caseId),
  ]);
  return { plan: (row?.plan ?? "free") as Plan, left: row?.left ?? 0, ...totals.checks };
}

/** What a run is checked against, recorded when it starts. */
export type CheckRun = {
  caseId: string;
  documentKey: string;
  userId: string;
  fileIds: string[];
  contextHash: string;
  model: string;
  context: string;
  guidance: DocumentCheck;
  rulesVersion: number;
  knowledgeHash: string;
};

/** What a run took, recorded when it ends; a failed run has what it got to. */
export type CheckMetrics = {
  fileCount?: number;
  pages?: number;
  bytesSent?: number;
  calls: Completion[];
  ratingCorrected?: boolean;
  durationMs: number;
};

/** The columns for a run's metrics, the calls summed. */
function metricColumns({ calls, ...metrics }: CheckMetrics) {
  const sum = (pick: (call: Completion) => number) => calls.reduce((total, call) => total + pick(call), 0);
  const costs = calls.map((call) => call.costUsd);
  return {
    ...metrics,
    calls,
    attempts: calls.length,
    tokensIn: sum((c) => c.tokensIn),
    tokensOut: sum((c) => c.tokensOut),
    cachedTokens: sum((c) => c.cachedTokens),
    // Unknown if any call's cost is: a partial sum would read as the whole.
    costUsd: costs.every((cost) => cost !== null) ? costs.reduce((a, b) => a + b, 0) : null,
    modelMs: sum((c) => c.ms),
  };
}

/**
 * Starts a run of the item's check, unless one is already running: the
 * button can be pressed by the other partner, or again after a reload. Its
 * id, or null when one is running. A run left running past its time was cut
 * off, and is marked failed first.
 */
export async function claimCheck(run: CheckRun) {
  const item = and(eq(documentCheck.caseId, run.caseId), eq(documentCheck.documentKey, run.documentKey));
  const id = crypto.randomUUID();
  const [, [row]] = await db.batch([
    db
      .update(documentCheck)
      .set({ state: "failed", error: "cutOff", finishedAt: new Date() })
      .where(
        and(
          item,
          eq(documentCheck.state, "running"),
          lt(documentCheck.startedAt, sql`now() - make_interval(secs => ${RUNNING_EXPIRES_SECONDS})`),
        ),
      ),
    // The partial unique index (one running per item) turns a second run into a no-op.
    db
      .insert(documentCheck)
      .values({
        id,
        caseId: run.caseId,
        documentKey: run.documentKey,
        state: "running",
        fileIds: [...run.fileIds].sort(),
        contextHash: run.contextHash,
        model: run.model,
        checkedBy: run.userId,
        context: run.context,
        guidance: run.guidance,
        rulesVersion: run.rulesVersion,
        knowledgeHash: run.knowledgeHash,
      })
      .onConflictDoNothing()
      .returning({ id: documentCheck.id }),
  ]);
  return row ? row.id : null;
}

/** Ends a run that didn't get a result. Kept, with why, for reviewing. */
export async function failCheck(id: string, error: string, metrics: CheckMetrics) {
  await db
    .update(documentCheck)
    .set({ state: "failed", error: error.slice(0, 2000), finishedAt: new Date(), ...metricColumns(metrics) })
    .where(and(eq(documentCheck.id, id), eq(documentCheck.state, "running")));
}

/** Ends a run with its result, and its event. */
export async function saveCheck(id: string, run: CheckRun, result: CheckResult, metrics: CheckMetrics) {
  await db.batch([
    db
      .update(documentCheck)
      .set({
        state: "done",
        rating: result.rating,
        issues: result.issues,
        recommendations: result.recommendations,
        finishedAt: new Date(),
        ...metricColumns(metrics),
      })
      .where(eq(documentCheck.id, id)),
    recordEvent(run.caseId, run.userId, {
      type: "document.checked",
      data: { documentKey: run.documentKey, rating: result.rating },
    }),
  ]);
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().every((id, i) => id === [...b].sort()[i]);

/** An item's check, as the page and the chat see it. */
export type ItemCheck = {
  /** Whether the document has a check written (lib/documents/checks.ts). */
  checkable: boolean;
  running: boolean;
  /** The latest result; null before the first. */
  result: CheckResult | null;
  /** The result was checked against the item's current files and the case's current details. */
  fresh: boolean;
  /** It was checked against the case's current details and check guidance (files aside). */
  contextFresh: boolean;
  /** The files it checked, sorted, for the page to tell when they change. */
  fileIds: string[];
  checkedAt: Date | null;
  checkedByName: string | null;
};

/** Every list item's check, by item key. */
export async function caseChecks(caseId: string): Promise<Map<string, ItemCheck>> {
  const [{ details }, files, rows, t] = await Promise.all([
    caseDetails(caseId),
    caseFiles(caseId),
    // Newest first, so an item's first finished run is its result. Failed runs are history only.
    db
      .select({ check: documentCheck, userName: user.name, personName: casePerson.name })
      .from(documentCheck)
      .leftJoin(user, eq(user.id, documentCheck.checkedBy))
      .leftJoin(casePerson, eq(casePerson.userId, documentCheck.checkedBy))
      .where(and(eq(documentCheck.caseId, caseId), inArray(documentCheck.state, ["done", "running"])))
      .orderBy(desc(documentCheck.startedAt)),
    loadMessages("en"),
  ]);
  const expired = Date.now() - RUNNING_EXPIRES_SECONDS * 1000;
  const checks = new Map<string, ItemCheck>();
  for (const item of listOf(details)) {
    const check = checkFor(item.key);
    const mine = rows.filter((r) => r.check.documentKey === item.key);
    const found = mine.find((r) => r.check.state === "done" && r.check.rating);
    const row = found?.check;
    const result: CheckResult | null = row?.rating
      ? { rating: row.rating, issues: row.issues ?? [], recommendations: row.recommendations ?? [] }
      : null;
    const fileIds = row?.fileIds ?? [];
    const current = files.filter((f) => f.documentKey === item.key).map((f) => f.id);
    const contextFresh = !!check && row?.contextHash === contextHash(checkContext(details, item, t), check);
    checks.set(item.key, {
      checkable: !!check,
      running: mine.some((r) => r.check.state === "running" && r.check.startedAt.getTime() > expired),
      result,
      fresh: !!result && contextFresh && sameSet(fileIds, current),
      contextFresh,
      fileIds,
      checkedAt: row?.finishedAt ?? null,
      checkedByName: found ? (found.personName ?? found.userName) : null,
    });
  }
  return checks;
}
