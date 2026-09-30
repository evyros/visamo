import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNotNull, isNull, sql } from "drizzle-orm";
import { format, type Messages } from "@/i18n/messages";
import { db } from "./db";
import { supportAccess } from "./db/schema";
import { site } from "./site";
import type { AccessDuration, AccessReason } from "./support-access-options";

// Support-access consent. Before looking into a case for support, the admin
// sends a link (app.visamo.co.il/access/<token>) asking the couple's OK, for
// a time the admin picks. Either partner can open it and agree; agreeing uses
// the link up, and it expires after 72 hours anyway.
//
// This only records the consent: who agreed, to what, when and from where. Nothing checks it. The admin panel shows everything as always,
// and the app doesn't change.

const LINK_TTL_MS = 72 * 60 * 60 * 1000;

export type SupportAccess = typeof supportAccess.$inferSelect;

const hashToken = (token: string) => createHash("sha256").update(token).digest("base64url");

/**
 * A new request for the case, replacing a pending one. Returns the link: it
 * can't be shown again, since only the token's hash is kept.
 */
export async function createAccessRequest(input: {
  caseId: string;
  durationHours: AccessDuration;
  reason: AccessReason | null;
  adminEmail: string;
}) {
  const token = randomBytes(32).toString("base64url");
  await db.batch([
    db
      .update(supportAccess)
      .set({ cancelledAt: new Date() })
      .where(pendingIn(input.caseId)),
    db.insert(supportAccess).values({
      id: crypto.randomUUID(),
      ...input,
      tokenHash: hashToken(token),
      linkExpiresAt: new Date(Date.now() + LINK_TTL_MS),
    }),
  ]);
  return new URL(`/access/${token}`, site.appUrl).toString();
}

/** The case's requests nobody answered, cancelled or let expire: at most one. */
function pendingIn(caseId: string) {
  return and(
    eq(supportAccess.caseId, caseId),
    isNull(supportAccess.consentedAt),
    isNull(supportAccess.cancelledAt),
    gt(supportAccess.linkExpiresAt, sql`now()`),
  );
}

export async function cancelAccessRequest(caseId: string, id: string) {
  await db
    .update(supportAccess)
    .set({ cancelledAt: new Date() })
    .where(and(eq(supportAccess.id, id), pendingIn(caseId)));
}

/** The request a link's token opens, whatever its state, or null. */
export async function findAccessRequest(token: string) {
  const [row] = await db.select().from(supportAccess).where(eq(supportAccess.tokenHash, hashToken(token))).limit(1);
  return row ?? null;
}

/**
 * Records the consent, if the link still works and belongs to the user's
 * case. One conditional update, so two partners agreeing at once can't both
 * win. Returns the updated request, or null when it was too late.
 */
export async function recordConsent(input: {
  token: string;
  caseId: string;
  user: { id: string; name: string; email: string };
  locale: string;
  ip: string | null;
  userAgent: string | null;
}) {
  const [row] = await db
    .update(supportAccess)
    .set({
      consentedAt: sql`now()`,
      accessEndsAt: sql`now() + make_interval(hours => ${supportAccess.durationHours})`,
      consentedBy: input.user.id,
      consentedByName: input.user.name,
      consentedByEmail: input.user.email,
      consentLocale: input.locale,
      consentIp: input.ip,
      consentUserAgent: input.userAgent,
    })
    .where(and(eq(supportAccess.tokenHash, hashToken(input.token)), pendingIn(input.caseId)))
    .returning();
  return row ?? null;
}

/** Every request the case got, newest first, for the admin panel. */
export async function listAccessRequests(caseId: string) {
  return db
    .select()
    .from(supportAccess)
    .where(eq(supportAccess.caseId, caseId))
    .orderBy(desc(supportAccess.createdAt));
}

/** The consent whose time hasn't run out, if any: the one ending last. */
export async function currentConsent(caseId: string) {
  const [row] = await db
    .select({ accessEndsAt: supportAccess.accessEndsAt })
    .from(supportAccess)
    .where(
      and(
        eq(supportAccess.caseId, caseId),
        isNotNull(supportAccess.consentedAt),
        gt(supportAccess.accessEndsAt, sql`now()`),
      ),
    )
    .orderBy(desc(supportAccess.accessEndsAt))
    .limit(1);
  return row?.accessEndsAt ?? null;
}

export type AccessStatus = "pending" | "consented" | "cancelled" | "expired";

export function accessStatus(row: SupportAccess, now = new Date()): AccessStatus {
  if (row.consentedAt) return "consented";
  if (row.cancelledAt) return "cancelled";
  return row.linkExpiresAt > now ? "pending" : "expired";
}

/** The page's words for a request, in the reader's language. The duration is named, not dated: it starts when they agree. */
export function consentCopy(
  t: Messages["app"]["access"],
  request: { durationHours: number; reason: AccessReason | null },
) {
  const values = { duration: t.durations[String(request.durationHours) as keyof typeof t.durations] };
  return {
    title: t.title,
    intro: t.intro,
    reasonLabel: t.reasonLabel,
    reason: request.reason ? t.reasons[request.reason] : null,
    rows: [
      { icon: "eye", label: t.see.label, body: t.see.body },
      { icon: "clock", label: t.time.label, body: format(t.time.body, values) },
      { icon: "shield", label: t.stays.label, body: t.stays.body },
    ] as const,
    agree: format(t.agree, values),
  };
}
