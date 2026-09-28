// Choices remembered on one device only, in cookies the server can read, so a
// page can leave out what was dismissed instead of hiding it after it shows.

/** Set when the invite-your-partner banner on the overview is dismissed. */
export const INVITE_DISMISSED_COOKIE = "visamo_invite_dismissed";

/** How long a device remembers a dismissal. */
export const DISMISS_MAX_AGE = 60 * 60 * 24 * 365 * 2;
