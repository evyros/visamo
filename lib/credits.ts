import "server-only";
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { PRODUCT_GRANTS, type ProductId } from "./products";
import { db } from "./db";
import { caseEvent, cases, chat, chatMessage, creditEntry, documentCheck, purchase, user } from "./db/schema";
import { recordEvent } from "./events";

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
 * gives back a spend that got nothing). `revoked` takes back what a purchase
 * granted, when it was refunded in Freemius. The rest grant credit.
 */
export type CreditReason = "free" | "purchase" | "support" | "spend" | "refund" | "revoked";

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

/**
 * Records a purchase with what it adds: 50 messages, and with Full file check
 * 300 checks (lib/products.ts), and what it unlocks on the case. One batch is
 * one transaction, and the purchase's Freemius license is unique, so a
 * purchase reported twice throws on the second time and grants nothing more.
 * For the purchase flow (lib/purchases.ts), and the admin panel's
 * (grantSupportPurchase): one given there has the admin's email and a note,
 * and its entries are support grants, with them.
 */
export async function grantPurchase(row: typeof purchase.$inferInsert & { userId: string }) {
  const { caseId, product, userId } = row;
  const grants = PRODUCT_GRANTS[product];
  const given = !!row.adminEmail;
  const reason: CreditReason = given ? "support" : "purchase";
  const details: EntryDetails = given
    ? { adminEmail: row.adminEmail!, note: row.note ?? undefined, refId: row.id }
    : { userId, refId: row.id };
  await db.batch([
    db.insert(purchase).values(row),
    db
      .update(cases)
      .set({ paid: true, ...(product === "fileCheck" && { fileCheck: true }) })
      .where(eq(cases.id, caseId)),
    ...grantQueries(caseId, "messages", grants.messages, reason, details),
    ...(grants.checks ? grantQueries(caseId, "checks", grants.checks, reason, details) : []),
    given
      ? recordEvent(caseId, null, { type: "purchase.given", data: { product } })
      : recordEvent(caseId, userId, { type: "purchase.made", data: { product } }),
  ]);
}

/**
 * A purchase given from the admin panel, as if the user had bought it: it
 * adds what the product grants and unlocks what it unlocks. There's no
 * Freemius license or payment; who gave it and why are kept on it.
 */
export async function grantSupportPurchase(
  caseId: string,
  userId: string,
  product: ProductId,
  adminEmail: string,
  note: string,
) {
  await grantPurchase({ id: crypto.randomUUID(), caseId, userId, product, adminEmail, note });
}

/**
 * Takes back what a purchase refunded in Freemius, or a chargeback lost,
 * granted (revoke). The purchase's product, or null when there was nothing to
 * take back.
 */
export async function revokePurchase(freemiusLicenseId: string, note: string) {
  const [row] = await db
    .select({ id: purchase.id, product: purchase.product })
    .from(purchase)
    .where(eq(purchase.freemiusLicenseId, freemiusLicenseId))
    .limit(1);
  return row ? revoke(row, { note }) : null;
}

/**
 * Takes back what one of the case's purchases granted, from the admin panel
 * (revoke): one bought, like after a chargeback Freemius didn't report, or
 * one given. It doesn't refund anything in Freemius.
 */
export async function revokeSupportPurchase(caseId: string, purchaseId: string, adminEmail: string, note: string) {
  const [row] = await db
    .select({ id: purchase.id, product: purchase.product })
    .from(purchase)
    .where(and(eq(purchase.caseId, caseId), eq(purchase.id, purchaseId)))
    .limit(1);
  return row ? revoke(row, { adminEmail, note }) : null;
}

/**
 * Takes back what a purchase granted, once: marks it refunded, and takes its
 * messages and checks out of the balances, but only what's left of them,
 * since what was used can't be taken back: a balance never goes below zero.
 * What the case has bought is then what its other purchases bought. It's one
 * statement, so it all happens or none of it, and a purchase already marked
 * refunded changes nothing: the webhook can be sent again. `note` says why,
 * on the entries, with the admin who did it. The purchase's product, or null
 * when there was nothing to take back.
 */
async function revoke(row: { id: string; product: ProductId }, details: { note: string; adminEmail?: string }) {
  const grants = PRODUCT_GRANTS[row.product];

  // Each part is a CTE of one statement: they all see the tables as they were
  // before it, so `kept` leaves out the refunded purchase by its id. `locked`
  // waits for, and then reads, the case as it is after any spend in progress.
  // A purchase given from the admin panel is cancelled, not refunded, in the
  // case's events.
  const { rows } = await db.execute<{ product: string }>(sql`
    with refunded as (
      update ${purchase} set refunded_at = now()
      where id = ${row.id} and refunded_at is null
      returning id, case_id, product, admin_email is not null as given
    ), locked as (
      select c.id, c.messages_left, c.checks_left
      from ${cases} c join refunded r on r.case_id = c.id
      for update of c
    ), taken as (
      select id as case_id,
        least(messages_left, ${grants.messages}) as messages,
        least(checks_left, ${grants.checks}) as checks
      from locked
    ), kept as (
      select coalesce(bool_or(true), false) as paid, coalesce(bool_or(p.product = 'fileCheck'), false) as file_check
      from ${purchase} p join refunded r on p.case_id = r.case_id
      where p.id <> r.id and p.refunded_at is null
    ), updated as (
      update ${cases} c set
        messages_left = c.messages_left - t.messages,
        checks_left = c.checks_left - t.checks,
        paid = k.paid,
        file_check = k.file_check,
        updated_at = now()
      from taken t, kept k
      where c.id = t.case_id
    ), entries as (
      insert into ${creditEntry} (id, case_id, kind, delta, reason, ref_id, admin_email, note)
      select gen_random_uuid()::text, t.case_id, e.kind, -e.amount, 'revoked', r.id, ${details.adminEmail ?? null}, ${details.note}
      from taken t
      cross join refunded r
      cross join lateral (values ('messages', t.messages), ('checks', t.checks)) as e(kind, amount)
      where e.amount > 0
    ), event as (
      insert into ${caseEvent} (id, case_id, type, data)
      select gen_random_uuid()::text, r.case_id,
        case when r.given then 'purchase.cancelled' else 'purchase.refunded' end,
        jsonb_build_object('product', r.product)
      from refunded r
    )
    select product from refunded`);
  return rows[0] ? row.product : null;
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
 * its chat. A message that got no answer was deleted, so it has no chat. A
 * purchase's grants, and taking them back, have its product.
 */
export async function creditEntries(caseId: string) {
  return db
    .select({
      entry: creditEntry,
      userName: user.name,
      documentKey: documentCheck.documentKey,
      chatId: chatMessage.chatId,
      chatTitle: chat.title,
      product: purchase.product,
    })
    .from(creditEntry)
    .leftJoin(user, eq(user.id, creditEntry.userId))
    .leftJoin(documentCheck, and(eq(creditEntry.kind, "checks"), eq(documentCheck.id, creditEntry.refId)))
    .leftJoin(chatMessage, and(eq(creditEntry.kind, "messages"), eq(chatMessage.id, creditEntry.refId)))
    .leftJoin(chat, eq(chat.id, chatMessage.chatId))
    .leftJoin(purchase, and(inArray(creditEntry.reason, ["purchase", "support", "revoked"]), eq(purchase.id, creditEntry.refId)))
    .where(eq(creditEntry.caseId, caseId))
    .orderBy(desc(creditEntry.createdAt), desc(creditEntry.id));
}

export type CreditEntryRow = Awaited<ReturnType<typeof creditEntries>>[number];
