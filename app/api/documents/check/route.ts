import { getAppLocale } from "@/i18n/app-locale";
import { todayInIsrael } from "@/i18n/format";
import { format, loadMessages } from "@/i18n/messages";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import { CHECK_MODEL } from "@/lib/chat/openrouter";
import { askCheck } from "@/lib/checks/ask";
import { MAX_CHECK_PAGES, prepareFiles } from "@/lib/checks/files";
import { RULES_VERSION, checkContext, checkMessages, contextHash } from "@/lib/checks/prompt";
import { checkShape } from "@/lib/checks/lines";
import type { CheckResult } from "@/lib/checks/result";
import {
  caseChecks,
  checkBalance,
  claimCheck,
  dismissedForNextCheck,
  failCheck,
  saveCheck,
  type CheckMetrics,
} from "@/lib/checks/store";
import { checkView } from "@/lib/checks/view";
import { refund, spend } from "@/lib/credits";
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

  const started = performance.now();
  const context = checkContext(details, branch, item, await loadMessages("en"));
  const run = {
    caseId,
    documentKey,
    userId: user.id,
    fileIds: files.map((f) => f.id),
    contextHash: contextHash(context, check),
    model: CHECK_MODEL,
    context,
    guidance: check,
    rulesVersion: RULES_VERSION,
    knowledgeVersion: KNOWLEDGE_VERSION,
  };
  const runId = await claimCheck(run);
  if (!runId) return fail("running", 409);

  // What the run took, filled in as it goes.
  const measured: Omit<CheckMetrics, "durationMs"> = { fileCount: files.length, calls: [] };
  const metrics = (): CheckMetrics => ({ ...measured, durationMs: Math.round(performance.now() - started) });
  let spent = false;
  try {
    const maxPages = check.maxPages ?? MAX_CHECK_PAGES;
    const prepared = await prepareFiles(caseId, files, maxPages);
    let result: CheckResult;
    if (!prepared.ok && "error" in prepared) {
      await failCheck(runId, prepared.error, metrics());
      return fail(prepared.error, 400, prepared.error === "tooManyPages" ? { maxPages } : undefined);
    }
    if (!prepared.ok) {
      // A file PDFium can't open: no need to ask the model, and not counted.
      const [en, he] = await Promise.all([loadMessages("en"), loadMessages("he")]);
      const say = (t: typeof en) => ({
        title: t.app.documentsPage.check.cantOpenTitle,
        detail: format(t.app.documentsPage.check.cantOpen, { name: prepared.unreadable }),
      });
      result = { rating: "unreadable", issues: [{ en: say(en), he: say(he) }], recommendations: [] };
    } else {
      measured.pages = prepared.pages;
      measured.bytesSent = prepared.bytes;
      if ((await spend(caseId, "checks", user.id, runId)) === null) {
        await failCheck(runId, "noChecks", metrics());
        return fail("noChecks", 402);
      }
      spent = true;
      const answer = await askCheck(
        await checkMessages({ item, context, check, files: prepared.parts, today: todayInIsrael(), dismissed }),
        checkShape(check),
        measured.calls,
      );
      result = answer.result;
      measured.ratingCorrected = answer.corrected;
      if (result.rating === "unreadable") {
        await refund(caseId, "checks", user.id, runId);
        spent = false;
      }
    }
    await saveCheck(runId, run, result, metrics());
  } catch (error) {
    console.error("document check failed", error);
    if (spent) await refund(caseId, "checks", user.id, runId);
    await failCheck(runId, error instanceof Error ? error.message : String(error), metrics());
    return fail("failed", 502);
  }

  const [checks, balance, locale] = await Promise.all([caseChecks(caseId), checkBalance(caseId), getAppLocale()]);
  const itemCheck = checks.get(documentKey);
  return Response.json({
    check: itemCheck && checkView(itemCheck, locale),
    checksLeft: balance.left,
  });
}
