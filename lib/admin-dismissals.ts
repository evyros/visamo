import "server-only";
import { and, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import { caseMember, findingDismissal, user } from "./db/schema";
import type { FindingKind } from "./checks/dismissals";
import { latestRun } from "./checks/store";
import { recordEvent } from "./events";

// The findings couples dismissed as wrong, for the admin to learn from:
// every dismissal of every case, undone ones too, and the admin's review of
// each. The app reads only a right or wrong review and its note
// (lib/checks/store.ts reviewsFrom), never who reviewed it.

/**
 * What the admin concluded about a dismissal. "Checker was wrong" and "checker
 * was right" are shown to the couple; "unclear" and "ignore" (nothing to act
 * on, like a finding the couple chose to ignore) stay with the admin.
 */
export const reviewOutcomes = ["checkerWrong", "checkerRight", "unclear", "ignore"] as const;
export type ReviewOutcome = (typeof reviewOutcomes)[number];

export type DismissalFilter = "open" | "reviewed";

const reviewed = isNotNull(findingDismissal.reviewedAt);

/** The dismissals not yet reviewed, or the reviewed ones, newest first. */
export async function listDismissals(filter: DismissalFilter) {
  return db
    .select({
      id: findingDismissal.id,
      caseId: findingDismissal.caseId,
      checkId: findingDismissal.checkId,
      documentKey: findingDismissal.documentKey,
      kind: findingDismissal.kind,
      finding: findingDismissal.finding,
      reason: findingDismissal.reason,
      note: findingDismissal.note,
      createdAt: findingDismissal.createdAt,
      undoneAt: findingDismissal.undoneAt,
      dismissedByName: user.name,
      /** A member of the case, for the links to its pages: who dismissed it, or another if their account is gone. */
      userId: sql<string | null>`coalesce(${findingDismissal.dismissedBy}, (select ${caseMember.userId} from ${caseMember} where ${caseMember.caseId} = ${findingDismissal.caseId} limit 1))`,
      reviewedAt: findingDismissal.reviewedAt,
      reviewedBy: findingDismissal.reviewedBy,
      reviewOutcome: findingDismissal.reviewOutcome,
      reviewNote: findingDismissal.reviewNote,
    })
    .from(findingDismissal)
    .leftJoin(user, eq(user.id, findingDismissal.dismissedBy))
    .where(filter === "open" ? isNull(findingDismissal.reviewedAt) : reviewed)
    .orderBy(desc(findingDismissal.createdAt));
}

export type AdminDismissal = Awaited<ReturnType<typeof listDismissals>>[number];

/** Per document: how many findings were dismissed, and how many wait for review. Most first. */
export async function dismissalCounts() {
  return db
    .select({
      documentKey: findingDismissal.documentKey,
      total: count(),
      open: sql<number>`count(*) filter (where ${findingDismissal.reviewedAt} is null)`.mapWith(Number),
    })
    .from(findingDismissal)
    .groupBy(findingDismissal.documentKey)
    .orderBy(desc(count()));
}

/** The rows of the same finding as this dismissal: every dismissal of it, in effect or undone. */
function sameFinding(row: { checkId: string; kind: FindingKind; index: number }) {
  return and(
    eq(findingDismissal.checkId, row.checkId),
    eq(findingDismissal.kind, row.kind),
    eq(findingDismissal.index, row.index),
  );
}

/**
 * "Checker was right" brings the finding back: the dismissal of it in effect,
 * whichever row that is (the couple may have dismissed it again since the one
 * reviewed), is undone by no one, at the review's own time. Run in the
 * review's batch, where now() is the same for both.
 */
function bringBack(row: { checkId: string; kind: FindingKind; index: number }) {
  return db
    .update(findingDismissal)
    .set({ undoneAt: sql`now()` })
    .where(and(sameFinding(row), isNull(findingDismissal.undoneAt)));
}

/**
 * Undoes what bringBack did, when a "checker was right" review is changed or
 * reopened: the row it undid (by no one, at the review's time) is in effect
 * again. Not if the couple has dismissed the finding again since: it's
 * dismissed already. Run before the review's own row changes, which it reads.
 */
function takeBack(id: string, row: { checkId: string; kind: FindingKind; index: number }) {
  return db
    .update(findingDismissal)
    .set({ undoneAt: null })
    .where(
      and(
        sameFinding(row),
        isNull(findingDismissal.undoneBy),
        sql`${findingDismissal.undoneAt} = (select reviewed_at from finding_dismissal where id = ${id})`,
        sql`not exists (
          select 1 from finding_dismissal o
          where o.check_id = ${row.checkId} and o.kind = ${row.kind} and o.index = ${row.index} and o.undone_at is null
        )`,
      ),
    );
}

/**
 * Records the admin's review of a dismissal; reviewing it again replaces it.
 *
 * What the couple sees of it (lib/checks/store.ts historiesFrom) only applies
 * to a dismissal of the item's latest result, the one they see: on an older
 * run's, the review is the admin's only. On the latest one:
 * - "Checker was right" brings the finding back (bringBack); changing it to
 *   another outcome takes that back (takeBack), as does reopening.
 * - A right or wrong review is shown with its note. When the outcome changes,
 *   it gets its time and an event; when it or the note changes, its badge
 *   pulses again. Saving it unchanged changes nothing the couple sees.
 *
 * All in one batch, so the review and what it does to the finding land
 * together. False if there's no such dismissal.
 */
export async function reviewDismissal(id: string, admin: string, outcome: ReviewOutcome, note: string | null) {
  const [row] = await db
    .select({
      caseId: findingDismissal.caseId,
      checkId: findingDismissal.checkId,
      documentKey: findingDismissal.documentKey,
      kind: findingDismissal.kind,
      index: findingDismissal.index,
      reviewOutcome: findingDismissal.reviewOutcome,
      reviewNote: findingDismissal.reviewNote,
    })
    .from(findingDismissal)
    .where(eq(findingDismissal.id, id));
  if (!row) return false;
  const latest = await latestRun(row.caseId, row.documentKey);
  const shown = latest?.id === row.checkId;
  const outcomeChanged = outcome !== row.reviewOutcome;
  const changed = outcomeChanged || note !== row.reviewNote;

  const update = db
    .update(findingDismissal)
    .set({
      reviewedBy: admin,
      reviewOutcome: outcome,
      reviewNote: note,
      // The review's time is when its outcome was decided: bringBack and takeBack match on it.
      ...(outcomeChanged && { reviewedAt: sql`now()` }),
      // A changed review is news again.
      ...(changed && { reviewOpened: false }),
    })
    .where(eq(findingDismissal.id, id));
  const shownOutcome = outcome === "checkerRight" || outcome === "checkerWrong";

  if (!shown || !outcomeChanged) {
    await update;
    return true;
  }
  const after = [
    ...(outcome === "checkerRight" ? [bringBack(row)] : []),
    ...(shownOutcome
      ? [
          recordEvent(row.caseId, null, {
            type: "finding.reviewed",
            data: { documentKey: row.documentKey, kind: row.kind, outcome },
          }),
        ]
      : []),
  ];
  // Away from "checker was right": what it brought back is dismissed again. Before the update, which it reads.
  if (row.reviewOutcome === "checkerRight") await db.batch([takeBack(id, row), update, ...after]);
  else await db.batch([update, ...after]);
  return true;
}

/** Back to the open list. What a "checker was right" review brought back is dismissed again. */
export async function reopenDismissal(id: string) {
  const [row] = await db
    .select({
      checkId: findingDismissal.checkId,
      kind: findingDismissal.kind,
      index: findingDismissal.index,
      reviewOutcome: findingDismissal.reviewOutcome,
    })
    .from(findingDismissal)
    .where(and(eq(findingDismissal.id, id), reviewed));
  if (!row) return;
  const clear = db
    .update(findingDismissal)
    .set({ reviewedAt: null, reviewedBy: null, reviewOutcome: null, reviewNote: null, reviewOpened: false })
    .where(eq(findingDismissal.id, id));
  if (row.reviewOutcome === "checkerRight") await db.batch([takeBack(id, row), clear]);
  else await clear;
}
