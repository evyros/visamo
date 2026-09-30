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
