"use client";

import { useLinkStatus } from "next/link";

// Feedback inside a <Link> between the click and the next page showing, for
// when the page wasn't prefetched yet. It waits a moment before showing
// (.link-pending-in in globals.css), so fast navigations don't flicker.

/** A soft pulse over a text-only link while its page loads. The link needs `relative`. */
export function LinkPendingHighlight() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span aria-hidden="true" className="link-pending-in pointer-events-none absolute inset-0 rounded-[inherit]">
      <span className="block size-full rounded-[inherit] bg-navy-900/8 motion-safe:animate-pulse" />
    </span>
  );
}
