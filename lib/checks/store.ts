import "server-only";
import { and, desc, eq, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { loadMessages } from "@/i18n/messages";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import { callTotals, type Completion } from "@/lib/chat/openrouter";
import { db } from "@/lib/db";
import { casePerson, cases, documentCheck, findingDismissal, user } from "@/lib/db/schema";
import { checkFor, type DocumentCheck } from "@/lib/documents/checks";
import { caseCreditTotals } from "@/lib/credits";
import { recordEvent } from "@/lib/events";
import { activeResult, type ActiveResult, type DismissReason, type FindingKind } from "./dismissals";
import { checkContext, contextHash } from "./prompt";
import type { CheckFinding, CheckResult } from "./result";

// Document checks in the database: every run of every item's check (the
// latest finished one is the item's result), the findings the couple
// dismissed from it (lib/checks/dismissals.ts), and the case's balance, which
// lib/credits.ts spends and refunds.

/**
 * A check running longer than this was cut off (the route's maxDuration is
 * 300s): another may start. Its spend was never refunded, which is rare
 * enough to leave to support.
 */
const RUNNING_EXPIRES_SECONDS = 330;

/** Whether the case bought Full file check, the checks it has left, and how many it was granted and used (lib/credits.ts). */
export async function checkBalance(caseId: string) {
  const [[row], totals] = await Promise.all([
    db.select({ fileCheck: cases.fileCheck, left: cases.checksLeft }).from(cases).where(eq(cases.id, caseId)).limit(1),
    caseCreditTotals(caseId),
  ]);
  return { fileCheck: row?.fileCheck ?? false, left: row?.left ?? 0, ...totals.checks };
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
  knowledgeVersion: number;
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
  return { ...metrics, calls, attempts: calls.length, ...callTotals(calls) };
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
        knowledgeVersion: run.knowledgeVersion,
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

/**
 * A finding the couple dismissed, as the app shows it: who and why, never
 * their note or the admin's review.
 */
export type DismissedFinding = {
  id: string;
  kind: FindingKind;
  index: number;
  finding: CheckFinding;
  reason: DismissReason;
  dismissedAt: Date;
  /** Null when the account is gone. */
  dismissedByName: string | null;
};

/** An item's check, as the page and the chat see it. */
export type ItemCheck = {
  /** Whether the document has a check written (lib/documents/checks.ts). */
  checkable: boolean;
  running: boolean;
  /** The latest finished run, whose findings can be dismissed. */
  runId: string | null;
  /** The latest result, without the findings dismissed from it, and its rating worked out again; null before the first. */
  result: ActiveResult | null;
  /** The findings dismissed from the latest result. */
  dismissed: DismissedFinding[];
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
  const [{ details, branch }, files, rows, t] = await Promise.all([
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
  const items = listOf(details).map((item) => {
    const mine = rows.filter((r) => r.check.documentKey === item.key);
    return { item, mine, found: mine.find((r) => r.check.state === "done" && r.check.rating) };
  });
  const dismissed = await dismissedFrom(items.flatMap(({ found }) => (found ? [found.check.id] : [])));
  const checks = new Map<string, ItemCheck>();
  for (const { item, mine, found } of items) {
    const check = checkFor(item.key, item.points);
    const row = found?.check;
    const gone = (row && dismissed.get(row.id)) || [];
    const result = row?.rating
      ? activeResult({ rating: row.rating, issues: row.issues ?? [], recommendations: row.recommendations ?? [] }, gone)
      : null;
    const fileIds = row?.fileIds ?? [];
    const current = files.filter((f) => f.documentKey === item.key).map((f) => f.id);
    const contextFresh = !!check && row?.contextHash === contextHash(checkContext(details, branch, item, t), check);
    checks.set(item.key, {
      checkable: !!check,
      running: mine.some((r) => r.check.state === "running" && r.check.startedAt.getTime() > expired),
      runId: row?.id ?? null,
      result,
      dismissed: gone,
      fresh: !!result && contextFresh && sameSet(fileIds, current),
      contextFresh,
      fileIds,
      checkedAt: row?.finishedAt ?? null,
      checkedByName: found ? (found.personName ?? found.userName) : null,
    });
  }
  return checks;
}

/** The findings in effect dismissed from these runs, by run, oldest first. Only what the app shows. */
async function dismissedFrom(checkIds: string[]) {
  const byRun = new Map<string, DismissedFinding[]>();
  if (checkIds.length === 0) return byRun;
  const rows = await db
    .select({
      checkId: findingDismissal.checkId,
      id: findingDismissal.id,
      kind: findingDismissal.kind,
      index: findingDismissal.index,
      finding: findingDismissal.finding,
      reason: findingDismissal.reason,
      dismissedAt: findingDismissal.createdAt,
      userName: user.name,
      personName: casePerson.name,
    })
    .from(findingDismissal)
    .leftJoin(user, eq(user.id, findingDismissal.dismissedBy))
    .leftJoin(casePerson, eq(casePerson.userId, findingDismissal.dismissedBy))
    .where(and(inArray(findingDismissal.checkId, checkIds), isNull(findingDismissal.undoneAt)))
    .orderBy(findingDismissal.createdAt);
  for (const { checkId, userName, personName, ...d } of rows) {
    byRun.set(checkId, [...(byRun.get(checkId) ?? []), { ...d, dismissedByName: personName ?? userName }]);
  }
  return byRun;
}

/** The latest finished run of an item: the one its result is, and whose findings can be dismissed. */
async function latestRun(caseId: string, documentKey: string) {
  const [row] = await db
    .select({
      id: documentCheck.id,
      rating: documentCheck.rating,
      issues: documentCheck.issues,
      recommendations: documentCheck.recommendations,
    })
    .from(documentCheck)
    .where(
      and(
        eq(documentCheck.caseId, caseId),
        eq(documentCheck.documentKey, documentKey),
        eq(documentCheck.state, "done"),
        isNotNull(documentCheck.rating),
      ),
    )
    .orderBy(desc(documentCheck.startedAt))
    .limit(1);
  return row ?? null;
}

/**
 * Dismisses one finding of an item's latest result, with the couple's reason,
 * and its event. False when there's no such finding to dismiss: an older run's,
 * one already dismissed, or a result that couldn't be read.
 */
export async function dismissFinding(
  caseId: string,
  userId: string,
  input: { documentKey: string; checkId: string; kind: FindingKind; index: number; reason: DismissReason; note: string | null },
) {
  const run = await latestRun(caseId, input.documentKey);
  if (!run || run.id !== input.checkId || run.rating === "unreadable") return false;
  const finding = (input.kind === "issue" ? run.issues : run.recommendations)?.[input.index];
  if (!finding) return false;
  const [inserted] = await db.batch([
    // The partial unique index (one in effect per finding) turns a second dismissal into a no-op.
    db
      .insert(findingDismissal)
      .values({
        id: crypto.randomUUID(),
        caseId,
        checkId: run.id,
        documentKey: input.documentKey,
        kind: input.kind,
        index: input.index,
        finding,
        reason: input.reason,
        note: input.note,
        dismissedBy: userId,
      })
      .onConflictDoNothing()
      .returning({ id: findingDismissal.id }),
    recordEvent(caseId, userId, { type: "finding.dismissed", data: { documentKey: input.documentKey, kind: input.kind } }),
  ]);
  return inserted.length > 0;
}

/** Undoes a dismissal of the case's: the finding counts again. The row stays, for the admin. False if there's none in effect. */
export async function undoDismissal(caseId: string, userId: string, dismissalId: string) {
  const [row] = await db
    .update(findingDismissal)
    .set({ undoneAt: new Date(), undoneBy: userId })
    .where(and(eq(findingDismissal.id, dismissalId), eq(findingDismissal.caseId, caseId), isNull(findingDismissal.undoneAt)))
    .returning({ documentKey: findingDismissal.documentKey, kind: findingDismissal.kind });
  if (!row) return false;
  await recordEvent(caseId, userId, { type: "finding.restored", data: { documentKey: row.documentKey, kind: row.kind } });
  return true;
}

/**
 * The findings dismissed from the item's latest result, for its next check
 * to look at again: the model's own words and the reason from the list,
 * never the couple's note.
 */
export async function dismissedForNextCheck(caseId: string, documentKey: string) {
  const run = await latestRun(caseId, documentKey);
  if (!run) return [];
  return db
    .select({ kind: findingDismissal.kind, finding: findingDismissal.finding, reason: findingDismissal.reason })
    .from(findingDismissal)
    .where(and(eq(findingDismissal.checkId, run.id), isNull(findingDismissal.undoneAt)))
    .orderBy(findingDismissal.createdAt);
}
