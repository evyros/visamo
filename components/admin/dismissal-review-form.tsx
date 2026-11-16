"use client";

import { useActionState } from "react";
import { review } from "@/app/admin/(panel)/dismissals/actions";
import { MAX_REVIEW_NOTE } from "@/lib/checks/dismissals";
import { Notice, Select, SubmitButton, inputClass } from "@/components/app/auth-ui";
import { reviewOutcomeLabels } from "./admin-ui";

// Marking a dismissed finding as reviewed: what the admin concluded, and a
// note to the couple. "Checker was right" brings the finding back; a right or
// wrong review and its note are shown to the couple on the finding.

export function DismissalReviewForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(review, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      {state && "error" in state && <Notice>{state.error}</Notice>}
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
      {/* Its line breaks are kept, and shown to the couple as written. */}
      <label className="block text-sm font-semibold text-navy-900">
        Note to the couple
        <textarea
          name="note"
          maxLength={MAX_REVIEW_NOTE}
          rows={4}
          dir="auto"
          placeholder="Shown to them with “Checker was right” or “wrong”, in their language. About the requirement, never their files."
          className={inputClass}
        />
      </label>
      <SubmitButton pending={pending} pendingLabel="Saving…" className="sm:w-auto">
        Mark reviewed
      </SubmitButton>
    </form>
  );
}
