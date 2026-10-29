import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull, lt, ne, or, sql } from "drizzle-orm";
import { connection } from "next/server";
import { stageIds, type BranchStats, type BranchesStats, type SentimentId, type StageId, type WaitSummary } from "@/content/branches/types";
import type { Locale } from "@/i18n/config";
import { todayInIsrael } from "@/i18n/format";
import { db } from "@/lib/db";
import { branchReport, surveyVote } from "@/lib/db/schema";
import { branches, type BranchCode } from "./case-options";
import {
  BRANCHES_PER_EMAIL,
  CODE_MINUTES,
  CODES_PER_HOUR,
  CODES_PER_VOTE,
  MAX_ATTEMPTS,
  MIN_BRANCH_WAITS,
  MIN_COUPLES,
  MIN_NATIONAL_WAITS,
  SINCE,
  VOTES_PER_IP_PER_DAY,
  satisfactionExperience,
  stageDays,
  surveyMonth,
  type ReportExperience,
  type Satisfaction,
  type SurveyStageAnswer,
} from "./branch-report-options";

// The branches page's numbers (/branches) and its survey
// (/branches/survey). Every source is a row in branchReport, one per
// report: imported ones count as they are, survey ones once their vote's
// emailed code is entered. The page reads them on every request, so a
// verified vote shows at once.

type StageWaits = Record<StageId, { days: number | null; waiting: boolean }>;

/** A row's stage columns ("firstAnswerDays", "firstAnswerWaiting"…), by stage. */
const stagesOf = (row: Record<string, unknown>): StageWaits =>
  Object.fromEntries(
    stageIds.map((id) => [id, { days: row[`${id}Days`] as number | null, waiting: row[`${id}Waiting`] as boolean }]),
  ) as StageWaits;

// ── The numbers ──────────────────────────────────────────────────────────────

const SCORE: Partial<Record<ReportExperience, number>> = { positive: 1, mixed: 0.5, negative: 0 };

const quantile = (sorted: number[], q: number) => {
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
};

function summary(days: number[]): WaitSummary {
  const sorted = [...days].sort((a, b) => a - b);
  return {
    n: sorted.length,
    median: Math.round(quantile(sorted, 0.5)),
    low: Math.round(quantile(sorted, 0.25)),
    high: Math.round(quantile(sorted, 0.75)),
  };
}

type Report = { coupleKey: string; branch: string | null; experience: ReportExperience | null; stages: StageWaits };

/** Each couple once: satisfied, neutral or unsatisfied from the average of their experiences (only neutral ones: neutral). */
function sentiment(reports: Report[]) {
  const byCouple = new Map<string, ReportExperience[]>();
  for (const r of reports) {
    if (!r.experience) continue;
    byCouple.set(r.coupleKey, [...(byCouple.get(r.coupleKey) ?? []), r.experience]);
  }
  const counts: Record<SentimentId, number> = { satisfied: 0, neutral: 0, unsatisfied: 0 };
  for (const experiences of byCouple.values()) {
    const scored = experiences.flatMap((e) => (SCORE[e] === undefined ? [] : [SCORE[e]!]));
    const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : 0.5;
    counts[avg > 0.5 ? "satisfied" : avg < 0.5 ? "unsatisfied" : "neutral"]++;
  }
  return { couples: byCouple.size, counts };
}

/**
 * A stage's finished waits, one per couple: their latest, as `reports` are
 * oldest first. One still running says only "at least this long", and the
 * couples still waiting post far more than those whose wait ended, so running
 * ones aren't counted.
 */
function waits(reports: Report[], stage: StageId) {
  const byCouple = new Map<string, number>();
  for (const { coupleKey, stages } of reports) {
    const w = stages[stage];
    if (w.days !== null && !w.waiting) byCouple.set(coupleKey, w.days);
  }
  return [...byCouple.values()];
}

/** The page's numbers, from every counted report since SINCE, leaving out what the war caused. */
export async function getBranchStats(): Promise<BranchesStats> {
  await connection();
  const rows = await db
    .select({
      source: branchReport.source,
      coupleKey: branchReport.coupleKey,
      branch: branchReport.branch,
      experience: branchReport.experience,
      experienceMonth: branchReport.experienceMonth,
      reportedAt: branchReport.reportedAt,
      firstAnswerDays: branchReport.firstAnswerDays,
      firstAnswerWaiting: branchReport.firstAnswerWaiting,
      entryPermitDays: branchReport.entryPermitDays,
      entryPermitWaiting: branchReport.entryPermitWaiting,
      b1VisaDays: branchReport.b1VisaDays,
      b1VisaWaiting: branchReport.b1VisaWaiting,
    })
    .from(branchReport)
    .leftJoin(surveyVote, eq(branchReport.voteId, surveyVote.id))
    .where(and(eq(branchReport.warRelated, false), or(isNull(branchReport.voteId), eq(surveyVote.status, "verified"))))
    .orderBy(branchReport.reportedAt);
  // A year on its own ("2025") compares as the year's start, so it passes SINCE like its months do.
  const recent = rows.filter((r) => (r.experienceMonth ?? r.reportedAt.toISOString()) >= SINCE);

  // Imported reports each count; an email's newest vote on a branch replaces its earlier ones there.
  const reports: Report[] = [];
  const votes = new Map<string, Report>();
  for (const row of recent) {
    const report = { coupleKey: row.coupleKey, branch: row.branch, experience: row.experience, stages: stagesOf(row) };
    if (row.source !== "survey") reports.push(report);
    else {
      // Moved to the end, so the votes stay oldest first for waits().
      votes.delete(`${row.coupleKey} ${row.branch}`);
      votes.set(`${row.coupleKey} ${row.branch}`, report);
    }
  }
  reports.push(...votes.values());

  const stages = stageIds
    .map((id) => ({ id, ...summary(waits(reports, id)) }))
    .filter((s) => s.n >= MIN_NATIONAL_WAITS);

  const stats: Record<string, BranchStats> = {};
  for (const code of branches) {
    const list = reports.filter((r) => r.branch === code);
    const { couples, counts } = sentiment(list);
    const own: BranchStats["waits"] = {};
    for (const s of stages) {
      const days = waits(list, s.id);
      if (days.length >= MIN_BRANCH_WAITS) own[s.id] = summary(days);
    }
    stats[code] = { couples, sentiment: couples >= MIN_COUPLES ? counts : null, waits: own };
  }

  const months = recent.map((r) => r.reportedAt.toISOString().slice(0, 7)).filter((m) => m >= SINCE);
  const thisMonth = todayInIsrael().slice(0, 7);
  return {
    posted: { from: months[0] ?? thisMonth, to: months.at(-1) ?? thisMonth },
    minCouples: MIN_COUPLES,
    couples: new Set(reports.filter((r) => r.branch).map((r) => r.coupleKey)).size,
    stages,
    branches: stats,
  };
}

// ── The survey ───────────────────────────────────────────────────────────────

function secret() {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET is not set");
  return value;
}

/** A code can't be looked up from its hash without the server's secret, though there are only a million. */
const hashCode = (voteId: string, code: string) => createHmac("sha256", secret()).update(`survey:${voteId}:${code}`).digest("base64url");
const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");
const expiry = () => new Date(Date.now() + CODE_MINUTES * 60_000);

/**
 * Codes sent to an address in the last hour, across its votes. A code expires
 * CODE_MINUTES after it's sent, so a vote whose code expires within that much
 * of an hour from now had one sent in the last hour; all of its codes are
 * counted, which errs toward the cap.
 */
async function codesSentRecently(email: string) {
  const since = new Date(Date.now() - 3_600_000 + CODE_MINUTES * 60_000);
  const [row] = await db
    .select({ sent: sql<number>`coalesce(sum(${surveyVote.codesSent}), 0)::int` })
    .from(surveyVote)
    .where(and(eq(surveyVote.email, email), gt(surveyVote.codeExpiresAt, since)));
  return row?.sent ?? 0;
}

/** An IP, keyed with the server's secret: comparable, but not the IP. */
const hashIp = (ip: string) => createHmac("sha256", secret()).update(`survey-ip:${ip}`).digest("base64url");

/** Votes sent from an IP in the last 24 hours, whatever became of them. */
async function votesFromIpToday(ipHash: string) {
  const [row] = await db
    .select({ votes: sql<number>`count(*)::int` })
    .from(surveyVote)
    .where(and(eq(surveyVote.ipHash, ipHash), gt(surveyVote.createdAt, sql`now() - interval '24 hours'`)));
  return row?.votes ?? 0;
}

/** The other branches an email has counted votes for. */
async function otherBranches(email: string, branch: string) {
  const [row] = await db
    .select({ branches: sql<number>`count(distinct ${surveyVote.branch})::int` })
    .from(surveyVote)
    .where(and(eq(surveyVote.email, email), eq(surveyVote.status, "verified"), ne(surveyVote.branch, branch)));
  return row?.branches ?? 0;
}

export type NewVote = {
  email: string;
  locale: Locale;
  branch: BranchCode;
  /** The month they filed online, YYYY-MM: every stage's wait starts from it. */
  filed: string;
  stages: SurveyStageAnswer[];
  satisfaction: Satisfaction;
  comment: string | null;
  /** The voter's IP, when the request has one; only its hash is kept. */
  ip: string | null;
};

export type NewVoteResult =
  | { ok: true; id: string; code: string }
  /** The address has had its codes for the hour, the IP its votes for the day, or the email its branches. */
  | { ok: false; error: "limit" | "daily" | "branches" };

/**
 * Saves a vote as pending, with its answers in one report row that counts
 * once it's verified, and returns its id and the code to email, unless one
 * of the caps stops it.
 */
export async function createSurveyVote(vote: NewVote): Promise<NewVoteResult> {
  const ipHash = vote.ip ? hashIp(vote.ip) : null;
  if (ipHash && (await votesFromIpToday(ipHash)) >= VOTES_PER_IP_PER_DAY) return { ok: false, error: "daily" };
  if ((await otherBranches(vote.email, vote.branch)) >= BRANCHES_PER_EMAIL) return { ok: false, error: "branches" };
  if ((await codesSentRecently(vote.email)) >= CODES_PER_HOUR) return { ok: false, error: "limit" };
  const id = randomBytes(12).toString("base64url");
  const code = newCode();
  const today = todayInIsrael();
  const answer = (stage: StageId) => vote.stages.find((s) => s.stage === stage);
  const days = (stage: StageId) => {
    const s = answer(stage);
    return s ? stageDays(s, vote.filed, today) : null;
  };
  const waiting = (stage: StageId) => answer(stage)?.step === null;

  await db.batch([
    db.insert(surveyVote).values({
      id,
      email: vote.email,
      locale: vote.locale,
      branch: vote.branch,
      comment: vote.comment,
      codeHash: hashCode(id, code),
      codeExpiresAt: expiry(),
      ipHash,
    }),
    db.insert(branchReport).values({
      id: randomBytes(12).toString("base64url"),
      source: "survey",
      coupleKey: `survey:${vote.email}`,
      branch: vote.branch,
      experience: satisfactionExperience[vote.satisfaction],
      experienceMonth: surveyMonth(vote.filed, vote.stages, today),
      reportedAt: new Date(),
      firstAnswerDays: days("firstAnswer"),
      firstAnswerWaiting: waiting("firstAnswer"),
      entryPermitDays: days("entryPermit"),
      entryPermitWaiting: waiting("entryPermit"),
      b1VisaDays: days("b1Visa"),
      b1VisaWaiting: waiting("b1Visa"),
      voteId: id,
    }),
  ]);
  return { ok: true, id, code };
}

export type VerifyResult = { ok: true } | { ok: false; error: "wrong" | "expired" | "attempts" | "missing" | "branches" };

/**
 * Checks a vote's code. Right, the vote counts, unless its email has meanwhile
 * had votes counted at BRANCHES_PER_EMAIL other branches. Each try takes one
 * of MAX_ATTEMPTS in the same statement that checks there's one left, so
 * tries sent all at once can't share a free one.
 */
export async function verifySurveyVote(id: string, code: string): Promise<VerifyResult> {
  const [vote] = await db
    .update(surveyVote)
    .set({ attempts: sql`${surveyVote.attempts} + 1` })
    .where(
      and(
        eq(surveyVote.id, id),
        eq(surveyVote.status, "pending"),
        lt(surveyVote.attempts, MAX_ATTEMPTS),
        gt(surveyVote.codeExpiresAt, new Date()),
      ),
    )
    .returning();
  if (!vote) {
    // No try taken: say why.
    const [current] = await db.select().from(surveyVote).where(eq(surveyVote.id, id)).limit(1);
    if (!current || current.status === "void") return { ok: false, error: "missing" };
    if (current.status === "verified") return { ok: true };
    if (current.attempts >= MAX_ATTEMPTS) return { ok: false, error: "attempts" };
    return { ok: false, error: "expired" };
  }

  const expected = Buffer.from(vote.codeHash ?? "");
  const actual = Buffer.from(hashCode(id, code.replace(/\D/g, "")));
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, error: vote.attempts >= MAX_ATTEMPTS ? "attempts" : "wrong" };
  }
  if ((await otherBranches(vote.email, vote.branch)) >= BRANCHES_PER_EMAIL) return { ok: false, error: "branches" };
  await db
    .update(surveyVote)
    .set({ status: "verified", verifiedAt: new Date(), codeHash: null })
    .where(and(eq(surveyVote.id, id), eq(surveyVote.status, "pending")));
  return { ok: true };
}

/**
 * A new code for a pending vote, within the address's hourly cap and the
 * vote's own. The vote's count goes up in the same statement that checks it,
 * so resends sent all at once can't pass it together.
 */
export async function resendSurveyCode(id: string) {
  const [current] = await db.select().from(surveyVote).where(eq(surveyVote.id, id)).limit(1);
  if (!current || current.status !== "pending" || current.attempts >= MAX_ATTEMPTS) return null;
  if ((await codesSentRecently(current.email)) >= CODES_PER_HOUR) return null;
  const code = newCode();
  const [vote] = await db
    .update(surveyVote)
    .set({ codeHash: hashCode(id, code), codeExpiresAt: expiry(), codesSent: sql`${surveyVote.codesSent} + 1` })
    .where(and(eq(surveyVote.id, id), eq(surveyVote.status, "pending"), lt(surveyVote.codesSent, CODES_PER_VOTE)))
    .returning({ email: surveyVote.email, locale: surveyVote.locale });
  return vote ? { email: vote.email, locale: vote.locale as Locale, code } : null;
}

// ── The admin panel ──────────────────────────────────────────────────────────

export type AdminSurveyVote = Awaited<ReturnType<typeof recentSurveyVotes>>[number];

/** The newest votes, each with its answers, for the admin panel. */
export async function recentSurveyVotes(limit = 200) {
  const rows = await db
    .select({ vote: surveyVote, report: branchReport })
    .from(surveyVote)
    .leftJoin(branchReport, eq(branchReport.voteId, surveyVote.id))
    .orderBy(desc(surveyVote.createdAt))
    .limit(limit);
  return rows.map(({ vote, report }) => ({
    ...vote,
    experience: report?.experience ?? null,
    stages: report ? stagesOf(report) : null,
  }));
}

/** A vote that shouldn't count (spam, a fake): it leaves the numbers, and can't be verified anymore. */
export async function voidSurveyVote(id: string) {
  await db.update(surveyVote).set({ status: "void", codeHash: null }).where(eq(surveyVote.id, id));
}

/** Verified votes per branch in the last 24 hours, for spotting a campaign. */
export async function votesLastDay() {
  return db
    .select({ branch: surveyVote.branch, votes: sql<number>`count(*)::int` })
    .from(surveyVote)
    .where(and(eq(surveyVote.status, "verified"), gt(surveyVote.verifiedAt, sql`now() - interval '24 hours'`)))
    .groupBy(surveyVote.branch);
}

/** How many reports each source has, counting survey votes once verified, for the admin panel. */
export async function reportsBySource() {
  return db
    .select({ source: branchReport.source, rows: sql<number>`count(*)::int`, couples: sql<number>`count(distinct ${branchReport.coupleKey})::int` })
    .from(branchReport)
    .leftJoin(surveyVote, eq(branchReport.voteId, surveyVote.id))
    .where(or(isNull(branchReport.voteId), eq(surveyVote.status, "verified")))
    .groupBy(branchReport.source);
}
