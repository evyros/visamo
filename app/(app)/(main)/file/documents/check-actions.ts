"use server";

import { getAppLocale } from "@/i18n/app-locale";
import { dismissReasons, findingKinds, MAX_DISMISS_NOTE, type DismissReason, type FindingKind } from "@/lib/checks/dismissals";
import { caseChecks, dismissFinding, undoDismissal } from "@/lib/checks/store";
import { checkView, type CheckView } from "@/lib/checks/view";
import { requireCase } from "@/lib/session";

// Dismissing a finding of a document's check as wrong, and undoing it
// (lib/checks/dismissals.ts). Each answers with the item's check as it is
// now: its rating worked out again without the dismissed findings.

export type DismissResult = { check: CheckView | null } | { error: "invalid" | "notFound" };

/** The item's check as the page shows it, after a change. */
async function itemView(caseId: string, documentKey: string) {
  const [checks, locale] = await Promise.all([caseChecks(caseId), getAppLocale()]);
  const check = checks.get(documentKey);
  return { check: check ? checkView(check, locale) : null };
}

export async function dismiss(input: {
  documentKey: string;
  runId: string;
  kind: FindingKind;
  index: number;
  reason: DismissReason;
  note: string;
}): Promise<DismissResult> {
  const { user, caseId } = await requireCase();
  const note = typeof input.note === "string" ? input.note.trim().slice(0, MAX_DISMISS_NOTE) : "";
  if (
    typeof input.documentKey !== "string" ||
    typeof input.runId !== "string" ||
    !findingKinds.includes(input.kind) ||
    !Number.isInteger(input.index) ||
    input.index < 0 ||
    !dismissReasons.includes(input.reason) ||
    // "Something else" says what.
    (input.reason === "other" && !note)
  ) {
    return { error: "invalid" };
  }
  const dismissed = await dismissFinding(caseId, user.id, {
    documentKey: input.documentKey,
    checkId: input.runId,
    kind: input.kind,
    index: input.index,
    reason: input.reason,
    note: note || null,
  });
  if (!dismissed) return { error: "notFound" };
  return itemView(caseId, input.documentKey);
}

export async function undoDismiss(input: { documentKey: string; dismissalId: string }): Promise<DismissResult> {
  const { user, caseId } = await requireCase();
  if (typeof input.documentKey !== "string" || typeof input.dismissalId !== "string") return { error: "invalid" };
  if (!(await undoDismissal(caseId, user.id, input.dismissalId))) return { error: "notFound" };
  return itemView(caseId, input.documentKey);
}
