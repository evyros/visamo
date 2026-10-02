"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { findUser } from "@/lib/admin-users";
import { creditKinds, grantSupport, grantSupportPurchase, revokeSupportPurchase, type CreditKind } from "@/lib/credits";
import { isProductId } from "@/lib/products";
import { productLabels } from "@/components/admin/admin-ui";

export type TopUpState = { error: string } | { added: string } | null;

/** The most one top-up can add, so a typo can't grant thousands. */
const MAX_TOP_UP = 1000;

/** The reason the admin writes, kept on the ledger entries. */
const noteOf = (formData: FormData) => String(formData.get("note") ?? "").trim().slice(0, 500);

/** A support top-up of the user's case, with the reason the admin gives. */
export async function topUp(_: TopUpState, formData: FormData): Promise<TopUpState> {
  const admin = await requireAdmin();
  const kind = String(formData.get("kind")) as CreditKind;
  const amount = Number(formData.get("amount"));
  const note = noteOf(formData);
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

/**
 * Gives the user's case a product, as if they'd bought it: its messages and
 * checks, and what it unlocks (longer messages, document checks).
 */
export async function givePurchase(_: TopUpState, formData: FormData): Promise<TopUpState> {
  const admin = await requireAdmin();
  const product = formData.get("product");
  const note = noteOf(formData);
  if (!isProductId(product)) return { error: "Choose a product." };
  if (!note) return { error: "Write the reason: it’s kept with the purchase." };

  const user = await findUser(String(formData.get("userId")));
  if (!user?.caseId) return { error: "This user has no case yet." };
  // It's bought once for the whole process; more checks are a top-up.
  if (product === "fileCheck" && user.fileCheck) {
    return { error: "The case already has Full file check. Top up checks instead." };
  }

  await grantSupportPurchase(user.caseId, user.id, product, admin, note);
  refresh();
  return { added: `Gave ${productLabels[product]}.` };
}

export type RevokeState = { error: string } | { revoked: true } | null;

/** Takes back what one of the case's purchases granted, with the reason the admin gives. */
export async function revokePurchase(_: RevokeState, formData: FormData): Promise<RevokeState> {
  const admin = await requireAdmin();
  const note = noteOf(formData);
  if (!note) return { error: "Write the reason: it’s kept with what’s taken back." };

  const user = await findUser(String(formData.get("userId")));
  if (!user?.caseId) return { error: "This user has no case." };

  const revoked = await revokeSupportPurchase(user.caseId, String(formData.get("purchaseId")), admin, note);
  if (!revoked) return { error: "This purchase was already taken back." };
  refresh();
  return { revoked: true };
}
