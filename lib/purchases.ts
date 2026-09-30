import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { grantPurchase, revokePurchase } from "./credits";
import { db } from "./db";
import { caseMember, casePerson, purchase, user } from "./db/schema";
import { freemius, productOfPlan } from "./freemius";
import type { PaymentMethod, ProductId } from "./products";

// Purchases from Freemius Checkout, granted to the buyer's case. Freemius
// reports each one twice: the checkout sends the browser to the success page
// (app/(app)/(main)/buy/success), which records it so it shows at once, and
// the license.created webhook (app/api/freemius/webhook) records it when the
// browser didn't, like a tab closed straight after paying. Both only pass on
// the license id: the purchase itself is read from the Freemius API, never
// taken from the request. Its payment too: a one-off purchase has no
// subscription, which is where the SDK's purchase info takes the amount from.
// A full refund, or a chargeback lost, takes back what it granted
// (refundPurchase).

type Buyer = { id: string; email: string; caseId: string };

/** The user with this email, and their case. The checkout's email is the user's, and they can't change it there. */
async function findBuyer(email: string): Promise<Buyer | null> {
  const [row] = await db
    .select({ id: user.id, email: user.email, caseId: caseMember.caseId })
    .from(user)
    .innerJoin(caseMember, eq(caseMember.userId, user.id))
    .where(eq(sql`lower(${user.email})`, email.toLowerCase()))
    .limit(1);
  return row ?? null;
}

/** A unique index refused the insert: here, the purchase was already recorded. */
function isDuplicate(error: unknown): boolean {
  for (let e = error; e; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === "23505") return true;
  }
  return false;
}

/** A payment in the currency the buyer paid in; the amounts come as strings. */
type Presentment = { gross: string; vat: string; currency: string };

/** The license's payment in Freemius, or null when it isn't there (yet). */
async function paymentOfLicense(freemiusUserId: string, licenseId: string) {
  const payments = await freemius().api.user.retrievePayments(freemiusUserId);
  const listed = payments.find((p) => String(p.license_id) === licenseId && (p.type ?? "payment") === "payment");
  // Freemius settles in dollars: gross and currency are in USD. What the buyer
  // paid, in shekels, is its presentment, which only the payment on its own
  // has, and the SDK's types leave out.
  const payment = listed?.id ? await freemius().api.payment.retrieve(listed.id) : null;
  if (!payment?.id) return null;
  const paid = (payment as { presentment?: Presentment }).presentment ?? payment;
  const vat = Number(paid.vat ?? 0);
  const method: PaymentMethod | null = !payment.gateway ? null : payment.gateway === "paypal" ? "paypal" : "card";
  return {
    freemiusPaymentId: String(payment.id),
    // Freemius's gross is before VAT.
    amount: Number(paid.gross ?? 0) + vat,
    vat,
    currency: paid.currency ?? null,
    paymentMethod: method,
  };
}

/**
 * Records the purchase of this Freemius license and grants it to the buyer's
 * case, once. With `buyer`, the signed-in user from the checkout, it must be
 * theirs; without, the buyer is found by the purchase's email. The product
 * it was, or null when it isn't a purchase of ours or its buyer isn't found.
 */
export async function recordPurchase(licenseId: string, buyer?: Buyer): Promise<ProductId | null> {
  const info = await freemius().purchase.retrievePurchase(licenseId);
  const product = info && productOfPlan(info.planId);
  if (!info || !product) return null;

  const owner = buyer ?? (await findBuyer(info.email));
  if (!owner || owner.email.toLowerCase() !== info.email.toLowerCase()) {
    console.error("recordPurchase: no buyer for the license", { licenseId, email: info.email });
    return null;
  }

  const payment = await paymentOfLicense(info.userId, info.licenseId);
  if (!payment) console.error("recordPurchase: no payment for the license", { licenseId });

  try {
    await grantPurchase({
      id: crypto.randomUUID(),
      caseId: owner.caseId,
      userId: owner.id,
      product,
      freemiusLicenseId: info.licenseId,
      freemiusUserId: info.userId,
      ...payment,
    });
  } catch (error) {
    if (!isDuplicate(error)) throw error;
  }
  return product;
}

/** The case's purchases, newest first, with the name in the case of the partner who bought each. */
export async function casePurchases(caseId: string) {
  return db
    .select({
      id: purchase.id,
      product: purchase.product,
      amount: purchase.amount,
      vat: purchase.vat,
      currency: purchase.currency,
      paymentMethod: purchase.paymentMethod,
      hasInvoice: sql<boolean>`${purchase.freemiusPaymentId} is not null`,
      createdAt: purchase.createdAt,
      refundedAt: purchase.refundedAt,
      buyerId: purchase.userId,
      buyerName: casePerson.name,
    })
    .from(purchase)
    .leftJoin(casePerson, eq(casePerson.userId, purchase.userId))
    .where(eq(purchase.caseId, caseId))
    .orderBy(desc(purchase.createdAt));
}

/** What the case bought with this Freemius license, if it's recorded. */
export async function purchaseOfLicense(caseId: string, licenseId: string) {
  const [row] = await db
    .select({ product: purchase.product })
    .from(purchase)
    .where(and(eq(purchase.caseId, caseId), eq(purchase.freemiusLicenseId, licenseId)))
    .limit(1);
  return row?.product ?? null;
}

/** The invoice PDF of the case's purchase, from Freemius, or null when there's none. */
export async function invoiceOfPurchase(caseId: string, purchaseId: string) {
  const [row] = await db
    .select({ freemiusUserId: purchase.freemiusUserId, freemiusPaymentId: purchase.freemiusPaymentId })
    .from(purchase)
    .where(and(eq(purchase.caseId, caseId), eq(purchase.id, purchaseId)))
    .limit(1);
  if (!row?.freemiusPaymentId) return null;
  return freemius().api.user.retrieveInvoice(row.freemiusUserId, row.freemiusPaymentId);
}

/** A Freemius payment, as the payment webhooks carry it: a refund is a payment of its own, bound to the one it refunds. */
export type WebhookPayment = { license_id?: string | number; gross?: number; bound_payment_id?: string | number };

/**
 * A refund, or a chargeback lost, from the webhook: takes back what the
 * purchase granted and wasn't used yet (revokePurchase in lib/credits.ts).
 * Only in full: a partial refund, like a goodwill one, is left to support.
 * The product taken back, or null when there was none to take back.
 */
export async function refundPurchase(payment: WebhookPayment, kind: "refund" | "chargeback") {
  const licenseId = payment.license_id ? String(payment.license_id) : null;
  if (!licenseId) {
    console.error("refundPurchase: no license on the payment", payment);
    return null;
  }
  if (kind === "refund" && (await isPartial(payment))) {
    console.warn("refundPurchase: a partial refund, left to support", { licenseId, gross: payment.gross });
    return null;
  }
  return revokePurchase(licenseId, kind === "refund" ? "Refunded in Freemius" : "Chargeback lost in Freemius");
}

/** Whether a refund returned less than the payment it refunds. Both amounts are before VAT. */
async function isPartial(refund: WebhookPayment) {
  if (!refund.bound_payment_id || refund.gross === undefined) return false;
  const original = await freemius().api.payment.retrieve(String(refund.bound_payment_id));
  if (original?.gross === undefined) return false;
  return Math.abs(refund.gross) < Math.abs(original.gross) - 0.01;
}
