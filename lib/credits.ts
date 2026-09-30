import "server-only";
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { PURCHASE_GRANTS, type Plan } from "./chat/plans";
import { db } from "./db";
import { cases, chat, chatMessage, creditEntry, documentCheck, user } from "./db/schema";

// A case's balances: chat messages and document checks, shared by both
// partners. The balance on the case is what spending checks against; every
// change to it is also a credit_entry row, written together with it, so the
// balance is always the sum of the case's entries. The entries are the audit
// trail, and what "granted" and "used" are counted from.
//
// Nothing else writes the balance columns.

export const creditKinds = ["messages", "checks"] as const;
export type CreditKind = (typeof creditKinds)[number];

/**
 * Why a balance changed. `spend` and `refund` are it being used (a refund
 * gives back a spend that got nothing); the rest grant credit.
 */
export type CreditReason = "free" | "purchase" | "support" | "spend" | "refund";

/** The balance column's name, for the one statement drizzle can't build (spend). Never user input. */
const columnName = { messages: "messages_left", checks: "checks_left" } as const;

/**
 * Spends one, when there's one left: the balance and its entry change in one
 * statement, so two tabs can't both spend the last one, and a refused spend
 * leaves no entry. The balance left, or null when there was none.
 */
export async function spend(caseId: string, kind: CreditKind, userId: string, refId: string) {
  return spendWith(caseId, kind, userId, refId, []);
}

/**
 * Spends a message and saves the user's message it pays for, and the chat
 * when it's a new one, in the same statement: the balance, its entry, the
 * chat and the message are all written, or none of them are. The balance
 * left, or null when there was none.
 */
export async function spendOnMessage(
  caseId: string,
  userId: string,
  message: { id: string; chatId: string; newChat: boolean; content: string },
) {
  return spendWith(caseId, "messages", userId, message.id, [
    ...(message.newChat
      ? [sql`insert into ${chat} (id, case_id, created_by) select ${message.chatId}, ${caseId}, ${userId} from spent`]
      : []),
    sql`insert into ${chatMessage} (id, chat_id, role, user_id, content)
      select ${message.id}, ${message.chatId}, 'user', ${userId}, ${message.content} from spent`,
  ]);
}

/**
 * The spend statement, with `writes`: more inserts that select from `spent`,
 * so they happen only when the spend did. A data-modifying WITH runs whether
 * or not the final select reads it, and one statement is one transaction.
 */
async function spendWith(caseId: string, kind: CreditKind, userId: string, refId: string, writes: SQL[]) {
  const left = sql.raw(`"${columnName[kind]}"`);
  const more = writes.map((write, i) => sql`, ${sql.raw(`write${i}`)} as (${write})`);
  const { rows } = await db.execute<{ balance: number }>(sql`
    with spent as (
      update ${cases} set ${left} = ${left} - 1
      where ${cases.id} = ${caseId} and ${left} > 0
      returning ${left} as balance
    ), entry as (
      insert into ${creditEntry} (id, case_id, kind, delta, reason, ref_id, user_id)
      select ${crypto.randomUUID()}, ${caseId}, ${kind}, -1, 'spend', ${refId}, ${userId} from spent
    )${sql.join(more)}
    select balance from spent`);
  return rows[0] ? Number(rows[0].balance) : null;
}

/** Gives back a spend that got nothing: a failed answer, a failed check, files the checker couldn't read. */
export async function refund(caseId: string, kind: CreditKind, userId: string, refId: string) {
  await db.batch(refundQueries(caseId, kind, userId, refId));
}

/** A refund's two writes, for a caller's own db.batch (like undoing a chat message). */
export function refundQueries(caseId: string, kind: CreditKind, userId: string, refId: string) {
  return grantQueries(caseId, kind, 1, "refund", { userId, refId });
}

type EntryDetails = { userId?: string | null; adminEmail?: string; note?: string; refId?: string };

/** The two writes that add `amount` to a balance, for a caller's own db.batch (like creating a case). */
export function grantQueries(caseId: string, kind: CreditKind, amount: number, reason: CreditReason, details: EntryDetails = {}) {
  return [
    db
      .update(cases)
      .set(
        kind === "messages"
          ? { messagesLeft: sql`${cases.messagesLeft} + ${amount}` }
          : { checksLeft: sql`${cases.checksLeft} + ${amount}` },
      )
      .where(eq(cases.id, caseId)),
    db.insert(creditEntry).values({ id: crypto.randomUUID(), caseId, kind, delta: amount, reason, ...details }),
  ] as const;
}

/** What a purchase adds: 50 messages, and with File Preparation 300 checks (lib/chat/plans.ts). For the purchase flow. */
export async function grantPurchase(caseId: string, plan: Exclude<Plan, "free">, userId: string, purchaseId: string) {
  const grants = PURCHASE_GRANTS[plan];
  const details = { userId, refId: purchaseId };
  await db.batch([
    ...grantQueries(caseId, "messages", grants.messages, "purchase", details),
    ...(grants.checks ? grantQueries(caseId, "checks", grants.checks, "purchase", details) : []),
  ]);
}

/** A support top-up from the admin panel, with who gave it and why. */
export async function grantSupport(caseId: string, kind: CreditKind, amount: number, adminEmail: string, note: string) {
  await db.batch(grantQueries(caseId, kind, amount, "support", { adminEmail, note }));
}

export type CreditTotals = { granted: number; used: number };

const noTotals = (): Record<CreditKind, CreditTotals> => ({
  messages: { granted: 0, used: 0 },
  checks: { granted: 0, used: 0 },
});

/** How much each case was granted and has used, of each kind, from its entries. */
export async function creditTotals(caseIds: string[]) {
  const totals = new Map(caseIds.map((id) => [id, noTotals()]));
  if (!caseIds.length) return totals;
  const usage = sql`${creditEntry.reason} in ('spend', 'refund')`;
  const rows = await db
    .select({
      caseId: creditEntry.caseId,
      kind: creditEntry.kind,
      granted: sql<number>`coalesce(sum(${creditEntry.delta}) filter (where not ${usage}), 0)`.mapWith(Number),
      used: sql<number>`coalesce(-sum(${creditEntry.delta}) filter (where ${usage}), 0)`.mapWith(Number),
    })
    .from(creditEntry)
    .where(inArray(creditEntry.caseId, caseIds))
    .groupBy(creditEntry.caseId, creditEntry.kind);
  for (const row of rows) totals.get(row.caseId)![row.kind] = { granted: row.granted, used: row.used };
  return totals;
}

/** One case's totals. */
export async function caseCreditTotals(caseId: string) {
  return (await creditTotals([caseId])).get(caseId)!;
}

/**
 * A case's entries, newest first, with the partner's name, and what a spend
 * or refund was for: the check run and its document, or the chat message and
 * its chat. A message that got no answer was deleted, so it has no chat.
 */
export async function creditEntries(caseId: string) {
  return db
    .select({
      entry: creditEntry,
      userName: user.name,
      documentKey: documentCheck.documentKey,
      chatId: chatMessage.chatId,
      chatTitle: chat.title,
    })
    .from(creditEntry)
    .leftJoin(user, eq(user.id, creditEntry.userId))
    .leftJoin(documentCheck, and(eq(creditEntry.kind, "checks"), eq(documentCheck.id, creditEntry.refId)))
    .leftJoin(chatMessage, and(eq(creditEntry.kind, "messages"), eq(chatMessage.id, creditEntry.refId)))
    .leftJoin(chat, eq(chat.id, chatMessage.chatId))
    .where(eq(creditEntry.caseId, caseId))
    .orderBy(desc(creditEntry.createdAt), desc(creditEntry.id));
}

export type CreditEntryRow = Awaited<ReturnType<typeof creditEntries>>[number];
