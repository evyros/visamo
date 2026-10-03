"use client";

import { useActionState } from "react";
import { review } from "@/app/admin/(panel)/dismissals/actions";
import { Notice, Select, SubmitButton, inputClass } from "@/components/app/auth-ui";
import { reviewOutcomeLabels } from "./admin-ui";

// Marking a dismissed finding as reviewed: what the admin concluded, and
// what they did about it.

export function DismissalReviewForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(review, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={id} />
      {state && "error" in state && (
        <div className="basis-full">
          <Notice>{state.error}</Notice>
        </div>
      )}
      <label className="block w-56 text-sm font-semibold text-navy-900">
        Outcome
        <Select name="outcome" defaultValue="checkerWrong">
          {Object.entries(reviewOutcomeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </label>
      <label className="block min-w-[240px] flex-1 text-sm font-semibold text-navy-900">
        Note
        <input name="note" maxLength={1000} placeholder="e.g. Rewrote the line in checks.ts" className={inputClass} />
      </label>
      <SubmitButton pending={pending} pendingLabel="Saving…" className="sm:w-auto">
        Mark reviewed
      </SubmitButton>
    </form>
  );
}
