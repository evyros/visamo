import { handleCallback } from "@vercel/queue";
import { deliverResultsEmail, type CheckResultsEmailMessage } from "@/lib/checks/results-email";

// The check-results-email queue's consumer (vercel.json): Vercel Queues calls
// it an hour after the admin approved a free check result, and it emails the
// couple everything approved in that hour (lib/checks/results-email.ts). The
// queue trigger makes the route private: only Vercel's queue infrastructure
// can call it. Returning acknowledges the message; throwing (a failed send)
// has it delivered again, up to 5 times.

export const POST = handleCallback<CheckResultsEmailMessage>(
  async ({ caseId }) => {
    await deliverResultsEmail(caseId);
  },
  {
    retry: (error, metadata) => {
      if (metadata.deliveryCount >= 5) {
        console.error("check results email: giving up", metadata.messageId, error);
        return { acknowledge: true };
      }
      return { afterSeconds: 60 * metadata.deliveryCount };
    },
  },
);
