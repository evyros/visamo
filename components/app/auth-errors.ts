import type { Messages } from "@/i18n/messages";

export type AuthLabels = Messages["app"]["auth"];

/** A Better Auth client error as a message the user can act on. */
export function authErrorMessage(
  error: { status?: number; code?: string } | null | undefined,
  t: AuthLabels,
) {
  if (!error) return undefined;
  if (error.status === 429) return t.errors.tooManyAttempts;
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") return t.errors.invalidCredentials;
  // The login code (components/app/login-code-form.tsx).
  if (error.code === "INVALID_CODE") return t.errors.codeInvalid;
  if (error.code === "OTP_HAS_EXPIRED" || error.code === "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE") return t.errors.codeExpired;
  if (error.code === "INVALID_TWO_FACTOR_COOKIE") return t.errors.loginExpired;
  return t.errors.generic;
}
