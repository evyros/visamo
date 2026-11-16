"use client";

import { useActionState, useState } from "react";
import {
  approveResult,
  checkDocument,
  discardResult,
  hideFinding,
} from "@/app/admin/(panel)/users/[id]/documents/actions";
import type { FindingKind } from "@/lib/checks/dismissals";
import { Icon } from "@/components/icons";
import { Notice } from "@/components/app/auth-ui";
import { primaryButton, secondaryButton } from "@/components/app/settings-ui";

// The free check's buttons on a document's card (lib/checks/free.ts): check
// the document, approve the result waiting for approval, and discard it (or
// a check that failed). Nothing is spent: the checks are the admin's.

type Action = "check" | "approve" | "discard";

export function FreeCheckForm({
  userId,
  documentKey,
  approveRunId,
  discardRunId,
  canCheck,
  checked,
}: {
  userId: string;
  documentKey: string;
  /** A finished result waiting for approval. */
  approveRunId: string | null;
  /** What Discard drops: the result waiting, or a check that failed. */
  discardRunId: string | null;
  /** The document can be checked now: it has a check and files, and no check is running. */
  canCheck: boolean;
  /** It was checked before: the button says "Check again". */
  checked: boolean;
}) {
  const actions = {
    check: useActionState(checkDocument, null),
    approve: useActionState(approveResult, null),
    discard: useActionState(discardResult, null),
  };
  // Only the last action's error: an older one no longer applies.
  const [last, setLast] = useState<Action | null>(null);
  const busy = Object.values(actions).some(([, , pending]) => pending);
  const state = last && actions[last][0];
  const error = state && "error" in state ? state.error : null;

  const button = (action: Action, runId: string | null, label: string, style: string) => (
    <form
      action={(formData) => {
        setLast(action);
        actions[action][1](formData);
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="documentKey" value={documentKey} />
      {runId && <input type="hidden" name="runId" value={runId} />}
      <button type="submit" disabled={busy} aria-disabled={busy} className={style}>
        {label}
      </button>
    </form>
  );
  const [check, approve, discard] = [actions.check, actions.approve, actions.discard];

  return (
    <div className="space-y-3">
      {error && <Notice>{error}</Notice>}
      <div className="flex flex-wrap items-center gap-3">
        {approveRunId && button("approve", approveRunId, approve[2] ? "Approving…" : "Approve", primaryButton)}
        {canCheck && button("check", null, check[2] ? "Checking…" : checked ? "Check again" : "Check", secondaryButton)}
        {discardRunId && button("discard", discardRunId, discard[2] ? "Discarding…" : "Discard", secondaryButton)}
        {check[2] && <span className="text-sm text-slate-500">This can take a few minutes. Keep the page open.</span>}
      </div>
    </div>
  );
}

/**
 * At a finding's end, in a result waiting for approval: × takes it out (the
 * couple never sees it), Undo puts it back.
 */
export function HideFindingButton({
  userId,
  runId,
  kind,
  index,
  hidden,
}: {
  userId: string;
  runId: string;
  kind: FindingKind;
  index: number;
  hidden: boolean;
}) {
  const [state, action, busy] = useActionState(hideFinding, null);
  return (
    <form action={action} className="-me-1.5 -mt-1 flex shrink-0 items-start gap-2 self-start">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="runId" value={runId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="index" value={index} />
      <input type="hidden" name="hide" value={hidden ? "0" : "1"} />
      {state && "error" in state && <span className="text-xs text-terracotta-600">{state.error}</span>}
      {hidden ? (
        <button type="submit" disabled={busy} className="px-1 text-sm font-semibold text-teal-700 hover:underline">
          Undo
        </button>
      ) : (
        <button
          type="submit"
          disabled={busy}
          aria-label="Hide this finding from the couple"
          title="Hide this finding from the couple"
          className="inline-flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-navy-900/5 hover:text-navy-900 disabled:opacity-50"
        >
          <Icon name="x" className="size-4" />
        </button>
      )}
    </form>
  );
}
