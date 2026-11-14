import { handleCallback } from "@vercel/queue";
import { deliverWelcomeEmail, type WelcomeEmailMessage } from "@/lib/welcome-email";

// The welcome-email queue's consumer (vercel.json): Vercel Queues calls it
// with each signup's message, 5 minutes after it was queued. The queue trigger
// makes the route private: it has no public URL, and only Vercel's queue
// infrastructure can call it, so nobody can make it email a user of their
// choosing. Returning acknowledges the message; throwing (a failed send) has
// it delivered again, up to 5 times.

export const POST = handleCallback<WelcomeEmailMessage>(
  async ({ userId }) => {
    await deliverWelcomeEmail(userId);
  },
  {
    retry: (error, metadata) => {
      if (metadata.deliveryCount >= 5) {
        console.error("welcome email: giving up", metadata.messageId, error);
        return { acknowledge: true };
      }
      return { afterSeconds: 60 * metadata.deliveryCount };
    },
  },
);
