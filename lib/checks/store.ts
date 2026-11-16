import "server-only";
import { and, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import { callTotals, type Completion } from "@/lib/chat/openrouter";
import { db } from "@/lib/db";
import { alias } from "drizzle-orm/pg-core";
import { casePerson, cases, documentCheck, findingDismissal, user } from "@/lib/db/schema";
import { checkFor, type DocumentCheck } from "@/lib/documents/checks";
import { caseCreditTotals } from "@/lib/credits";
import { recordEvent } from "@/lib/events";
import { sameSet } from "@/lib/same-set";
import { activeResult, type ActiveResult, type DismissReason, type FindingKind } from "./dismissals";
import { detailsHash } from "./prompt";
import type { CheckFinding, CheckResult } from "./result";

// Document checks in the database: every run of every item's check (the
// latest finished one the couple sees is the item's result), the findings the
// couple dismissed from it (lib/checks/dismissals.ts), and the case's balance,
// which lib/credits.ts spends and refunds. A free check the admin runs
// (lib/checks/free.ts) is the couple's only once approved.

/**
 * A check running longer than this was cut off (the route's maxDuration is
 * 300s): another may start. Its spend was never refunded, which is rare
 * enough to leave to support.
 */
const RUNNING_EXPIRES_SECONDS = 330;

/** Whether a run marked running, started then, still is: past its time, it was cut off. */
export function stillRunning(startedAt: Date) {
  return startedAt.getTime() > Date.now() - RUNNING_EXPIRES_SECONDS * 1000;
}

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
  /** Who it's recorded as run by: for a rerun, whoever ran the run it replaces. */
  userId: string | null;
  fileIds: string[];
  contextHash: string;
  detailsHash: string;
  model: string;
  context: string;
  guidance: DocumentCheck;
  rulesVersion: number;
  knowledgeVersion: number;
  /** An admin's rerun of the item's latest run (lib/checks/rerun.ts). */
  rerun?: boolean;
  /** A free check the admin runs starts pending (lib/checks/free.ts); a rerun keeps its run's. Null for the couple's own. */
  approval?: Approval | null;
};

/** Where a free check the admin ran stands (lib/checks/free.ts). */
export type Approval = "pending" | "approved" | "discarded";

/** The runs the couple sees: their own, and the admin's once approved. */
export const visibleToCouple = or(isNull(documentCheck.approval), eq(documentCheck.approval, "approved"));

/**
 * Whether the couple sees only the rating of a result: a free check the
 * admin approved, for a document other than the one shown in full, while
 * the case hasn't bought Full file check.
 */
export function isLocked(
  approval: Approval | null,
  documentKey: string,
  row: { fileCheck: boolean; freeFullKey: string | null },
) {
  return approval === "approved" && !row.fileCheck && row.freeFullKey !== documentKey;
}

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
        detailsHash: run.detailsHash,
        model: run.model,
        checkedBy: run.userId,
        context: run.context,
        guidance: run.guidance,
        rulesVersion: run.rulesVersion,
        knowledgeVersion: run.knowledgeVersion,
        rerunAt: run.rerun ? new Date() : null,
        approval: run.approval ?? null,
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

/**
 * Ends a run with its result, and its event. A free check the admin ran
 * (pending) gets its event when it's approved, once the couple sees it.
 */
export async function saveCheck(id: string, run: CheckRun, result: CheckResult, metrics: CheckMetrics) {
  const done = db
    .update(documentCheck)
    .set({
      state: "done",
      rating: result.rating,
      issues: result.issues,
      recommendations: result.recommendations,
      finishedAt: new Date(),
      ...metricColumns(metrics),
    })
    .where(eq(documentCheck.id, id));
  if (run.approval === "pending") {
    await done;
    return;
  }
  await db.batch([
    done,
    recordEvent(run.caseId, run.userId, {
      type: "document.checked",
      data: { documentKey: run.documentKey, rating: result.rating },
    }),
  ]);
}

/**
 * Ends an admin's rerun with its result, in the place of the run it reran:
 * it takes that run's who and when (and a free check's approval), and that
 * run is marked replaced. No event: to the couple, it's the same check.
 */
export async function saveRerun(
  id: string,
  replaced: { id: string; startedAt: Date; finishedAt: Date | null; approvedAt: Date | null; emailedAt: Date | null },
  result: CheckResult,
  metrics: CheckMetrics,
) {
  await db.batch([
    db
      .update(documentCheck)
      .set({
        state: "done",
        rating: result.rating,
        issues: result.issues,
        recommendations: result.recommendations,
        startedAt: replaced.startedAt,
        finishedAt: replaced.finishedAt,
        // A free check's approval and email stay its: the couple isn't emailed again.
        approvedAt: replaced.approvedAt,
        emailedAt: replaced.emailedAt,
        ...metricColumns(metrics),
      })
      .where(eq(documentCheck.id, id)),
    db.update(documentCheck).set({ replacedBy: id }).where(eq(documentCheck.id, replaced.id)),
  ]);
}

/**
 * What the app calls a partner: their name in the case, their account's, or
 * their email when both are blank; null when the account is gone.
 */
function displayName(personName: string | null, userName: string | null, email: string | null) {
  return [personName, userName, email].map((n) => n?.trim()).find(Boolean) ?? null;
}

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

/** A review the couple sees: never an "unclear" one. */
export type SharedOutcome = "checkerRight" | "checkerWrong";

/**
 * One step of a reviewed finding's history: the couple dismissed it, undid
 * that, or the admin reviewed it. Bringing it back by a "checker was right"
 * review is part of the review's step, not one of its own.
 */
export type FindingHistoryEntry =
  | { type: "dismissed"; at: Date; name: string | null; reason: DismissReason; note: string | null }
  | { type: "restored"; at: Date; name: string | null }
  | { type: "reviewed"; at: Date; outcome: SharedOutcome; note: string | null };

/**
 * The history of a finding the admin reviewed, as the app shows it: each
 * dismissal (who, the reason and what they wrote), each time the couple undid
 * one, and each right or wrong
 * review (the outcome and the note to the couple, never who reviewed it),
 * oldest first. `outcome` is the latest review's.
 */
export type FindingHistory = {
  kind: FindingKind;
  index: number;
  outcome: SharedOutcome;
  entries: FindingHistoryEntry[];
  /** The dismissal the latest review is on, to mark it seen. */
  reviewId: string;
  /** Neither partner has opened the latest review yet: its badge pulses. */
  isNew: boolean;
};

/** An item's check, as the page and the chat see it. */
export type ItemCheck = {
  /** The result is a free check: the admin approved it, or it's the couple's own that used their free check (lib/checks/free.ts). */
  free: boolean;
  /**
   * The couple sees only the result's rating, and how many findings it has
   * (isLocked). Then the result's findings are left out, unless asked for
   * the admin.
   */
  locked: { issues: number; recommendations: number } | null;
  /** Whether the document has a check written (lib/documents/checks.ts). */
  checkable: boolean;
  running: boolean;
  /** The latest finished run, whose findings can be dismissed. */
  runId: string | null;
  /** The latest result, without the findings dismissed from it, and its rating worked out again; null before the first. */
  result: ActiveResult | null;
  /** The findings dismissed from the latest result. */
  dismissed: DismissedFinding[];
  /** The histories of the latest result's findings the admin reviewed, dismissed now or not. */
  histories: FindingHistory[];
  /** The result was checked against the item's current files and the case's current details. */
  fresh: boolean;
  /** It was checked against the couple's current details (files aside). */
  detailsFresh: boolean;
  /** The files it checked, sorted, for the page to tell when they change. */
  fileIds: string[];
  checkedAt: Date | null;
  checkedByName: string | null;
};

/**
 * Every list item's check, by item key. A locked result comes without its
 * findings: only the admin panel asks for them (`admin`).
 */
export async function caseChecks(caseId: string, { admin = false } = {}): Promise<Map<string, ItemCheck>> {
  const [{ row: caseRow, details, branch }, files, rows] = await Promise.all([
    caseDetails(caseId),
    caseFiles(caseId),
    // Newest first, so an item's first finished run is its result. Failed and replaced runs are history only.
    db
      .select({ check: documentCheck, userName: user.name, userEmail: user.email, personName: casePerson.name })
      .from(documentCheck)
      .leftJoin(user, eq(user.id, documentCheck.checkedBy))
      .leftJoin(casePerson, eq(casePerson.userId, documentCheck.checkedBy))
      .where(
        and(
          eq(documentCheck.caseId, caseId),
          inArray(documentCheck.state, ["done", "running"]),
          isNull(documentCheck.replacedBy),
          visibleToCouple,
        ),
      )
      .orderBy(desc(documentCheck.startedAt)),
  ]);
  const expired = Date.now() - RUNNING_EXPIRES_SECONDS * 1000;
  const items = listOf(details).map((item) => {
    const mine = rows.filter((r) => r.check.documentKey === item.key);
    return { item, mine, found: mine.find((r) => r.check.state === "done" && r.check.rating) };
  });
  const runIds = items.flatMap(({ found }) => (found ? [found.check.id] : []));
  const [dismissed, histories] = await Promise.all([dismissedFrom(runIds), historiesFrom(runIds)]);
  const checks = new Map<string, ItemCheck>();
  for (const { item, mine, found } of items) {
    const check = checkFor(item.key, item.points);
    const row = found?.check;
    const gone = (row && dismissed.get(row.id)) || [];
    // What the admin hid before approving is out too, but never listed as dismissed: to the couple it doesn't exist.
    const active = row?.rating
      ? activeResult(
          { rating: row.rating, issues: row.issues ?? [], recommendations: row.recommendations ?? [] },
          [...(row.hidden ?? []), ...gone],
        )
      : null;
    // What couldn't be read says only that, and why: never locked.
    const locked =
      active && row && active.rating !== "unreadable" && isLocked(row.approval, item.key, caseRow)
        ? { issues: active.issues.length, recommendations: active.recommendations.length }
        : null;
    // What the couple can't see never leaves here: not to the page, and not to the chat.
    const result = active && locked && !admin ? { ...active, issues: [], recommendations: [] } : active;
    const fileIds = row?.fileIds ?? [];
    const current = files.filter((f) => f.documentKey === item.key).map((f) => f.id);
    // A result stays while its files and the couple's details do. A change to the checks or their
    // texts never retires one: a new check uses them. A run from before the details were kept stays.
    const detailsFresh = !!check && (!row?.detailsHash || row.detailsHash === detailsHash(details, branch));
    checks.set(item.key, {
      // A free check: one the admin approved, or the couple's own that used their free check, the
      // case's one result in full (lib/checks/free.ts takeFullPlace). Full file check's aren't.
      free: !!row && (row.approval === "approved" || (!caseRow.fileCheck && caseRow.freeFullKey === item.key)),
      locked,
      checkable: !!check,
      // An admin's rerun isn't shown running: the couple sees the result it replaces until it's done.
      running: mine.some(
        (r) => r.check.state === "running" && !r.check.rerunAt && r.check.startedAt.getTime() > expired,
      ),
      runId: row?.id ?? null,
      result,
      // Nor what was dismissed from it, or its history: the findings' text and the notes.
      dismissed: locked && !admin ? [] : gone,
      histories: (locked && !admin) || !row ? [] : (histories.get(row.id) ?? []),
      fresh: !!result && detailsFresh && sameSet(fileIds, current),
      detailsFresh,
      fileIds,
      checkedAt: row?.finishedAt ?? null,
      checkedByName: found ? displayName(found.personName, found.userName, found.userEmail) : null,
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
      userEmail: user.email,
      personName: casePerson.name,
    })
    .from(findingDismissal)
    .leftJoin(user, eq(user.id, findingDismissal.dismissedBy))
    .leftJoin(casePerson, eq(casePerson.userId, findingDismissal.dismissedBy))
    .where(and(inArray(findingDismissal.checkId, checkIds), isNull(findingDismissal.undoneAt)))
    .orderBy(findingDismissal.createdAt);
  for (const { checkId, userName, userEmail, personName, ...d } of rows) {
    byRun.set(checkId, [
      ...(byRun.get(checkId) ?? []),
      { ...d, dismissedByName: displayName(personName, userName, userEmail) },
    ]);
  }
  return byRun;
}

/**
 * The histories of these runs' findings the admin reviewed right or wrong, by
 * run: every dismissal of each, undone ones too, since a finding brought back
 * can be dismissed and reviewed again.
 */
async function historiesFrom(checkIds: string[]) {
  const byRun = new Map<string, FindingHistory[]>();
  if (checkIds.length === 0) return byRun;
  const undoer = alias(user, "undoer");
  const undoerPerson = alias(casePerson, "undoer_person");
  const rows = await db
    .select({
      id: findingDismissal.id,
      checkId: findingDismissal.checkId,
      kind: findingDismissal.kind,
      index: findingDismissal.index,
      opened: findingDismissal.reviewOpened,
      reason: findingDismissal.reason,
      dismissNote: findingDismissal.note,
      createdAt: findingDismissal.createdAt,
      undoneAt: findingDismissal.undoneAt,
      undoneBy: findingDismissal.undoneBy,
      undoerName: undoer.name,
      undoerEmail: undoer.email,
      undoerPersonName: undoerPerson.name,
      reviewedAt: findingDismissal.reviewedAt,
      outcome: findingDismissal.reviewOutcome,
      note: findingDismissal.reviewNote,
      userName: user.name,
      userEmail: user.email,
      personName: casePerson.name,
    })
    .from(findingDismissal)
    .leftJoin(user, eq(user.id, findingDismissal.dismissedBy))
    .leftJoin(casePerson, eq(casePerson.userId, findingDismissal.dismissedBy))
    .leftJoin(undoer, eq(undoer.id, findingDismissal.undoneBy))
    .leftJoin(undoerPerson, eq(undoerPerson.userId, findingDismissal.undoneBy))
    .where(inArray(findingDismissal.checkId, checkIds))
    .orderBy(findingDismissal.createdAt);
  type Review = { at: Date; outcome: SharedOutcome; id: string; opened: boolean };
  const byFinding = new Map<
    string,
    { checkId: string; kind: FindingKind; index: number; entries: FindingHistoryEntry[]; reviews: Review[] }
  >();
  for (const r of rows) {
    const key = `${r.checkId}:${r.kind}:${r.index}`;
    const finding = byFinding.get(key) ?? { checkId: r.checkId, kind: r.kind, index: r.index, entries: [], reviews: [] };
    byFinding.set(key, finding);
    finding.entries.push({
      type: "dismissed",
      at: r.createdAt,
      name: displayName(r.personName, r.userName, r.userEmail),
      reason: r.reason,
      note: r.dismissNote,
    });
    // Undone by a partner. One undone by no one was brought back by the review (or the account is gone).
    if (r.undoneAt && r.undoneBy) {
      finding.entries.push({
        type: "restored",
        at: r.undoneAt,
        name: displayName(r.undoerPersonName, r.undoerName, r.undoerEmail),
      });
    }
    if (r.reviewedAt && (r.outcome === "checkerRight" || r.outcome === "checkerWrong")) {
      finding.entries.push({ type: "reviewed", at: r.reviewedAt, outcome: r.outcome, note: r.note });
      finding.reviews.push({ at: r.reviewedAt, outcome: r.outcome, id: r.id, opened: r.opened });
    }
  }
  for (const { checkId, kind, index, entries, reviews } of byFinding.values()) {
    if (reviews.length === 0) continue;
    entries.sort((a, b) => a.at.getTime() - b.at.getTime());
    const latest = reviews.reduce((a, b) => (b.at > a.at ? b : a));
    byRun.set(checkId, [
      ...(byRun.get(checkId) ?? []),
      { kind, index, outcome: latest.outcome, entries, reviewId: latest.id, isNew: !latest.opened },
    ]);
  }
  return byRun;
}

/**
 * The latest finished run of an item that the couple sees: the one its result is, and whose
 * findings can be dismissed. With `before`, the one before that time: what
 * was the result then.
 */
export async function latestRun(caseId: string, documentKey: string, before?: Date) {
  const [row] = await db
    .select({
      id: documentCheck.id,
      rating: documentCheck.rating,
      issues: documentCheck.issues,
      recommendations: documentCheck.recommendations,
      fileIds: documentCheck.fileIds,
      checkedBy: documentCheck.checkedBy,
      startedAt: documentCheck.startedAt,
      finishedAt: documentCheck.finishedAt,
      approval: documentCheck.approval,
      approvedAt: documentCheck.approvedAt,
      emailedAt: documentCheck.emailedAt,
      hidden: documentCheck.hidden,
    })
    .from(documentCheck)
    .where(
      and(
        eq(documentCheck.caseId, caseId),
        eq(documentCheck.documentKey, documentKey),
        eq(documentCheck.state, "done"),
        isNotNull(documentCheck.rating),
        isNull(documentCheck.replacedBy),
        visibleToCouple,
        before && lt(documentCheck.startedAt, before),
      ),
    )
    .orderBy(desc(documentCheck.startedAt))
    .limit(1);
  return row ?? null;
}

/**
 * Dismisses one finding of an item's latest result, with the couple's reason,
 * and its event. False when there's no such finding to dismiss: an older run's,
 * one already dismissed, a result that couldn't be read, or a locked one.
 */
export async function dismissFinding(
  caseId: string,
  userId: string,
  input: { documentKey: string; checkId: string; kind: FindingKind; index: number; reason: DismissReason; note: string | null },
) {
  const [run, [caseRow]] = await Promise.all([
    latestRun(caseId, input.documentKey),
    db.select({ fileCheck: cases.fileCheck, freeFullKey: cases.freeFullKey }).from(cases).where(eq(cases.id, caseId)),
  ]);
  if (!run || run.id !== input.checkId || run.rating === "unreadable") return false;
  // A locked result's findings aren't shown, so none can be dismissed; nor one the admin hid.
  if (!caseRow || isLocked(run.approval, input.documentKey, caseRow)) return false;
  if (run.hidden?.some((h) => h.kind === input.kind && h.index === input.index)) return false;
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

/**
 * Marks the review on this dismissal of the case's as opened: its badge stops
 * pulsing, for both partners. A no-op if it isn't a review the couple sees.
 */
export async function markReviewOpened(caseId: string, dismissalId: string) {
  await db
    .update(findingDismissal)
    .set({ reviewOpened: true })
    .where(
      and(
        eq(findingDismissal.id, dismissalId),
        eq(findingDismissal.caseId, caseId),
        inArray(findingDismissal.reviewOutcome, ["checkerRight", "checkerWrong"]),
      ),
    );
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
 * never the couple's note. With `before`, from the result at that time: what
 * a rerun of the run then saw.
 */
export async function dismissedForNextCheck(caseId: string, documentKey: string, before?: Date) {
  const run = await latestRun(caseId, documentKey, before);
  if (!run) return [];
  return db
    .select({ kind: findingDismissal.kind, finding: findingDismissal.finding, reason: findingDismissal.reason })
    .from(findingDismissal)
    .where(and(eq(findingDismissal.checkId, run.id), isNull(findingDismissal.undoneAt)))
    .orderBy(findingDismissal.createdAt);
}
