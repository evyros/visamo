import "server-only";
import { send } from "@vercel/queue";
import { eq, and, isNull, sql } from "drizzle-orm";
import { defaultLocale, isLocale } from "@/i18n/config";
import { db } from "./db";
import { caseMember, casePerson, cases, user } from "./db/schema";
import { sendWelcomeEmail } from "./email";
import { FREE_MESSAGES } from "./products";

// Evy's welcome email: every new user gets it about 5 minutes after signing
// up, paid or not, partners who joined by invite too. Signing up queues it
// (lib/auth.ts, the user create hook), with the delay, on Vercel Queues; the
// queue then calls app/api/queues/welcome-email, which sends it. Only signups
// queue it, so users from before it never get one.
//
// The queue may deliver a message more than once, so sending first marks the
// user (user.welcome_email_at): a second delivery finds them marked and sends
// nothing. A failed send clears the mark, and the queue retries. The send
// carries an idempotency key, so if a "failed" send actually went through
// (Resend's reply was lost), the retry doesn't send it again.
//
// Off Vercel (local development) there's no queue: it's sent right away, and
// without RESEND_API_KEY it's printed to the terminal.

export const WELCOME_EMAIL_TOPIC = "welcome-email";

/** How long after signing up the email goes out. */
const DELAY_SECONDS = 5 * 60;

export type WelcomeEmailMessage = { userId: string };

/**
 * Queues the welcome email for a user who just signed up. Never throws: a
 * failure is logged and the signup carries on, without the email.
 */
export async function queueWelcomeEmail(userId: string) {
  try {
    if (!process.env.VERCEL) {
      await deliverWelcomeEmail(userId);
      return;
    }
    const message: WelcomeEmailMessage = { userId };
    await send(WELCOME_EMAIL_TOPIC, message, {
      delaySeconds: DELAY_SECONDS,
      // A signup queued twice is delivered once.
      idempotencyKey: `welcome-email/${userId}`,
    });
  } catch (error) {
    console.error("queueWelcomeEmail failed", userId, error);
  }
}

/** Sends the welcome email, unless it was sent already or the user is gone. Throws when sending fails, after clearing the mark. */
export async function deliverWelcomeEmail(userId: string) {
  // Marking it sent is the claim: only the delivery that marks it sends.
  // updated_at stays as it was: this isn't a change the user made.
  const [claimed] = await db
    .update(user)
    .set({ welcomeEmailAt: new Date(), updatedAt: sql`${user.updatedAt}` })
    .where(and(eq(user.id, userId), isNull(user.welcomeEmailAt)))
    .returning({ email: user.email, name: user.name, locale: user.locale });
  if (!claimed) return;

  try {
    const [file] = await db
      .select({
        paid: cases.paid,
        checksLeft: cases.checksLeft,
        freeFullKey: cases.freeFullKey,
        messagesLeft: cases.messagesLeft,
        personName: casePerson.name,
      })
      .from(caseMember)
      .innerJoin(cases, eq(cases.id, caseMember.caseId))
      .leftJoin(casePerson, eq(casePerson.userId, caseMember.userId))
      .where(eq(caseMember.userId, userId));

    await sendWelcomeEmail({
      to: claimed.email,
      locale: isLocale(claimed.locale) ? claimed.locale : defaultLocale,
      name: firstName(claimed.name) ?? firstName(file?.personName),
      freeMessages: file ? freeMessagesLeft(file) : FREE_MESSAGES,
      idempotencyKey: `welcome-email/${userId}`,
    });
  } catch (error) {
    await db.update(user).set({ welcomeEmailAt: null, updatedAt: sql`${user.updatedAt}` }).where(eq(user.id, userId));
    throw error;
  }
}

/**
 * The messages count for the free reminder, or null to leave it out: a case
 * that bought anything, or has used its free check (or got a result in full
 * from the admin's, lib/checks/free.ts). With no case yet (still in
 * onboarding), the reminder shows what the case will start with.
 */
export function freeMessagesLeft(file: {
  paid: boolean;
  checksLeft: number;
  freeFullKey: string | null;
  messagesLeft: number;
}) {
  if (file.paid || file.checksLeft < 1 || file.freeFullKey !== null) return null;
  // "1 free document check and 1 chat messages" doesn't read; with 1 or 0
  // messages left, the reminder isn't worth it either.
  return file.messagesLeft >= 2 ? file.messagesLeft : null;
}

/**
 * The first word of a name, for the greeting, or null when there's no usable
 * name: blank (some Google accounts have none), or an email address.
 */
export function firstName(name: string | null | undefined) {
  const first = name?.trim().split(/\s+/)[0];
  return first && !first.includes("@") ? first : null;
}
