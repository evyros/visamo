"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { findUser } from "@/lib/admin-users";
import { creditKinds, grantSupport, type CreditKind } from "@/lib/credits";

export type TopUpState = { error: string } | { added: string } | null;

/** The most one top-up can add, so a typo can't grant thousands. */
const MAX_TOP_UP = 1000;

/** A support top-up of the user's case, with the reason the admin gives. */
export async function topUp(_: TopUpState, formData: FormData): Promise<TopUpState> {
  const admin = await requireAdmin();
  const kind = String(formData.get("kind")) as CreditKind;
  const amount = Number(formData.get("amount"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!creditKinds.includes(kind)) return { error: "Choose messages or checks." };
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_TOP_UP) {
    return { error: `The amount is a whole number from 1 to ${MAX_TOP_UP}.` };
  }
  if (!note) return { error: "Write the reason: it’s kept with the top-up." };

  // The case comes from the user, not the form.
  const user = await findUser(String(formData.get("userId")));
  if (!user?.caseId) return { error: "This user has no case to top up." };

  await grantSupport(user.caseId, kind, amount, admin, note);
  refresh();
  return { added: `Added ${amount} ${kind === "messages" ? "messages" : "checks"}.` };
}
