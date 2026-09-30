"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { getAppLocale } from "@/i18n/app-locale";
import { getOrClaimCaseId, requireUser } from "@/lib/session";
import { recordConsent } from "@/lib/support-access";

export type ConsentState = { error: "agree" } | null;

/**
 * Records the signed-in partner's consent to a support-access request. The
 * page then shows how it ended: thanks, or why it was too late (expired, or
 * the other partner agreed first).
 */
export async function giveConsent(_: ConsentState, formData: FormData): Promise<ConsentState> {
  const user = await requireUser();
  if (formData.get("agree") !== "on") return { error: "agree" };
  const token = String(formData.get("token"));

  const [caseId, locale, list] = await Promise.all([getOrClaimCaseId(user), getAppLocale(), headers()]);
  if (caseId) {
    await recordConsent({
      token,
      caseId,
      user,
      locale,
      ip: list.get("x-forwarded-for")?.split(",")[0].trim() || list.get("x-real-ip"),
      userAgent: list.get("user-agent"),
    });
  }
  refresh();
  return null;
}
