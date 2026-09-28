"use client";

import { useEffect, useRef, useState } from "react";
import { deleteAccount } from "@/app/(app)/(main)/settings/actions";
import type { Messages } from "@/i18n/messages";
import { dangerButton, dangerOutlineButton, secondaryButton } from "./settings-ui";

// The danger zone: one button, then a confirmation that says again what goes.
export function DeleteAccount({
  t,
  consequence,
}: {
  t: Messages["app"]["settings"]["accountPage"];
  /** What deleting does for this user: alone, or with a partner who keeps the file. */
  consequence: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  if (!confirming) {
    return (
      <div className="space-y-4">
        <p>{consequence}</p>
        <button ref={openRef} type="button" onClick={() => setConfirming(true)} className={dangerOutlineButton}>
          {t.deleteButton}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={confirmRef}
      tabIndex={-1}
      role="alertdialog"
      aria-labelledby="delete-confirm-title"
      aria-describedby="delete-confirm-body"
      className="space-y-4 rounded-[10px] bg-terracotta-100 p-4 outline-none"
    >
      <p id="delete-confirm-title" className="font-semibold text-navy-900">
        {t.deleteConfirmTitle}
      </p>
      <p id="delete-confirm-body">{consequence}</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            // Redirects to the website when it's done.
            await deleteAccount();
          }}
          className={dangerButton}
        >
          {pending ? t.deleting : t.deleteConfirm}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            requestAnimationFrame(() => openRef.current?.focus());
          }}
          className={secondaryButton}
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
