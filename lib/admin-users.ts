import "server-only";
import { cache } from "react";
import { and, count, desc, eq, ilike, inArray, ne, sql, type AnyColumn, type SQL } from "drizzle-orm";
import { creditTotals } from "./credits";
import { db } from "./db";
import { caseMember, cases, chat, chatMessage, documentCheck, user } from "./db/schema";

// Users as the admin panel lists them. Balances belong to the case (both
// partners share them), so a user without a case, still in onboarding, has
// none. What was granted and used comes from the case's ledger (lib/credits.ts).

export const USERS_PAGE_SIZE = 50;

/** `value` as an ilike pattern that matches it anywhere, with its own % and _ taken literally. */
const contains = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;

const columns = {
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  role: caseMember.role,
  caseId: cases.id,
  plan: cases.plan,
  messagesLeft: cases.messagesLeft,
  checksLeft: cases.checksLeft,
};

/** What a case's model calls cost, in USD: its checks (failed ones too, they cost as much) and its chat answers. */
export type CaseCost = {
  usd: number;
  /** Runs or answers whose cost OpenRouter didn't report: the sum leaves them out. */
  unknown: number;
};

/** Each case's model cost. Chats a partner deleted still count: their answers were paid for. */
export async function caseCosts(caseIds: string[]) {
  const costs = new Map(caseIds.map((id): [string, CaseCost] => [id, { usd: 0, unknown: 0 }]));
  if (!caseIds.length) return costs;
  const usd = (column: AnyColumn) => sql<number>`coalesce(sum(${column}), 0)`.mapWith(Number);
  const unknown = (column: AnyColumn) =>
    sql<number>`count(*) filter (where ${column} is null)`.mapWith(Number);
  const [checks, answers] = await Promise.all([
    db
      .select({ caseId: documentCheck.caseId, usd: usd(documentCheck.costUsd), unknown: unknown(documentCheck.costUsd) })
      .from(documentCheck)
      // A running check hasn't cost anything yet.
      .where(and(inArray(documentCheck.caseId, caseIds), ne(documentCheck.state, "running")))
      .groupBy(documentCheck.caseId),
    db
      .select({ caseId: chat.caseId, usd: usd(chatMessage.costUsd), unknown: unknown(chatMessage.costUsd) })
      .from(chatMessage)
      .innerJoin(chat, eq(chat.id, chatMessage.chatId))
      .where(and(inArray(chat.caseId, caseIds), eq(chatMessage.role, "assistant")))
      .groupBy(chat.caseId),
  ]);
  for (const row of [...checks, ...answers]) {
    const cost = costs.get(row.caseId)!;
    cost.usd += row.usd;
    cost.unknown += row.unknown;
  }
  return costs;
}

/** The rows with their case's granted and used totals and its model cost; null without a case. */
async function withTotals<T extends { caseId: string | null }>(rows: T[]) {
  const caseIds = [...new Set(rows.flatMap((r) => (r.caseId ? [r.caseId] : [])))];
  const [totals, costs] = await Promise.all([creditTotals(caseIds), caseCosts(caseIds)]);
  return rows.map((row) => ({
    ...row,
    totals: row.caseId ? totals.get(row.caseId)! : null,
    cost: row.caseId ? costs.get(row.caseId)! : null,
  }));
}

/** A page of users, newest first, whose name and email contain the filters (case-insensitive). */
export async function listUsers(filters: { name?: string; email?: string }, page: number) {
  const conditions: SQL[] = [];
  if (filters.name) conditions.push(ilike(user.name, contains(filters.name)));
  if (filters.email) conditions.push(ilike(user.email, contains(filters.email)));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, [total]] = await Promise.all([
    db
      .select(columns)
      .from(user)
      .leftJoin(caseMember, eq(caseMember.userId, user.id))
      .leftJoin(cases, eq(cases.id, caseMember.caseId))
      .where(where)
      .orderBy(desc(user.createdAt), user.id)
      .limit(USERS_PAGE_SIZE)
      .offset((page - 1) * USERS_PAGE_SIZE),
    db.select({ value: count() }).from(user).where(where),
  ]);
  return { rows: await withTotals(rows), total: total?.value ?? 0 };
}

export type AdminUserRow = Awaited<ReturnType<typeof listUsers>>["rows"][number];

/** One user with their case's quotas, or null when there's no such user. One query per request. */
export const findUser = cache(async (id: string) => {
  const [row] = await db
    .select(columns)
    .from(user)
    .leftJoin(caseMember, eq(caseMember.userId, user.id))
    .leftJoin(cases, eq(cases.id, caseMember.caseId))
    .where(eq(user.id, id))
    .limit(1);
  return row ? (await withTotals([row]))[0] : null;
});

/** The users who can open a case: the couple, as far as they've signed up. */
export async function caseMembers(caseId: string) {
  return db
    .select({ id: user.id, name: user.name, email: user.email, role: caseMember.role })
    .from(caseMember)
    .innerJoin(user, eq(user.id, caseMember.userId))
    .where(eq(caseMember.caseId, caseId))
    .orderBy(caseMember.createdAt);
}
