import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { grantPurchase } from "./credits";
import { db } from "./db";
import { caseMember, casePerson, purchase, user } from "./db/schema";
import { freemius, productOfPlan } from "./freemius";
import type { ProductId } from "./products";

// Purchases from Freemius Checkout, granted to the buyer's case. Freemius
// reports each one twice: the checkout sends the browser to the success page
// (app/(app)/(main)/buy/success), which records it so it shows at once, and
// the license.created webhook (app/api/freemius/webhook) records it when the
// browser didn't, like a tab closed straight after paying. Both only pass on
// the license id: the purchase itself is read from the Freemius API, never
// taken from the request.

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

  try {
    await grantPurchase({
      id: crypto.randomUUID(),
      caseId: owner.caseId,
      userId: owner.id,
      product,
      freemiusLicenseId: info.licenseId,
      freemiusUserId: info.userId,
      amount: info.initialAmount,
      currency: info.currency,
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
      currency: purchase.currency,
      createdAt: purchase.createdAt,
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
