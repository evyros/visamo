import { getAppLocale } from "@/i18n/app-locale";
import { format, loadMessages } from "@/i18n/messages";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import { CHECK_MODEL, completeJson, type Completion, type ModelMessage } from "@/lib/chat/openrouter";
import { prepareFiles } from "@/lib/checks/files";
import { RULES_VERSION, checkContext, checkMessages, contextHash } from "@/lib/checks/prompt";
import { checkResultSchema, isConsistent, parseCheck, settle, type CheckResult } from "@/lib/checks/result";
import { caseChecks, checkBalance, claimCheck, failCheck, saveCheck, type CheckMetrics } from "@/lib/checks/store";
import { checkView } from "@/lib/checks/view";
import { refund, spend } from "@/lib/credits";
import { checkFor } from "@/lib/documents/checks";
import { KNOWLEDGE_VERSION } from "@/lib/knowledge-base";
import { findUserCase } from "@/lib/session";

// Checks one item of the case's list: all its files (the document, and its
// apostille or translation if they're there) go to the model together, which rates them and says what to
// fix or improve. One check counts toward the case's fair-use limit, given
// back if it fails or the files can't be read. One check runs per item at a
// time; the item's last result stays until the new one replaces it. Every
// run is kept, failed ones too, for reviewing how checks work.

export const maxDuration = 120;

const MAX_ANSWER_TOKENS = 4000;

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
const fail = (error: ErrorCode, status: number) => Response.json({ error }, { status });

/** Today in Israel, yyyy-mm-dd. */
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());

/**
 * The model's answer, asked for once more if it's malformed or its rating
 * doesn't fit its findings. Each call goes into `calls` as it's made, so a
 * run that fails midway still records what it cost.
 */
async function ask(messages: ModelMessage[], calls: Completion[]) {
  const call = async () => {
    const completion = await completeJson(messages, {
      model: CHECK_MODEL,
      maxTokens: MAX_ANSWER_TOKENS,
      name: "document_check",
      schema: checkResultSchema,
    });
    calls.push(completion);
    return parseCheck(completion.answer);
  };
  const settled = (answer: CheckResult) => {
    const result = settle(answer);
    return { result, corrected: result.rating !== answer.rating };
  };
  const first = await call();
  if (first && isConsistent(first)) return { result: first, corrected: false };
  const second = await call();
  if (second) return settled(second);
  if (first) return settled(first);
  throw new Error("The model's answer wasn't a check result");
}

export async function POST(request: Request) {
  const current = await findUserCase();
  if (!current) return fail("unauthorized", 401);
  const { user, caseId } = current;

  const body = (await request.json().catch(() => null)) as { documentKey?: unknown } | null;
  const documentKey = typeof body?.documentKey === "string" ? body.documentKey : "";
  if (!documentKey) return fail("invalid", 400);

  const [{ fileCheck }, { details }, allFiles] = await Promise.all([
    checkBalance(caseId),
    caseDetails(caseId),
    caseFiles(caseId),
  ]);
  if (!fileCheck) return fail("notIncluded", 402);
  const item = listOf(details).find((d) => d.key === documentKey);
  if (!item) return fail("notFound", 404);
  const check = checkFor(documentKey);
  if (!check) return fail("notCheckable", 400);
  const files = allFiles.filter((f) => f.documentKey === documentKey);
  if (files.length === 0) return fail("noDocument", 400);

  const started = performance.now();
  const context = checkContext(details, item, await loadMessages("en"));
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
    const prepared = await prepareFiles(caseId, files);
    let result: CheckResult;
    if (!prepared.ok && "error" in prepared) {
      await failCheck(runId, prepared.error, metrics());
      return fail(prepared.error, 400);
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
      const answer = await ask(
        await checkMessages({ context, check, files: prepared.parts, today: today() }),
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
