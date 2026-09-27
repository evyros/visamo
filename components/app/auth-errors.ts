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
  return t.errors.generic;
}
