// What the recommendation letter pages report for the stats
// (lib/letters/events.ts), shared by the browser and the server.

/** How a friend got the link: an invite email adds ?via=email; any other way is "link". */
export type LetterVia = "email" | "link";

/** The random id a friend's browser keeps (crypto.randomUUID). */
export const visitorPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** How the couple got to the tool: the app's documents page links with ?from=app. */
export type LetterSource = "site" | "app";
