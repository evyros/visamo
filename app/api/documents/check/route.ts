import { getAppLocale } from "@/i18n/app-locale";
import { todayInIsrael } from "@/i18n/format";
import { loadMessages } from "@/i18n/messages";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import { checkModel } from "@/lib/checks/ask";
import { RULES_VERSION, checkContext, contextHash, detailsHash } from "@/lib/checks/prompt";
import { performCheck } from "@/lib/checks/run";
import { caseChecks, checkBalance, claimCheck, dismissedForNextCheck, saveCheck } from "@/lib/checks/store";
import { checkView } from "@/lib/checks/view";
import { checkFor } from "@/lib/documents/checks";
import { KNOWLEDGE_VERSION } from "@/lib/knowledge-base";
import { findUserCase } from "@/lib/session";

// Checks one item of the case's list: all its files (the document, and its
// apostille or translation if they're there) go to the model together, which rates them and says what to
// fix or improve. The findings the couple dismissed from the last run go with
// them, for the model to look at again. One check counts toward the case's fair-use limit, given
// back if it fails or the files can't be read. One check runs per item at a
// time; the item's last result stays until the new one replaces it. Every
// run is kept, failed ones too, for reviewing how checks work. GET gives
// every item's state, for a page that was open while a check ran.

export const maxDuration = 300;

type ErrorCode =
  | "unauthorized"
  | "invalid"
  | "notIncluded"
  | "notFound"
  | "notCheckable"
  | "noDocument"
  | "running"
  | "tooManyPages"
  | "tooLarge"
  | "noChecks"
  | "failed";
const failureStatus = { tooLarge: 400, noChecks: 402, failed: 502 } as const;
const fail = (error: ErrorCode, status: number, extra?: { maxPages: number }) =>
  Response.json({ error, ...extra }, { status });

/** Every list item's check: whether one is running, and its latest result. */
export async function GET() {
  const current = await findUserCase();
  if (!current) return fail("unauthorized", 401);
  const [checks, locale] = await Promise.all([caseChecks(current.caseId), getAppLocale()]);
  return Response.json({
    checks: Object.fromEntries(
      [...checks].map(([key, check]) => [key, { running: check.running, last: checkView(check, locale) }]),
    ),
  });
}

export async function POST(request: Request) {
  const current = await findUserCase();
  if (!current) return fail("unauthorized", 401);
  const { user, caseId } = current;

  const body = (await request.json().catch(() => null)) as { documentKey?: unknown } | null;
  const documentKey = typeof body?.documentKey === "string" ? body.documentKey : "";
  if (!documentKey) return fail("invalid", 400);

  const [{ fileCheck }, { details, branch }, allFiles, dismissed] = await Promise.all([
    checkBalance(caseId),
    caseDetails(caseId),
    caseFiles(caseId),
    // Before this run is claimed: from the last finished one.
    dismissedForNextCheck(caseId, documentKey),
  ]);
  if (!fileCheck) return fail("notIncluded", 402);
  const item = listOf(details).find((d) => d.key === documentKey);
  if (!item) return fail("notFound", 404);
  const check = checkFor(documentKey, item.points);
  if (!check) return fail("notCheckable", 400);
  const files = allFiles.filter((f) => f.documentKey === documentKey);
  if (files.length === 0) return fail("noDocument", 400);

  const context = checkContext(details, branch, item, await loadMessages("en"));
  const run = {
    caseId,
    documentKey,
    userId: user.id,
    fileIds: files.map((f) => f.id),
    contextHash: contextHash(context, check),
    detailsHash: detailsHash(details, branch),
    model: checkModel(check),
    context,
    guidance: check,
    rulesVersion: RULES_VERSION,
    knowledgeVersion: KNOWLEDGE_VERSION,
  };
  const runId = await claimCheck(run);
  if (!runId) return fail("running", 409);

  const failure = await performCheck({
    runId,
    caseId,
    item,
    check,
    context,
    files,
    today: todayInIsrael(),
    dismissed,
    chargeTo: user.id,
    save: (result, metrics) => saveCheck(runId, run, result, metrics),
  });
  if (failure?.error === "tooManyPages") return fail(failure.error, 400, { maxPages: failure.maxPages });
  if (failure) return fail(failure.error, failureStatus[failure.error]);

  const [checks, balance, locale] = await Promise.all([caseChecks(caseId), checkBalance(caseId), getAppLocale()]);
  const itemCheck = checks.get(documentKey);
  return Response.json({
    check: itemCheck && checkView(itemCheck, locale),
    checksLeft: balance.left,
  });
}
