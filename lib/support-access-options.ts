// A support-access request's choices (lib/support-access.ts): the allowed
// values, and their English names for the admin panel. The couple's page
// names them from the messages (app.access.durations, app.access.reasons),
// keyed by these values, so a missing translation fails the build.

/** How long the team may look, in hours, from when they agree. */
export const accessDurations = [1, 4, 24, 72, 168] as const;
export type AccessDuration = (typeof accessDurations)[number];

export const isAccessDuration = (hours: number): hours is AccessDuration =>
  accessDurations.includes(hours as AccessDuration);

export const durationLabels: Record<AccessDuration, string> = {
  1: "1 hour",
  4: "4 hours",
  24: "24 hours",
  72: "3 days",
  168: "7 days",
};

/** Why the team asks. Optional: without one, the page doesn't say. */
export const accessReasons = ["supportRequest", "checkResult", "fileProblem", "documentList", "chat", "account", "billing"] as const;
export type AccessReason = (typeof accessReasons)[number];

export const isAccessReason = (value: string): value is AccessReason => accessReasons.includes(value as AccessReason);

export const reasonLabels: Record<AccessReason, string> = {
  supportRequest: "Their support request",
  checkResult: "A document check result",
  fileProblem: "A problem uploading or opening a file",
  documentList: "Which documents they need",
  chat: "An answer from the assistant",
  account: "Their account or partner access",
  billing: "A payment or their balance",
};
