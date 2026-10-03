"use server";

import { refresh } from "next/cache";
import { eq } from "drizzle-orm";
import {
  branches,
  changedFields,
  editablePersonFields,
  parseDetails,
  type BranchCode,
  type CaseDetails,
} from "@/lib/case-options";
import { caseDetails, listOf } from "@/lib/case-documents";
import { db } from "@/lib/db";
import { casePerson, cases } from "@/lib/db/schema";
import { countedEdits, recordEvent } from "@/lib/events";
import { requireCase } from "@/lib/session";
import { isDated, parseStageDate, sameTrack, dateKind, trackOf, type Stage, type StageDates } from "@/lib/stages";

// The overview's changes: the stage, the branch, and the case's details.
// Every change is written in one batch with its event (lib/events.ts).

const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

// ── Stage and branch ────────────────────────────────────────────────────────

export type StageResult = { error?: "invalid" | "generic" };

/**
 * Moves the case to a stage on its track, forward or back. A stage with a
 * date (stageDefinitions) saves it too: an appointment's or interview's date
 * is required, a past one isn't. Dates of other stages stay, so moving
 * forward again can offer them.
 */
export async function updateStage(stage: unknown, date: unknown): Promise<StageResult> {
  const { user, caseId } = await requireCase();
  const { row, details } = await caseDetails(caseId);
  if (!oneOf(trackOf(details), stage)) return { error: "invalid" };
  const dated = isDated(stage) ? stage : null;
  const day = dated && date !== null && date !== "" ? parseStageDate(dated, date) : null;
  if (dated && day === null && (date || dateKind(dated) === "scheduled")) return { error: "invalid" };

  const dateChanged = !!dated && day !== null && day !== row.stageDates[dated];
  if (row.stage === stage && !dateChanged) return {};
  const stageDates: StageDates = dated && day ? { ...row.stageDates, [dated]: day } : row.stageDates;
  try {
    await db.batch([
      db.update(cases).set({ stage, stageDates }).where(eq(cases.id, caseId)),
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
  // New answers can change the stages the couple goes through (a move to
  // married, say). Then they choose their stage again, from the new track.
  const track = trackOf(next);
  const trackChanged = !sameTrack(trackOf(details), track);
  return {
    row,
    people,
    next,
    track: trackChanged ? track : null,
    fields: changedFields(details, next),
    added,
    removed,
    // Only a change to the list counts: that's what trying out answers is after.
    counted: added.length > 0 || removed.length > 0,
    editsLeft: Math.max(0, row.detailEditsAllowed - edits),
  };
}

export type DetailsError = "invalid" | "limit" | "stage" | "generic";

export type DetailsPreview = {
  /** Nothing would change. */
  unchanged: boolean;
  /** The new stages, when the changes change them; the couple chooses their stage from these. */
  track: Stage[] | null;
  /** The current stage, if the new stages still have it. */
  stage: Stage | null;
};

export async function previewDetails(input: unknown): Promise<DetailsPreview | { error: DetailsError }> {
  const { caseId } = await requireCase();
  const plan = await planEdit(caseId, input);
  if (!plan) return { error: "invalid" };
  if (plan.editsLeft === 0) return { error: "limit" };
  const stage = plan.row.stage as Stage;
  return {
    unchanged: plan.fields.length === 0,
    track: plan.track,
    stage: plan.track?.includes(stage) ? stage : null,
  };
}

/** The editable answers of one person, for their row. */
function personUpdate(person: CaseDetails["israeli"], role: "israeli" | "foreign") {
  return Object.fromEntries(editablePersonFields[role].map((key) => [key, person[key]]));
}

/** `stage` is the one chosen in the preview, needed when the changes change the track. */
export async function saveDetails(input: unknown, stage: unknown): Promise<{ error?: DetailsError }> {
  const { user, caseId } = await requireCase();
  const plan = await planEdit(caseId, input);
  if (!plan) return { error: "invalid" };
  if (plan.editsLeft === 0) return { error: "limit" };
  if (plan.fields.length === 0) return {};
  if (plan.track && !oneOf(plan.track, stage)) return { error: "stage" };

  const { row, next, people, fields, added, removed, counted } = plan;
  const moved = plan.track && stage !== row.stage ? (stage as Stage) : null;
  const rowOf = (isIsraeli: boolean) => people.find((p) => p.isIsraeli === isIsraeli)!.id;
  try {
    await db.batch([
      db
        .update(cases)
        .set({ ...next.relationship, ...(moved && { stage: moved }) })
        .where(eq(cases.id, caseId)),
      db.update(casePerson).set(personUpdate(next.israeli, "israeli")).where(eq(casePerson.id, rowOf(true))),
      db.update(casePerson).set(personUpdate(next.foreign, "foreign")).where(eq(casePerson.id, rowOf(false))),
      recordEvent(caseId, user.id, { type: "details.changed", data: { fields, added, removed, counted } }),
      ...(moved
        ? [recordEvent(caseId, user.id, { type: "stage.changed", data: { from: row.stage, to: moved, date: null } })]
        : []),
    ]);
  } catch (error) {
    console.error("saveDetails failed", error);
    return { error: "generic" };
  }
  refresh();
  return {};
}
