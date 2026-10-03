import "server-only";
import { and, count, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import { caseMember, findingDismissal, user } from "./db/schema";

// The findings couples dismissed as wrong, for the admin to learn from:
// every dismissal of every case, undone ones too, and the admin's review of
// each. The only place the review columns are read.

/** What the admin concluded about a dismissal. Admin only: never sent to the app. */
export const reviewOutcomes = ["checkerWrong", "checkerRight", "unclear"] as const;
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

/** Records the admin's review of a dismissal; reviewing it again replaces it. False if there's no such dismissal. */
export async function reviewDismissal(id: string, admin: string, outcome: ReviewOutcome, note: string | null) {
  const rows = await db
    .update(findingDismissal)
    .set({ reviewedAt: new Date(), reviewedBy: admin, reviewOutcome: outcome, reviewNote: note })
    .where(eq(findingDismissal.id, id))
    .returning({ id: findingDismissal.id });
  return rows.length > 0;
}

/** Back to the open list. */
export async function reopenDismissal(id: string) {
  await db
    .update(findingDismissal)
    .set({ reviewedAt: null, reviewedBy: null, reviewOutcome: null, reviewNote: null })
    .where(and(eq(findingDismissal.id, id), reviewed));
}
