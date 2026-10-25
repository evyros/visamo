/** App pages a signed-out visitor can open. Every other app page needs a session. */
export const publicAppPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];

/** The onboarding steps' URLs, in order. One page serves them all: app/(app)/(onboarding)/onboarding/[[...step]]. */
export const onboardingPaths = ["/onboarding", "/onboarding/partner", "/onboarding/relationship", "/onboarding/branch", "/onboarding/stage"];

/**
 * A support-access link (lib/support-access.ts): /access/ and a 32-byte
 * base64url token. The only page proxy.ts brings a user back to after they
 * log in, so a login redirect can't be pointed anywhere else.
 */
export const accessPathPattern = /^\/access\/[A-Za-z0-9_-]{43}$/;

/**
 * A chat's public link (lib/chat/shares.ts): /shared/ and a 32-byte base64url
 * token. Anyone can open it, signed in or not.
 */
export const sharedChatPathPattern = /^\/shared\/[A-Za-z0-9_-]{43}$/;

/**
 * The request header proxy.ts sets on a shared chat's page, with the link's
 * token: the page is shown in the language it was shared in (i18n/app-locale.ts).
 */
export const SHARED_CHAT_HEADER = "x-visamo-shared-chat";

/** Text with any chat link's token taken out, for analytics (components/posthog.tsx). */
export const withoutShareTokens = (text: string) => text.replace(/\/shared\/[A-Za-z0-9_-]{43}/g, "/shared/:token");
