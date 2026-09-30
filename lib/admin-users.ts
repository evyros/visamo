import "server-only";
import { cache } from "react";
import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "./db";
import { caseMember, cases, user } from "./db/schema";

// Users as the admin panel lists them. Quotas belong to the case (both
// partners share them), so a user without a case, still in onboarding, has none.

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
  checksUsed: cases.documentChecks,
  checksAllowed: cases.documentChecksAllowed,
};

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
  return { rows, total: total?.value ?? 0 };
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
  return row ?? null;
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
