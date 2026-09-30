import { freemius } from "@/lib/freemius";
import { recordPurchase, refundPurchase, type WebhookPayment } from "@/lib/purchases";

// Freemius's webhook (Freemius → the product → Integrations → Webhooks, with
// the events below). It records purchases the success page didn't, like when
// the tab was closed right after paying, and takes back refunded ones. The
// request's signature is checked with the secret key; lib/purchases.ts reads
// each purchase itself from the Freemius API. Both are safe to repeat, and
// Freemius sends an event again when it gets an error back.
//
// The SDK's listener only knows license and subscription events, so the
// signature is checked here, with its verifySignature, and the event read
// directly.

type Event = {
  type?: string;
  objects?: { license?: { id?: string | number }; payment?: WebhookPayment };
};

/** What each event does. Anything else is acknowledged and ignored. */
const handlers: Record<string, (event: Event) => Promise<unknown>> = {
  "license.created": async ({ objects }) => objects?.license?.id && recordPurchase(String(objects.license.id)),
  "payment.refund": async ({ objects }) => objects?.payment && refundPurchase(objects.payment, "refund"),
  // The customer's bank took the money back.
  "payment.dispute.lost": async ({ objects }) => objects?.payment && refundPurchase(objects.payment, "chargeback"),
  // A dispute closed by refunding the payment.
  "payment.dispute.closed": async ({ objects }) => objects?.payment && refundPurchase(objects.payment, "refund"),
};

export async function POST(request: Request) {
  const body = await request.text();
  const listener = freemius().webhook.createListener();
  if (!listener.verifySignature(body, request.headers.get("x-signature"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: Event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Malformed JSON", { status: 400 });
  }

  const handle = event.type ? handlers[event.type] : undefined;
  if (!handle) return new Response(null, { status: 200 });
  try {
    await handle(event);
  } catch (error) {
    console.error("Freemius webhook failed", event.type, error);
    return new Response("Internal Server Error", { status: 500 });
  }
  return new Response(null, { status: 200 });
}
