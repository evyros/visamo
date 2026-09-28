import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { caseEvent, casePerson } from "./db/schema";

// The case's event log (case_event). Each action that changes the case adds
// recordEvent's insert to its own db.batch, so the change and its event are
// written together or not at all.

/** Every kind of event, with the details it keeps. A type's data never changes shape once written. */
export type CaseEvent =
  | { type: "case.created"; data: Record<string, never> }
  | { type: "file.uploaded"; data: { documentKey: string; slot: string; name: string } }
  | { type: "file.deleted"; data: { documentKey: string; slot: string; name: string } }
  | { type: "partner.invited"; data: { email: string } }
  | { type: "invite.resent"; data: { email: string } }
  | { type: "invite.cancelled"; data: { email: string } }
  | { type: "partner.joined"; data: Record<string, never> }
  | { type: "member.left"; data: Record<string, never> }
  | {
      type: "details.changed";
      data: {
        /** As changedFields in lib/case-options.ts names them. */
        fields: string[];
        /** Document list keys the change added and removed. */
        added: string[];
        removed: string[];
        /** Whether it counted toward the case's edits: it changed the document list. */
        counted: boolean;
      };
    }
  /** Also a date change without a new stage (from equals to), like a moved interview. */
  | { type: "stage.changed"; data: { from: string; to: string; date: string | null } }
  | { type: "branch.changed"; data: { from: string | null; to: string | null } };

/**
 * The insert for one event. The actor is the user's person in the case, looked
 * up when the insert runs, so it sees a person row written earlier in the same
 * batch. `id` is for events that must be written once, like an upload that's
 * retried: a second insert with the same id does nothing.
 */
export function recordEvent(caseId: string, userId: string | null, event: CaseEvent, id?: string) {
  const actor = userId
    ? sql`(select ${casePerson.id} from ${casePerson} where ${casePerson.userId} = ${userId})`
    : null;
  return db
    .insert(caseEvent)
    .values({ id: id ?? crypto.randomUUID(), caseId, actorPersonId: actor, ...event })
    .onConflictDoNothing();
}

/** How many details edits counted toward the case's allowance. */
export async function countedEdits(caseId: string) {
  const [{ edits }] = await db
    .select({ edits: count() })
    .from(caseEvent)
    .where(
      and(
        eq(caseEvent.caseId, caseId),
        eq(caseEvent.type, "details.changed"),
        sql`(${caseEvent.data}->>'counted')::boolean`,
      ),
    );
  return edits;
}

/** The case's latest events, newest first, with who did each. */
export async function recentEvents(caseId: string, limit: number) {
  const rows = await db
    .select({
      id: caseEvent.id,
      type: caseEvent.type,
      data: caseEvent.data,
      createdAt: caseEvent.createdAt,
      actorName: casePerson.name,
      actorGender: casePerson.gender,
    })
    .from(caseEvent)
    .leftJoin(casePerson, eq(casePerson.id, caseEvent.actorPersonId))
    .where(eq(caseEvent.caseId, caseId))
    .orderBy(desc(caseEvent.createdAt))
    .limit(limit);
  // The columns hold one CaseEvent each; the select types them apart.
  return rows.map(({ type, data, ...rest }) => ({ ...rest, event: { type, data } as CaseEvent }));
}
