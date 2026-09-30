import type { TierId } from "@/lib/site";

// What each pricing tier gives. The numbers match the pricing page
// (pricing.tiers in the messages): 5 free messages, 50 more with each
// purchase of Assistant or File Preparation, and 300 document checks with
// File Preparation. They're granted into the case's balances (lib/credits.ts).

/** The highest tier a case has bought; "free" until then. */
export type Plan = TierId;

/** The messages a new case is granted. */
export const FREE_MESSAGES = 5;

/** Messages each purchase of Assistant or File Preparation adds. */
export const PAID_MESSAGES = 50;

/** The longest message a plan can send, in characters. */
export function maxMessageLength(plan: Plan) {
  return plan === "free" ? 300 : 600;
}

/** Document checks a File Preparation purchase grants: the fair-use amount. Support tops up from the admin panel. */
export const DOCUMENT_CHECKS = 300;

/** What a purchase of a tier adds to the case's balances. */
export const PURCHASE_GRANTS: Record<Exclude<Plan, "free">, { messages: number; checks: number }> = {
  assistant: { messages: PAID_MESSAGES, checks: 0 },
  filePrep: { messages: PAID_MESSAGES, checks: DOCUMENT_CHECKS },
};

/** Whether the plan includes document checks: File Preparation only. */
export function canCheckDocuments(plan: Plan) {
  return plan === "filePrep";
}
