"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { findUser } from "@/lib/admin-users";
import { findingKinds, type FindingKind } from "@/lib/checks/dismissals";
import { approveFreeCheck, discardFreeCheck, editFinding, runFreeCheck, setFindingHidden } from "@/lib/checks/free";

// The free check (lib/checks/free.ts), from a document's card on the user's
// documents page: check it, then approve the result for the couple or discard it.

export type FreeCheckState = { error: string } | { done: true } | null;

/** The case comes from the user, not the form. */
async function caseOf(formData: FormData) {
  await requireAdmin();
  const user = await findUser(String(formData.get("userId")));
  return user?.caseId ?? null;
}

const answer = (error: string | null): FreeCheckState => {
  refresh();
  return error ? { error } : { done: true };
};

/** Checks the document's current files; the result waits for approval. Can take minutes: the page's maxDuration. */
export async function checkDocument(_: FreeCheckState, formData: FormData): Promise<FreeCheckState> {
  const caseId = await caseOf(formData);
  if (!caseId) return { error: "This user has no case." };
  return answer(await runFreeCheck(caseId, String(formData.get("documentKey"))));
}

export async function approveResult(_: FreeCheckState, formData: FormData): Promise<FreeCheckState> {
  const caseId = await caseOf(formData);
  if (!caseId) return { error: "This user has no case." };
  return answer(await approveFreeCheck(caseId, String(formData.get("runId"))));
}

export async function discardResult(_: FreeCheckState, formData: FormData): Promise<FreeCheckState> {
  const caseId = await caseOf(formData);
  if (!caseId) return { error: "This user has no case." };
  return answer(await discardFreeCheck(caseId, String(formData.get("runId"))));
}

/** Takes a finding out of the result waiting for approval (`hide` "1"), or puts it back. */
export async function hideFinding(_: FreeCheckState, formData: FormData): Promise<FreeCheckState> {
  const caseId = await caseOf(formData);
  if (!caseId) return { error: "This user has no case." };
  const kind = String(formData.get("kind")) as FindingKind;
  if (!findingKinds.includes(kind)) return { error: "There’s no such finding." };
  const finding = { kind, index: Number(formData.get("index")) };
  return answer(await setFindingHidden(caseId, String(formData.get("runId")), finding, formData.get("hide") === "1"));
}

/** Rewrites a finding: its title and content in both languages, and while the result waits for approval, its kind. */
export async function saveFinding(_: FreeCheckState, formData: FormData): Promise<FreeCheckState> {
  const caseId = await caseOf(formData);
  if (!caseId) return { error: "This user has no case." };
  const field = (name: string) => String(formData.get(name) ?? "");
  const kind = field("kind") as FindingKind;
  const newKind = field("newKind") as FindingKind;
  if (!findingKinds.includes(kind) || !findingKinds.includes(newKind)) return { error: "There’s no such finding." };
  return answer(
    await editFinding(
      caseId,
      field("runId"),
      { kind, index: Number(field("index")) },
      {
        kind: newKind,
        en: { title: field("enTitle"), detail: field("enDetail") },
        he: { title: field("heTitle"), detail: field("heDetail") },
      },
    ),
  );
}
