"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import {
  branches,
  changedFields,
  editablePersonFields,
  parseDetails,
  parseStageDate,
  stageDates,
  stages,
  type BranchCode,
  type CaseDetails,
} from "@/lib/case-options";
import { caseDetails, listOf } from "@/lib/case-documents";
import { db } from "@/lib/db";
import { casePerson, cases } from "@/lib/db/schema";
import { countedEdits, recordEvent } from "@/lib/events";
import { requireCase } from "@/lib/session";

// The overview's changes: the stage, the branch, and the case's details.
// Every change is written in one batch with its event (lib/events.ts).

const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

// ── Stage and branch ────────────────────────────────────────────────────────

export type StageResult = { error?: "invalid" | "generic" };

/**
 * Moves the case to a stage, forward or back. A stage with a date (stageDates)
 * saves it too: an interview's date is required, the filing date isn't.
 * Dates of other stages stay, so moving forward again can offer them.
 */
export async function updateStage(stage: unknown, date: unknown): Promise<StageResult> {
  const { user, caseId } = await requireCase();
  if (!oneOf(stages, stage)) return { error: "invalid" };
  const column = stage in stageDates ? stageDates[stage as keyof typeof stageDates] : null;
  const day = column && date !== null && date !== "" ? parseStageDate(stage, date) : null;
  if (column && day === null && (date || stage === "interviewScheduled")) return { error: "invalid" };

  const { row } = await caseDetails(caseId);
  const dateChanged = !!column && day !== null && day !== row[column];
  if (row.stage === stage && !dateChanged) return {};
  try {
    await db.batch([
      db
        .update(cases)
        .set({ stage, ...(column && day && { [column]: day }) })
        .where(eq(cases.id, caseId)),
      recordEvent(caseId, user.id, { type: "stage.changed", data: { from: row.stage, to: stage, date: day } }),
    ]);
  } catch (error) {
    console.error("updateStage failed", error);
    return { error: "generic" };
  }
  refresh();
  return {};
}

export async function updateBranch(branch: unknown): Promise<StageResult> {
  const { user, caseId } = await requireCase();
  if (branch !== null && !oneOf(branches, branch)) return { error: "invalid" };
  const { row } = await caseDetails(caseId);
  if (row.branch === branch) return {};
  try {
    await db.batch([
      db.update(cases).set({ branch }).where(eq(cases.id, caseId)),
      recordEvent(caseId, user.id, {
        type: "branch.changed",
        data: { from: row.branch, to: branch as BranchCode | null },
      }),
    ]);
  } catch (error) {
    console.error("updateBranch failed", error);
    return { error: "generic" };
  }
  refresh();
  return {};
}

// ── Details ─────────────────────────────────────────────────────────────────

/** What a details edit would do, worked out the same way for the preview and the save. */
async function planEdit(caseId: string, input: unknown) {
  const { row, people, details } = await caseDetails(caseId);
  const next = parseDetails(input, details);
  if (!next) return null;
  const before = listOf(details);
  const after = listOf(next);
  const beforeKeys = new Set(before.map((d) => d.key));
  const afterKeys = new Set(after.map((d) => d.key));
  const added = after.filter((d) => !beforeKeys.has(d.key)).map((d) => d.key);
  const removed = before.filter((d) => !afterKeys.has(d.key)).map((d) => d.key);
  const edits = await countedEdits(caseId);
  return {
    row,
    people,
    next,
    fields: changedFields(details, next),
    added,
    removed,
    // Only a change to the list counts: that's what trying out answers is after.
    counted: added.length > 0 || removed.length > 0,
    editsLeft: Math.max(0, row.detailEditsAllowed - edits),
  };
}

export type DetailsError = "invalid" | "limit" | "generic";

export type DetailsPreview = {
  /** Nothing would change. */
  unchanged: boolean;
};

export async function previewDetails(input: unknown): Promise<DetailsPreview | { error: DetailsError }> {
  const { caseId } = await requireCase();
  const plan = await planEdit(caseId, input);
  if (!plan) return { error: "invalid" };
  if (plan.editsLeft === 0) return { error: "limit" };
  return { unchanged: plan.fields.length === 0 };
}

/** The editable answers of one person, for their row. */
function personUpdate(person: CaseDetails["israeli"], role: "israeli" | "foreign") {
  return Object.fromEntries(editablePersonFields[role].map((key) => [key, person[key]]));
}

export async function saveDetails(input: unknown): Promise<{ error?: DetailsError }> {
  const { user, caseId } = await requireCase();
  const plan = await planEdit(caseId, input);
  if (!plan) return { error: "invalid" };
  if (plan.editsLeft === 0) return { error: "limit" };
  if (plan.fields.length === 0) return {};

  const { next, people, fields, added, removed, counted } = plan;
  const rowOf = (isIsraeli: boolean) => people.find((p) => p.isIsraeli === isIsraeli)!.id;
  try {
    await db.batch([
      db.update(cases).set(next.relationship).where(eq(cases.id, caseId)),
      db.update(casePerson).set(personUpdate(next.israeli, "israeli")).where(eq(casePerson.id, rowOf(true))),
      db.update(casePerson).set(personUpdate(next.foreign, "foreign")).where(eq(casePerson.id, rowOf(false))),
      recordEvent(caseId, user.id, { type: "details.changed", data: { fields, added, removed, counted } }),
    ]);
  } catch (error) {
    console.error("saveDetails failed", error);
    return { error: "generic" };
  }
  refresh();
  return {};
}
