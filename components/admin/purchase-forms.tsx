"use client";

import { useActionState } from "react";
import { givePurchase, revokePurchase } from "@/app/admin/(panel)/users/[id]/balance/actions";
import { Notice, Select, SubmitButton, inputClass } from "@/components/app/auth-ui";

// Giving the user's case a product without a payment, and taking back what a
// purchase granted. The reason is required for both: it's kept with them, on
// the ledger entries, next to who did it.

export function GivePurchaseForm({ userId, hasFileCheck }: { userId: string; hasFileCheck: boolean }) {
  const [state, action, pending] = useActionState(givePurchase, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      {state && "error" in state && <Notice>{state.error}</Notice>}
      {state && "added" in state && <Notice tone="success">{state.added}</Notice>}
      <label className="block w-56 text-sm font-semibold text-navy-900">
        Product
        <Select name="product" defaultValue={hasFileCheck ? "messagePack" : "fileCheck"}>
          <option value="fileCheck" disabled={hasFileCheck}>
            Full file check
          </option>
          <option value="messagePack">Message pack</option>
        </Select>
      </label>
      <label className="block text-sm font-semibold text-navy-900">
        Reason
        <textarea
          name="note"
          required
          maxLength={500}
          rows={2}
          placeholder="e.g. Paid by bank transfer"
          className={inputClass}
        />
      </label>
      <SubmitButton pending={pending} pendingLabel="Giving…" className="sm:w-auto">
        Give
      </SubmitButton>
    </form>
  );
}

export function RevokePurchaseForm({ userId, purchaseId }: { userId: string; purchaseId: string }) {
  const [state, action, pending] = useActionState(revokePurchase, null);
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm font-semibold text-terracotta-600">Revoke…</summary>
      <form action={action} className="mt-2 space-y-3">
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="purchaseId" value={purchaseId} />
        {state && "error" in state && <Notice>{state.error}</Notice>}
        <p className="text-sm text-slate-700">
          Takes back what’s left of its messages and checks, and what it unlocked, unless another purchase unlocks it
          too. It doesn’t refund anything in Freemius.
        </p>
        <label className="block text-sm font-semibold text-navy-900">
          Reason
          <textarea
            name="note"
            required
            maxLength={500}
            rows={2}
            placeholder="e.g. Chargeback opened in PayPal"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-[10px] border-[1.5px] border-terracotta-600 px-5 text-sm font-semibold text-terracotta-600 transition-colors hover:bg-terracotta-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-600 disabled:opacity-70"
        >
          {pending ? "Revoking…" : "Revoke"}
        </button>
      </form>
    </details>
  );
}
