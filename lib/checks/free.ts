import "server-only";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { todayInIsrael } from "@/i18n/format";
import { loadMessages } from "@/i18n/messages";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import { db } from "@/lib/db";
import { caseEvent, cases, creditEntry, documentCheck } from "@/lib/db/schema";
import { checkFor } from "@/lib/documents/checks";
import { KNOWLEDGE_VERSION } from "@/lib/knowledge-base";
import { checkModel } from "./ask";
import type { FindingKind } from "./dismissals";
import { RULES_VERSION, checkContext, contextHash, detailsHash } from "./prompt";
import { queueResultsEmail } from "./results-email";
import { performCheck } from "./run";
import { claimCheck, dismissedForNextCheck, saveCheck, type CheckRun } from "./store";

// The admin's free check. A case without Full file check has one free check
// of its own (cases.checks_left), for any document. When the couple doesn't
// use it, the admin can check their documents from the admin panel,
// whichever and as many as they choose. Each result starts pending, seen
// only by the admin, who approves it, checks again, or discards it, and can
// take out findings that are wrong before approving.
//
// A case gets one result in full (cases.free_full_key): the couple's own
// free check (app/api/documents/check), or the first one the admin
// approves, which uses up the couple's free check. Every other approved one
// shows its rating only, its findings locked until they buy Full file check
// (lib/checks/store.ts isLocked). Approving also has the couple emailed
// (lib/checks/results-email.ts).

/** Checks the document's current files for the admin. An error to show the admin, or null once the pending result is saved. */
export async function runFreeCheck(caseId: string, documentKey: string): Promise<string | null> {
  const [{ row, details, branch }, allFiles, dismissed, t] = await Promise.all([
    caseDetails(caseId),
    caseFiles(caseId),
    dismissedForNextCheck(caseId, documentKey),
    loadMessages("en"),
  ]);
  if (row.fileCheck) return "This case has Full file check: the couple checks their documents themselves.";
  const item = listOf(details).find((d) => d.key === documentKey);
  if (!item) return "This document is no longer on the case’s list.";
  const check = checkFor(documentKey, item.points);
  if (!check) return "This document has no check.";
  const files = allFiles.filter((f) => f.documentKey === documentKey);
  if (!files.length) return "Nothing is uploaded to this document.";

  const context = checkContext(details, branch, item, t);
  const run: CheckRun = {
    caseId,
    documentKey,
    userId: null,
    fileIds: files.map((f) => f.id),
    contextHash: contextHash(context, check),
    detailsHash: detailsHash(details, branch),
    model: checkModel(check),
    context,
    guidance: check,
    rulesVersion: RULES_VERSION,
    knowledgeVersion: KNOWLEDGE_VERSION,
    approval: "pending",
  };
  const runId = await claimCheck(run);
  if (!runId) return "A check of this document is running. Try again when it ends.";

  const failure = await performCheck({
    runId,
    caseId,
    item,
    check,
    context,
    files,
    today: todayInIsrael(),
    dismissed,
    chargeTo: null,
    save: (result, metrics) => saveCheck(runId, run, result, metrics),
  });
  if (!failure) {
    // The new result replaces what waited before it, and any check that failed. Only now: a
    // check that fails leaves the result waiting from before, with what the admin hid on it.
    await discardOthers(caseId, documentKey, runId);
    return null;
  }
  if (failure.error === "tooManyPages") return `The files have more than ${failure.maxPages} pages.`;
  if (failure.error === "tooLarge") return "The files are too large to send.";
  return "The check failed. Its error is in the document’s history.";
}

/**
 * Shows a pending result to the couple: in full if no document is yet (or
 * it's the one already shown in full), otherwise locked. Taking the full
 * place uses up the couple's free check, if they still have it. A result
 * that couldn't read the files doesn't take the full place. An error to show
 * the admin, or null once approved.
 */
export async function approveFreeCheck(caseId: string, runId: string): Promise<string | null> {
  // One statement, so it's all or nothing: the approval, the full place, the
  // spend and its ledger entry, and the event. Every part sees the case as it
  // was before (`before`), and each write happens only if the one it follows
  // did: no approval, nothing else.
  const { rows } = await db.execute<{ approved: number }>(sql`
    with before as (
      select ${cases.checksLeft} as checks_left, ${cases.fileCheck} as file_check
      from ${cases} where ${cases.id} = ${caseId}
    ), approved as (
      update ${documentCheck} set approval = 'approved', approved_at = now()
      where ${documentCheck.id} = ${runId} and ${documentCheck.caseId} = ${caseId}
        and ${documentCheck.approval} = 'pending' and ${documentCheck.state} = 'done'
        and ${documentCheck.replacedBy} is null and ${documentCheck.rating} is not null
      returning document_key, rating
    ), took as (
      -- The full place, while no document has it; what couldn't be read doesn't take it.
      -- Taking it uses the couple's free check, if it's left. updated_at stays: not the couple's change.
      update ${cases} set
        free_full_key = approved.document_key,
        checks_left = case when not before.file_check and before.checks_left > 0
          then ${cases.checksLeft} - 1 else ${cases.checksLeft} end,
        updated_at = ${cases.updatedAt}
      from approved, before
      where ${cases.id} = ${caseId} and ${cases.freeFullKey} is null and approved.rating <> 'unreadable'
      returning ${cases.id}
    ), spent as (
      insert into ${creditEntry} (id, case_id, kind, delta, reason, ref_id)
      select ${crypto.randomUUID()}, ${caseId}, 'checks', -1, 'spend', ${runId}
      from took, before where not before.file_check and before.checks_left > 0
    ), cleared as (
      -- Checks of the document that failed: nothing left to decide on them.
      update ${documentCheck} set approval = 'discarded'
      from approved
      where ${documentCheck.caseId} = ${caseId} and ${documentCheck.documentKey} = approved.document_key
        and ${documentCheck.approval} = 'pending' and ${documentCheck.state} = 'failed'
    ), event as (
      insert into ${caseEvent} (id, case_id, type, data)
      select ${crypto.randomUUID()}, ${caseId}, 'document.freeChecked',
        jsonb_build_object('documentKey', approved.document_key, 'rating', approved.rating)
      from approved
    )
    select count(*)::int as approved from approved`);
  if (!rows[0]?.approved) return "This result is no longer waiting for approval. Reload the page.";
  await queueResultsEmail(caseId);
  return null;
}

/**
 * Makes the document the one the case sees in full, unless one is already:
 * only one can take the place, even when two results arrive together. True
 * when this one took it. The couple's own free check takes it too
 * (app/api/documents/check).
 */
export async function takeFullPlace(caseId: string, documentKey: string) {
  const [taken] = await db
    .update(cases)
    // updated_at stays: this isn't a change the couple made.
    .set({ freeFullKey: documentKey, updatedAt: sql`${cases.updatedAt}` })
    .where(and(eq(cases.id, caseId), isNull(cases.freeFullKey)))
    .returning({ id: cases.id });
  return !!taken;
}

/**
 * Drops a pending result, or a check that failed: the couple never sees it.
 * The document's other failed checks go with it. An error to show the admin, or null.
 */
export async function discardFreeCheck(caseId: string, runId: string): Promise<string | null> {
  const [run] = await db
    .update(documentCheck)
    .set({ approval: "discarded" })
    .where(
      and(
        eq(documentCheck.id, runId),
        eq(documentCheck.caseId, caseId),
        eq(documentCheck.approval, "pending"),
        ne(documentCheck.state, "running"),
      ),
    )
    .returning({ documentKey: documentCheck.documentKey });
  if (!run) return "This result is no longer waiting for approval. Reload the page.";
  await db
    .update(documentCheck)
    .set({ approval: "discarded" })
    .where(
      and(
        eq(documentCheck.caseId, caseId),
        eq(documentCheck.documentKey, run.documentKey),
        eq(documentCheck.approval, "pending"),
        eq(documentCheck.state, "failed"),
      ),
    );
  return null;
}

/** Discards the document's other pending runs, finished or failed: `keep` replaces them. */
async function discardOthers(caseId: string, documentKey: string, keep: string) {
  await db
    .update(documentCheck)
    .set({ approval: "discarded" })
    .where(
      and(
        eq(documentCheck.caseId, caseId),
        eq(documentCheck.documentKey, documentKey),
        eq(documentCheck.approval, "pending"),
        ne(documentCheck.state, "running"),
        ne(documentCheck.id, keep),
      ),
    );
}

/**
 * Takes a finding out of a result waiting for approval, or puts it back: to
 * the couple, a hidden finding doesn't exist (lib/checks/store.ts). Once
 * approved, it's fixed. An error to show the admin, or null.
 */
export async function setFindingHidden(
  caseId: string,
  runId: string,
  finding: { kind: FindingKind; index: number },
  hide: boolean,
): Promise<string | null> {
  if (!Number.isInteger(finding.index) || finding.index < 0) return "There’s no such finding.";
  const list = finding.kind === "issue" ? documentCheck.issues : documentCheck.recommendations;
  const entry = sql`jsonb_build_object('kind', ${finding.kind}::text, 'index', ${finding.index}::int)`;
  // The list without this finding, and with it again when hiding: worked out in the update
  // itself, so two quick clicks on different findings can't undo each other.
  const others = sql`(select coalesce(jsonb_agg(h), '[]'::jsonb)
    from jsonb_array_elements(coalesce(${documentCheck.hidden}, '[]'::jsonb)) h
    where h <> ${entry})`;
  const next = hide ? sql`${others} || jsonb_build_array(${entry})` : others;
  const [updated] = await db
    .update(documentCheck)
    .set({ hidden: sql`nullif(${next}, '[]'::jsonb)` })
    .where(
      and(
        eq(documentCheck.id, runId),
        eq(documentCheck.caseId, caseId),
        eq(documentCheck.approval, "pending"),
        eq(documentCheck.state, "done"),
        sql`jsonb_array_length(coalesce(${list}, '[]'::jsonb)) > ${finding.index}`,
      ),
    )
    .returning({ id: documentCheck.id });
  return updated ? null : "This result is no longer waiting for approval, or has no such finding. Reload the page.";
}
