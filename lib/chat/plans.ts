import type { TierId } from "@/lib/site";

// What each pricing tier gives the chat. The numbers match the pricing page
// (pricing.tiers in the messages): 5 free messages, and 30 more with each
// purchase of Assistant or File Preparation.

/** The highest tier a case has bought; "free" until then. */
export type Plan = TierId;

/** The balance a new case starts with. */
export const FREE_MESSAGES = 5;

/** Messages each purchase of Assistant or File Preparation adds. */
export const PAID_MESSAGES = 30;

/** The longest message a plan can send, in characters. */
export function maxMessageLength(plan: Plan) {
  return plan === "free" ? 300 : 600;
}
