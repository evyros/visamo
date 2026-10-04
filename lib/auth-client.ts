import { createAuthClient } from "better-auth/react";
import { magicLinkClient, twoFactorClient } from "better-auth/client/plugins";

// Runs in the browser on the app host, so it calls /api/auth on the same origin.
export const authClient = createAuthClient({ plugins: [magicLinkClient(), twoFactorClient()] });
