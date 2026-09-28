"use client";

import Link from "next/link";
import { useState } from "react";
import { DISMISS_MAX_AGE, INVITE_DISMISSED_COOKIE } from "@/lib/device-flags";
import { Icon } from "@/components/icons";

/**
 * Nudges a user whose partner isn't in the file, and hasn't been invited, to
 * invite them. Dismissing it is remembered on this device (a cookie the
 * overview reads), not on the account.
 */
export function InviteBanner({
  title,
  body,
  action,
  dismiss,
}: {
  title: string;
  body: string;
  action: string;
  dismiss: string;
}) {
  const [shown, setShown] = useState(true);
  if (!shown) return null;

  function onDismiss() {
    document.cookie = `${INVITE_DISMISSED_COOKIE}=1; path=/; max-age=${DISMISS_MAX_AGE}; samesite=lax`;
    setShown(false);
  }

  return (
    <section className="mt-6 flex items-start gap-3 rounded-card border border-teal-600/30 bg-teal-100/50 p-4 sm:p-5">
      <Icon name="people" className="mt-0.5 size-6 shrink-0 text-teal-700" />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-navy-900">{title}</h2>
        <p className="mt-1 text-[15px] text-slate-700">{body}</p>
        <Link
          href="/settings/partner"
          className="mt-3 inline-flex h-10 items-center justify-center rounded-[10px] bg-teal-600 px-4 text-[15px] font-semibold text-white shadow-soft hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          {action}
        </Link>
      </div>
      <button
        type="button"
        aria-label={dismiss}
        onClick={onDismiss}
        className="-me-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5"
      >
        <Icon name="x" className="size-5" />
      </button>
    </section>
  );
}
