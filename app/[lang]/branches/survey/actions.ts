"use server";

import { headers } from "next/headers";
import { stageIds, surveyPath, type StageId } from "@/content/branches";
import { isLocale, type Locale } from "@/i18n/config";
import { todayInIsrael } from "@/i18n/format";
import {
  COMMENT_MAX,
  SINCE,
  filedError,
  satisfactionChoices,
  stageWaitError,
  surveyMonth,
  type Satisfaction,
  type SurveyStageAnswer,
} from "@/lib/branch-report-options";
import { createSurveyVote, resendSurveyCode, verifySurveyVote, type VerifyResult } from "@/lib/branch-reports";
import { branches, type BranchCode } from "@/lib/case-options";
import { sendSurveyCode } from "@/lib/email";
import { isEmail } from "@/lib/letters/rules";
import { localePath, site } from "@/lib/site";
import { passedTurnstile } from "@/lib/turnstile";

// The branches survey (components/branch-survey.tsx): a vote is saved as
// pending and its code emailed; it counts once the code is entered, on the
// page or through the email's link (lib/branch-reports.ts).

/** The email's link: the survey page, which enters the code itself. */
function verifyUrl(locale: Locale, id: string, code: string) {
  const url = new URL(localePath(locale, surveyPath), site.url);
  url.searchParams.set("vote", id);
  url.searchParams.set("code", code);
  return url.toString();
}

const votePattern = /^[A-Za-z0-9_-]{16}$/;

export type SubmitResult =
  | { ok: true; id: string; email: string }
  | { ok: false; error: "verify" | "limit" | "daily" | "branches" | "failed" };

export async function submitVote(data: FormData): Promise<SubmitResult> {
  const value = (key: string) => {
    const v = data.get(key);
    return typeof v === "string" ? v.trim() : "";
  };
  const locale = value("language");
  const branch = value("branch");
  const satisfaction = value("satisfaction");
  const email = value("email").toLowerCase();
  const comment = value("comment").slice(0, COMMENT_MAX) || null;
  const filed = value("filed");
  let stages: SurveyStageAnswer[];
  try {
    stages = JSON.parse(value("stages") || "[]");
  } catch {
    return { ok: false, error: "failed" };
  }

  // The form checks all this first; here it guards against anything else posting.
  const today = todayInIsrael();
  const valid =
    isLocale(locale) &&
    branches.includes(branch as BranchCode) &&
    satisfactionChoices.includes(satisfaction as Satisfaction) &&
    isEmail(email) &&
    value("consent") === "yes" &&
    filedError(filed, today) === null &&
    Array.isArray(stages) &&
    new Set(stages.map((s) => s?.stage)).size === stages.length &&
    stages.every(
      (s) =>
        stageIds.includes(s?.stage as StageId) &&
        (s.step === null || typeof s.step === "number") &&
        stageWaitError(s, filed, today) === null,
    ) &&
    // Experiences from before SINCE aren't counted, so they aren't taken.
    surveyMonth(filed, stages, today) >= SINCE;
  if (!valid) return { ok: false, error: "failed" };
  if (!(await passedTurnstile(value("cf-turnstile-response")))) return { ok: false, error: "verify" };

  const list = await headers();
  const ip = list.get("x-forwarded-for")?.split(",")[0].trim() || list.get("x-real-ip");
  try {
    const vote = await createSurveyVote({
      email,
      locale,
      branch: branch as BranchCode,
      filed,
      stages: stages.map(({ stage, step }) => ({ stage, step })),
      satisfaction: satisfaction as Satisfaction,
      comment,
      ip: ip || null,
    });
    if (!vote.ok) return vote;
    await sendSurveyCode({ to: email, code: vote.code, url: verifyUrl(locale, vote.id, vote.code), locale });
    return { ok: true, id: vote.id, email };
  } catch (error) {
    console.error("submitVote:", error);
    return { ok: false, error: "failed" };
  }
}

export async function verifyVote(id: string, code: string): Promise<VerifyResult | { ok: false; error: "failed" }> {
  if (!votePattern.test(id) || !/^\d{6}$/.test(code.replace(/\D/g, ""))) return { ok: false, error: "wrong" };
  try {
    return await verifySurveyVote(id, code);
  } catch (error) {
    console.error("verifyVote:", error);
    return { ok: false, error: "failed" };
  }
}

export type ResendResult = { ok: true } | { ok: false; error: "limit" | "failed" };

export async function resendCode(id: string): Promise<ResendResult> {
  if (!votePattern.test(id)) return { ok: false, error: "failed" };
  try {
    const vote = await resendSurveyCode(id);
    if (!vote) return { ok: false, error: "limit" };
    await sendSurveyCode({ to: vote.email, code: vote.code, url: verifyUrl(vote.locale, id, vote.code), locale: vote.locale });
    return { ok: true };
  } catch (error) {
    console.error("resendCode:", error);
    return { ok: false, error: "failed" };
  }
}
