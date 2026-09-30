import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./db";
import { caseEvent, caseFile, casePerson, documentCheck, user } from "./db/schema";

// A case's files and checks for the admin panel: everything that was ever
// uploaded or run, removed files and failed checks included, where the app
// shows only what's current (lib/case-documents.ts, lib/checks/store.ts).

const uploader = alias(user, "uploader");
const remover = alias(user, "remover");

/** Every file the case uploaded, oldest first, with who uploaded and who removed it. */
export async function allCaseFiles(caseId: string) {
  const rows = await db
    .select({ file: caseFile, uploadedByName: uploader.name, deletedByName: remover.name })
    .from(caseFile)
    .leftJoin(uploader, eq(uploader.id, caseFile.uploadedBy))
    .leftJoin(remover, eq(remover.id, caseFile.deletedBy))
    .where(eq(caseFile.caseId, caseId))
    .orderBy(asc(caseFile.createdAt));
  return rows.map(({ file, uploadedByName, deletedByName }) => ({ ...file, uploadedByName, deletedByName }));
}

export type AdminFile = Awaited<ReturnType<typeof allCaseFiles>>[number];

/**
 * Every check run of the case, or of one of its documents, newest first.
 * Leaves out what was sent and the raw answers (context, guidance, calls):
 * they're large, and for reviewing one run, not for the list.
 */
export async function allCaseChecks(caseId: string, documentKey?: string) {
  return db
    .select({
      id: documentCheck.id,
      documentKey: documentCheck.documentKey,
      state: documentCheck.state,
      rating: documentCheck.rating,
      issues: documentCheck.issues,
      recommendations: documentCheck.recommendations,
      error: documentCheck.error,
      fileIds: documentCheck.fileIds,
      /** Differs between two runs when the case details or the check guidance changed. */
      contextHash: documentCheck.contextHash,
      model: documentCheck.model,
      rulesVersion: documentCheck.rulesVersion,
      knowledgeVersion: documentCheck.knowledgeVersion,
      attempts: documentCheck.attempts,
      ratingCorrected: documentCheck.ratingCorrected,
      pages: documentCheck.pages,
      costUsd: documentCheck.costUsd,
      durationMs: documentCheck.durationMs,
      startedAt: documentCheck.startedAt,
      finishedAt: documentCheck.finishedAt,
      checkedByName: user.name,
    })
    .from(documentCheck)
    .leftJoin(user, eq(user.id, documentCheck.checkedBy))
    .where(
      and(eq(documentCheck.caseId, caseId), documentKey ? eq(documentCheck.documentKey, documentKey) : undefined),
    )
    .orderBy(desc(documentCheck.startedAt));
}

export type AdminCheckRun = Awaited<ReturnType<typeof allCaseChecks>>[number];

/**
 * The case's details changes that put documents on its list or took them
 * off (case_event "details.changed"), oldest first. Uploads and removals
 * come from the files themselves, which have more than their events.
 */
export async function caseListChanges(caseId: string) {
  const rows = await db
    .select({ data: caseEvent.data, createdAt: caseEvent.createdAt, actorName: casePerson.name })
    .from(caseEvent)
    .leftJoin(casePerson, eq(casePerson.id, caseEvent.actorPersonId))
    .where(and(eq(caseEvent.caseId, caseId), eq(caseEvent.type, "details.changed")))
    .orderBy(asc(caseEvent.createdAt));
  return rows.map(({ data, ...row }) => ({
    ...row,
    ...(data as { fields: string[]; added: string[]; removed: string[] }),
  }));
}

/** One document's list changes, out of the case's. */
export function listChangesFor(changes: Awaited<ReturnType<typeof caseListChanges>>, documentKey: string) {
  return changes
    .filter((c) => c.added.includes(documentKey) || c.removed.includes(documentKey))
    .map(({ fields, createdAt, actorName, added }) => ({
      change: added.includes(documentKey) ? ("added" as const) : ("removed" as const),
      fields,
      createdAt,
      actorName,
    }));
}

export type ListChange = ReturnType<typeof listChangesFor>[number];
