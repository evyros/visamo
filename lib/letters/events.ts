import "server-only";
import { randomUUID } from "node:crypto";
import { count, desc, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { letterEvent, letterRequest } from "@/lib/db/schema";
import { visitorPattern, type LetterVia } from "./tracking";

// The recommendation letters' event log (letter_event), for the admin
// panel's stats: the invites the couple had us email, and for each friend,
// whether they opened the link (from an invite email or not), downloaded the
// letter and sent it. It keeps who and when, never the letter, the ID card
// or the signature.

/** The writer's details, as they typed them. */
export type Writer = { name: string; idNumber: string; phone: string };

/** Every kind of event, with the details it keeps. A type's data never changes shape once written. */
export type LetterEvent =
  /** An invite the couple had us email, and to whom. */
  | { type: "invite.sent"; data: { email: string } }
  | { type: "page.opened"; data: Record<string, never> }
  | { type: "letter.downloaded"; data: Writer }
  | { type: "letter.sent"; data: Writer };

/** The friend's browser and how they got the link, as their page reports them. */
export type Visit = { visitor: string; via: LetterVia };

/** The visit from what the page posted, or null when it's missing or malformed (the event is then kept without it). */
export function visitFrom(visitor: unknown, via: unknown): Visit | null {
  if (typeof visitor !== "string" || !visitorPattern.test(visitor)) return null;
  return { visitor, via: via === "email" ? "email" : "link" };
}

/**
 * Records an event. Opening the page counts once per friend, so a refresh
 * doesn't count twice. Never throws: stats mustn't stop a letter.
 */
export async function recordLetterEvent(requestId: string, event: LetterEvent, visit: Visit | null = null) {
  try {
    await db
      .insert(letterEvent)
      .values({
        id: randomUUID(),
        requestId,
        type: event.type,
        data: event.data,
        visitor: visit?.visitor ?? null,
        via: visit?.via ?? null,
        key: event.type === "page.opened" && visit ? `${event.type}:${visit.visitor}` : null,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("recordLetterEvent:", event.type, error instanceof Error ? error.message : error);
  }
}

// ── The admin panel's stats ──────────────────────────────────────────────────

export const funnelStages = ["opened", "downloaded", "sent"] as const;
export type FunnelStage = (typeof funnelStages)[number];

export type LetterFunnel = {
  requests: { total: number; app: number };
  invites: number;
  /** Friends (by visitor) who opened the link, downloaded and sent, by how they got the link. */
  friends: Record<FunnelStage, Record<LetterVia, number>>;
  downloaded: number;
  sent: number;
};

const stageOf: Partial<Record<LetterEvent["type"], FunnelStage>> = {
  "page.opened": "opened",
  "letter.downloaded": "downloaded",
  "letter.sent": "sent",
};

/** Totals across every request. */
export async function letterFunnel(): Promise<LetterFunnel> {
  const [requests, rows] = await Promise.all([
    db
      .select({ total: count(), app: sql<number>`count(*) filter (where ${letterRequest.source} = 'app')`.mapWith(Number) })
      .from(letterRequest),
    db
      .select({
        type: letterEvent.type,
        via: letterEvent.via,
        events: count(),
        visitors: sql<number>`count(distinct ${letterEvent.visitor})`.mapWith(Number),
      })
      .from(letterEvent)
      .groupBy(letterEvent.type, letterEvent.via),
  ]);

  const friends = Object.fromEntries(funnelStages.map((key) => [key, { email: 0, link: 0 }])) as LetterFunnel["friends"];
  const total = (type: LetterEvent["type"]) => rows.filter((r) => r.type === type).reduce((n, r) => n + r.events, 0);
  for (const row of rows) {
    const stage = stageOf[row.type];
    if (stage) friends[stage][row.via ?? "link"] += row.visitors;
  }
  return {
    requests: requests[0] ?? { total: 0, app: 0 },
    invites: total("invite.sent"),
    friends,
    downloaded: total("letter.downloaded"),
    sent: total("letter.sent"),
  };
}

export type AdminLetterRequest = typeof letterRequest.$inferSelect & {
  events: (typeof letterEvent.$inferSelect)[];
};

/** The newest requests, each with its events, oldest first. */
export async function recentLetterRequests(limit = 100): Promise<AdminLetterRequest[]> {
  const requests = await db.select().from(letterRequest).orderBy(desc(letterRequest.createdAt)).limit(limit);
  if (requests.length === 0) return [];
  const events = await db
    .select()
    .from(letterEvent)
    .where(
      inArray(
        letterEvent.requestId,
        requests.map((r) => r.id),
      ),
    )
    .orderBy(letterEvent.createdAt);
  return requests.map((r) => ({ ...r, events: events.filter((e) => e.requestId === r.id) }));
}
