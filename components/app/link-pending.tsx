"use client";

import { useLinkStatus } from "next/link";
import { Icon, type IconName } from "@/components/icons";

// Feedback inside a <Link> between the click and the next page showing, for
// when the page wasn't prefetched yet. Both wait a moment before showing
// (.link-pending-in in globals.css), so fast navigations don't flicker, and
// neither changes the link's size.

/** A link's icon that turns into a spinner while its page loads. */
export function LinkIcon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <Icon name={name} className={`size-full ${pending ? "link-pending-out" : ""}`} />
      {pending && (
        <span aria-hidden="true" className="link-pending-in absolute inset-[10%]">
          <span className="block size-full animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
    </span>
  );
}

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
