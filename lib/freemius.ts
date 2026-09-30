import "server-only";
import { Freemius } from "@freemius/sdk";
import type { Locale } from "@/i18n/config";
import type { ProductId } from "./products";
import { site } from "./site";

// Freemius sells the one-time purchases: its checkout opens over the app, in
// an overlay (components/app/purchase.tsx), and Freemius is the merchant of
// record. The product in Freemius has a lifetime plan for each ProductId.
// The keys are backend-only: the browser gets checkoutOptions, which has the
// public key alone.

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. See .env.example.`);
  return value;
}

/** Whether Freemius is set up: a local run can go without its keys, and without purchases. */
export const freemiusReady = () => !!process.env.FREEMIUS_PRODUCT_ID;

let instance: Freemius | undefined;

// Created on first use, so `next build` doesn't need the keys.
export function freemius() {
  instance ??= new Freemius({
    productId: Number(env("FREEMIUS_PRODUCT_ID")),
    apiKey: env("FREEMIUS_API_KEY"),
    secretKey: env("FREEMIUS_SECRET_KEY"),
    publicKey: env("FREEMIUS_PUBLIC_KEY"),
  });
  return instance;
}

/**
 * A plan's numeric id. The checkout also takes a plan's name, but purchases
 * come back with the id, so a name would sell the plan and grant nothing.
 */
function planId(name: string) {
  const value = env(name);
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be the plan's numeric id (Freemius → Plans), not "${value}".`);
  return value;
}

/** The Freemius plan of each product. */
export function planIds(): Record<ProductId, string> {
  return {
    messagePack: planId("FREEMIUS_PLAN_MESSAGE_PACK"),
    fileCheck: planId("FREEMIUS_PLAN_FILE_CHECK"),
  };
}

/** The product a Freemius plan sells, or null for a plan that isn't ours. */
export function productOfPlan(planId: string): ProductId | null {
  const plans = planIds();
  return (Object.keys(plans) as ProductId[]).find((product) => plans[product] === planId) ?? null;
}

/** Test purchases, with Freemius's test cards: on everywhere but production. */
const sandbox = process.env.FREEMIUS_SANDBOX === "1";

/**
 * What the browser opens the checkout with, for this user: their email,
 * which they can't change there, since it's how a purchase finds its case;
 * the app's language; shekels; and no license choice, which a one-time
 * purchase doesn't have. The plan is picked when it opens.
 */
export async function checkoutOptions(user: { email: string; name: string }, locale: Locale) {
  const checkout = await freemius().checkout.create({
    user: { email: user.email, name: user.name },
    isSandbox: sandbox,
    withRecommendation: false,
    // Freemius shows only an https image: none on localhost.
    image: site.appUrl.startsWith("https:") ? new URL("/apple-icon.png", site.appUrl).toString() : undefined,
  });
  checkout
    .setLanguage(locale === "he" ? "he_IL" : "en")
    .setCurrency("ils")
    .setBillingCycle("lifetime")
    .setAppearance({ layout: "vertical" });
  return { ...checkout.getOptions(), hide_licenses: true };
}

export type CheckoutOptions = Awaited<ReturnType<typeof checkoutOptions>>;
