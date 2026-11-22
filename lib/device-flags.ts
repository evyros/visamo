// Choices remembered on one device only, in cookies the server can read, so a
// page can leave out what was dismissed instead of hiding it after it shows, or
// draw a list the way it was last chosen instead of reordering it.

/** Set when the invite-your-partner banner on the overview is dismissed. */
export const INVITE_DISMISSED_COOKIE = "visamo_invite_dismissed";

/** Set when the free-check box on the overview is dismissed: to the state it was in ("waiting" or "ready"). */
export const FREE_CHECK_DISMISSED_COOKIE = "visamo_free_check_dismissed";

/** How the documents page groups its list on this device: "type" (the default) or "person". */
export const DOCUMENTS_VIEW_COOKIE = "visamo_documents_view";

/** How long a device remembers a dismissal. */
export const DISMISS_MAX_AGE = 60 * 60 * 24 * 365 * 2;

/** How long a device remembers a choice, like the documents page's grouping. */
export const DEVICE_CHOICE_MAX_AGE = DISMISS_MAX_AGE;
