// What Visamo sells. Every case is free to start; on top of that there are
// two one-time purchases: a message pack, bought as often as needed, and
// Full file check, bought once for the whole process. The numbers match the
// pricing page (pricing in the messages). They're granted into the case's
// balances (lib/credits.ts).

/** A one-time purchase. */
export type ProductId = "messagePack" | "fileCheck";

export const productIds: readonly ProductId[] = ["messagePack", "fileCheck"];

/** How a purchase was paid, from the Freemius payment's gateway. */
export type PaymentMethod = "card" | "paypal";

export function isProductId(value: unknown): value is ProductId {
  return productIds.includes(value as ProductId);
}

/**
 * What the person chose to buy on the pricing page (?buy= on the app's
 * links), kept through signup and onboarding (proxy.ts). The app opens the
 * buy page once they reach it.
 */
export const BUY_COOKIE = "buy";

/** The messages a new case is granted. */
export const FREE_MESSAGES = 5;

/** Messages each purchase adds: a message pack, and Full file check includes one. */
export const PACK_MESSAGES = 50;

/** Document checks Full file check grants: the fair-use amount. Support tops up from the admin panel. */
export const DOCUMENT_CHECKS = 300;

/** At 80% of the checks granted, the couple sees how many are left and is asked to contact support. */
export function checksRunningLow(totals: { granted: number; used: number }) {
  return totals.granted > 0 && totals.used >= totals.granted * 0.8;
}

/** What each purchase adds to the case's balances. */
export const PRODUCT_GRANTS: Record<ProductId, { messages: number; checks: number }> = {
  messagePack: { messages: PACK_MESSAGES, checks: 0 },
  fileCheck: { messages: PACK_MESSAGES, checks: DOCUMENT_CHECKS },
};

/** What a case has bought, from the flags on the case. */
export type Access = {
  /** Bought anything. */
  paid: boolean;
  /** Bought Full file check: the case can check documents. */
  fileCheck: boolean;
};

/** The longest chat message, in characters: longer once the case has bought anything. */
export function maxMessageLength(access: Pick<Access, "paid">) {
  return access.paid ? 600 : 300;
}
