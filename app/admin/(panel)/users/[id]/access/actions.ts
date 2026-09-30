"use server";

import { refresh } from "next/cache";
import { defaultLocale } from "@/i18n/config";
import { asLiveLocale } from "@/i18n/negotiate";
import { requireAdmin } from "@/lib/admin";
import { caseMembers, findUser } from "@/lib/admin-users";
import { sendSupportAccessEmail } from "@/lib/email";
import { cancelAccessRequest, createAccessRequest } from "@/lib/support-access";
import { isAccessDuration, isAccessReason } from "@/lib/support-access-options";

export type RequestAccessState =
  | { error: string }
  /** The link is only shown here, once: only its token's hash is kept. */
  | { url: string; emailed: string[]; failed: string[] }
  | null;

/** A new support-access request for the user's case, replacing a pending one, emailed to the partners chosen. */
export async function requestAccess(_: RequestAccessState, formData: FormData): Promise<RequestAccessState> {
  const admin = await requireAdmin();
  const durationHours = Number(formData.get("duration"));
  // No reason is fine: the page just doesn't say.
  const reasonValue = String(formData.get("reason") ?? "");
  const reason = isAccessReason(reasonValue) ? reasonValue : null;
  if (!isAccessDuration(durationHours)) return { error: "Choose how long." };
  if (reasonValue && !reason) return { error: "Choose a reason from the list." };

  // The case comes from the user, not the form.
  const user = await findUser(String(formData.get("userId")));
  if (!user?.caseId) return { error: "This user has no case yet." };

  const chosen = new Set(formData.getAll("emailTo").map(String));
  const recipients = (await caseMembers(user.caseId)).filter((member) => chosen.has(member.id));
  const url = await createAccessRequest({ caseId: user.caseId, durationHours, reason, adminEmail: admin });

  const results = await Promise.allSettled(
    recipients.map((member) =>
      sendSupportAccessEmail({ to: member.email, url, locale: asLiveLocale(member.locale) ?? defaultLocale }),
    ),
  );
  const emailed: string[] = [];
  const failed: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") console.error("sendSupportAccessEmail failed", result.reason);
    (result.status === "fulfilled" ? emailed : failed).push(recipients[i].email);
  });

  refresh();
  return { url, emailed, failed };
}

export async function cancelRequest(formData: FormData) {
  await requireAdmin();
  const user = await findUser(String(formData.get("userId")));
  if (!user?.caseId) return;
  await cancelAccessRequest(user.caseId, String(formData.get("requestId")));
  refresh();
}
