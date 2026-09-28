/** App pages a signed-out visitor can open. Every other app page needs a session. */
export const publicAppPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];

/** The onboarding steps' URLs, in order. One page serves them all: app/(app)/(onboarding)/onboarding/[[...step]]. */
export const onboardingPaths = ["/onboarding", "/onboarding/partner", "/onboarding/relationship", "/onboarding/branch", "/onboarding/stage"];
