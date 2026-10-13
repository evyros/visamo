"use client";

import { useActionState, useRef } from "react";
import { rerun } from "@/app/admin/(panel)/users/[id]/documents/[key]/history/actions";
import { Notice } from "@/components/app/auth-ui";
import { Dialog } from "@/components/app/dialog";
import { primaryButton, secondaryButton } from "@/components/app/settings-ui";

// Reruns the document's latest check in its place, after a fix: the couple
// sees the new result as the same check, with no new activity, and nothing
// is spent (lib/checks/rerun.ts). It asks first: a rerun costs a model call.

export function RerunCheckForm({ userId, documentKey, checkId }: { userId: string; documentKey: string; checkId: string }) {
  const [state, action, pending] = useActionState(rerun, null);
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <form action={action} onSubmit={() => dialog.current?.close()} className="space-y-3 border-t border-line-200 pt-3">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="documentKey" value={documentKey} />
      <input type="hidden" name="checkId" value={checkId} />
      {state && "error" in state && <Notice>{state.error}</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          aria-disabled={pending}
          onClick={() => dialog.current?.showModal()}
          className={secondaryButton}
        >
          {pending ? "Re-running…" : "Re-run check"}
        </button>
        {pending && <span className="text-sm text-slate-500">This can take a few minutes. Keep the page open.</span>}
      </div>

      <Dialog ref={dialog} title="Re-run this check?" closeLabel="Cancel">
        <p className="text-[15px] text-slate-700">
          Same files and day, current guidance. Replaces this result for the couple, with no new activity and no check
          spent.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={() => dialog.current?.close()} className={secondaryButton}>
            Cancel
          </button>
          <button type="submit" className={primaryButton}>
            Re-run check
          </button>
        </div>
      </Dialog>
    </form>
  );
}
