"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { findUser } from "@/lib/admin-users";
import { rerunCheck } from "@/lib/checks/rerun";

export type RerunState = { error: string } | { done: true } | null;

/** Reruns the document's latest check in its place (lib/checks/rerun.ts). Can take minutes: the page's maxDuration. */
export async function rerun(_: RerunState, formData: FormData): Promise<RerunState> {
  await requireAdmin();
  // The case comes from the user, not the form.
  const user = await findUser(String(formData.get("userId")));
  if (!user?.caseId) return { error: "This user has no case." };
  const error = await rerunCheck(user.caseId, String(formData.get("documentKey")), String(formData.get("checkId")));
  refresh();
  return error ? { error } : { done: true };
}
