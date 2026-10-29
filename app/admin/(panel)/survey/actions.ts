"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { voidSurveyVote } from "@/lib/branch-reports";

/** A vote that shouldn't count (spam, a fake): its answers leave the branches page's numbers. */
export async function voidVote(formData: FormData) {
  await requireAdmin();
  await voidSurveyVote(String(formData.get("id")));
  refresh();
}
