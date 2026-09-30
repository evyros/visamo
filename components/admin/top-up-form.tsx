"use client";

import { useActionState } from "react";
import { topUp } from "@/app/admin/(panel)/users/[id]/balance/actions";
import { Notice, Select, SubmitButton, inputClass } from "@/components/app/auth-ui";

// Adds messages or checks to the user's case. The reason is required: it's
// kept on the ledger entry, next to who gave it.
export function TopUpForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(topUp, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      {state && "error" in state && <Notice>{state.error}</Notice>}
      {state && "added" in state && <Notice tone="success">{state.added}</Notice>}
      <div className="flex flex-wrap gap-4">
        <label className="block w-40 text-sm font-semibold text-navy-900">
          What
          <Select name="kind" defaultValue="checks">
            <option value="checks">Checks</option>
            <option value="messages">Messages</option>
          </Select>
        </label>
        <label className="block w-32 text-sm font-semibold text-navy-900">
          Amount
          <input name="amount" type="number" required min={1} max={1000} step={1} className={inputClass} />
        </label>
      </div>
      <label className="block text-sm font-semibold text-navy-900">
        Reason
        <textarea
          name="note"
          required
          maxLength={500}
          rows={2}
          placeholder="e.g. File Preparation bought by bank transfer"
          className={inputClass}
        />
      </label>
      <SubmitButton pending={pending} pendingLabel="Adding…" className="sm:w-auto">
        Top up
      </SubmitButton>
    </form>
  );
}
