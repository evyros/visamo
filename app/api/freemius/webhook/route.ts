import { freemius } from "@/lib/freemius";
import { recordPurchase } from "@/lib/purchases";

// Freemius's webhook (Freemius → the product → Integrations → Webhooks, with
// the license.created event): records purchases the checkout's callback
// didn't, like when the tab was closed right after paying. The listener
// checks the request's signature with the secret key, and lib/purchases.ts
// reads the purchase itself from the Freemius API. An error answers 500, so
// Freemius sends it again.
export async function POST(request: Request) {
  const listener = freemius().webhook.createListener();
  listener.on("license.created", async ({ objects: { license } }) => {
    await recordPurchase(String(license.id));
  });
  return freemius().webhook.processFetch(listener, request);
}
