import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { todayInIsrael } from "@/i18n/format";
import { loadMessages } from "@/i18n/messages";
import { caseDetails, listOf } from "@/lib/case-documents";
import { db } from "@/lib/db";
import { caseFile } from "@/lib/db/schema";
import { checkFor } from "@/lib/documents/checks";
import { KNOWLEDGE_VERSION } from "@/lib/knowledge-base";
import { checkModel } from "./ask";
import { RULES_VERSION, checkContext, contextHash } from "./prompt";
import { performCheck } from "./run";
import { claimCheck, dismissedForNextCheck, latestRun, saveRerun } from "./store";

// An admin's rerun of an item's latest check, after fixing what made it wrong
// (the check guidance, the rules, the knowledge base). It checks the same
// files, removed ones too, against the case's current details and the
// current guidance, as of the day the run being replaced ran, with the
// findings that run was asked to look at again. Once done, it takes that
// run's place: the same who and when, a new result. Nothing is spent and no
// event is written; the run it replaced stays, for the admin.

/** Reruns the item's latest finished run. An error to show the admin, or null when the new result is saved. */
export async function rerunCheck(caseId: string, documentKey: string, checkId: string): Promise<string | null> {
  const replaced = await latestRun(caseId, documentKey);
  if (!replaced || replaced.id !== checkId) return "This is no longer the document’s latest check. Reload the page.";

  const [{ details, branch }, fileRows, dismissed, t] = await Promise.all([
    caseDetails(caseId),
    replaced.fileIds.length
      ? db
          .select({ id: caseFile.id, name: caseFile.name, contentType: caseFile.contentType })
          .from(caseFile)
          .where(and(eq(caseFile.caseId, caseId), inArray(caseFile.id, replaced.fileIds)))
      : [],
    // What the run being replaced was asked to look at again: dismissed from the result before it.
    dismissedForNextCheck(caseId, documentKey, replaced.startedAt),
    loadMessages("en"),
  ]);
  const item = listOf(details).find((d) => d.key === documentKey);
  if (!item) return "This document is no longer on the case’s list.";
  const check = checkFor(documentKey, item.points);
  if (!check) return "This document has no check.";
  // In the run's order, which is sorted.
  const files = replaced.fileIds.flatMap((id) => fileRows.filter((f) => f.id === id));
  if (!files.length || files.length !== replaced.fileIds.length) return "Some of the files this check saw are gone.";

  const context = checkContext(details, branch, item, t);
  const runId = await claimCheck({
    caseId,
    documentKey,
    userId: replaced.checkedBy,
    fileIds: replaced.fileIds,
    contextHash: contextHash(context, check),
    model: checkModel(check),
    context,
    guidance: check,
    rulesVersion: RULES_VERSION,
    knowledgeVersion: KNOWLEDGE_VERSION,
    rerun: true,
  });
  if (!runId) return "A check of this document is running. Try again when it ends.";

  const failure = await performCheck({
    runId,
    caseId,
    item,
    check,
    context,
    files,
    today: todayInIsrael(replaced.startedAt),
    dismissed,
    chargeTo: null,
    save: (result, metrics) => saveRerun(runId, replaced, result, metrics),
  });
  if (!failure) return null;
  if (failure.error === "tooManyPages") return `The files have more than ${failure.maxPages} pages.`;
  if (failure.error === "tooLarge") return "The files are too large to send.";
  return "The rerun failed. Its error is in the history.";
}
