"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { MAX_REVIEW_NOTE } from "@/lib/checks/dismissals";
import { reopenDismissal, reviewDismissal, reviewOutcomes, type ReviewOutcome } from "@/lib/admin-dismissals";

export type ReviewState = { error: string } | null;

/** The admin's review of a dismissed finding: what they concluded, and a note. */
export async function review(_: ReviewState, formData: FormData): Promise<ReviewState> {
  const admin = await requireAdmin();
  const outcome = String(formData.get("outcome")) as ReviewOutcome;
  // A textarea sends its line breaks as \r\n: kept as \n, so each counts once toward the limit, as it did in the box.
  const note = String(formData.get("note") ?? "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, MAX_REVIEW_NOTE);
  if (!reviewOutcomes.includes(outcome)) return { error: "Choose what you concluded." };
  if (!(await reviewDismissal(String(formData.get("id")), admin, outcome, note || null))) {
    return { error: "This dismissal is gone." };
  }
  refresh();
  return null;
}

/** Back to the open list, to review again. */
export async function reopen(formData: FormData) {
  await requireAdmin();
  await reopenDismissal(String(formData.get("id")));
  refresh();
}
