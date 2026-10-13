import "server-only";
import { format, loadMessages } from "@/i18n/messages";
import { refund, spend } from "@/lib/credits";
import type { DocumentCheck } from "@/lib/documents/checks";
import type { RequiredDocument } from "@/lib/documents/build";
import { askCheck } from "./ask";
import { MAX_CHECK_PAGES, prepareFiles } from "./files";
import { checkMessages } from "./prompt";
import type { CheckResult } from "./result";
import { failCheck, type CheckMetrics } from "./store";

// A claimed run of an item's check (lib/checks/store.ts claimCheck), to its
// end: the files made ready, the model asked, and the result saved or the
// run failed. The couple's checks (app/api/documents/check) spend one of the
// case's checks, given back if it fails or the files can't be read; an
// admin's rerun (lib/checks/rerun.ts) spends nothing.

export type CheckFailure =
  | { error: "tooManyPages"; maxPages: number }
  | { error: "tooLarge" | "noChecks" | "failed" };

export async function performCheck({
  runId,
  caseId,
  item,
  check,
  context,
  files,
  today,
  dismissed,
  chargeTo,
  save,
}: {
  runId: string;
  caseId: string;
  item: RequiredDocument;
  check: DocumentCheck;
  context: string;
  files: { id: string; name: string; contentType: string }[];
  /** yyyy-mm-dd, in Israel. */
  today: string;
  dismissed: Parameters<typeof checkMessages>[0]["dismissed"];
  /** The user whose check is spent; null spends none. */
  chargeTo: string | null;
  /** Saves the result, once there is one. */
  save: (result: CheckResult, metrics: CheckMetrics) => Promise<void>;
}): Promise<CheckFailure | null> {
  const started = performance.now();
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
      return prepared.error === "tooManyPages" ? { error: "tooManyPages", maxPages } : { error: prepared.error };
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
      if (chargeTo) {
        if ((await spend(caseId, "checks", chargeTo, runId)) === null) {
          await failCheck(runId, "noChecks", metrics());
          return { error: "noChecks" };
        }
        spent = true;
      }
      const answer = await askCheck(
        await checkMessages({ item, context, check, files: prepared.parts, today, dismissed }),
        check,
        measured.calls,
      );
      result = answer.result;
      measured.ratingCorrected = answer.corrected;
      if (result.rating === "unreadable" && spent) {
        await refund(caseId, "checks", chargeTo!, runId);
        spent = false;
      }
    }
    await save(result, metrics());
    return null;
  } catch (error) {
    console.error("document check failed", error);
    if (spent) await refund(caseId, "checks", chargeTo!, runId);
    await failCheck(runId, error instanceof Error ? error.message : String(error), metrics());
    return { error: "failed" };
  }
}
