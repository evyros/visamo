"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  approveResult,
  checkDocument,
  discardResult,
  hideFinding,
  saveFinding,
} from "@/app/admin/(panel)/users/[id]/documents/actions";
import type { FindingKind } from "@/lib/checks/dismissals";
import { MAX_DETAIL_LENGTH, MAX_TITLE_LENGTH, type FindingText } from "@/lib/checks/result";
import { Dialog } from "@/components/app/dialog";
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
 * At a finding's end, in a result waiting for approval: a menu to edit it
 * (its kind, and its title and content in both languages) or dismiss it, so
 * the couple never sees it; a dismissed one can be put back. Neither is
 * recorded: to the couple, it's what the check said.
 */
export function AdminFindingMenu({
  userId,
  runId,
  kind,
  index,
  hidden,
  pending,
  finding,
}: {
  userId: string;
  runId: string;
  kind: FindingKind;
  index: number;
  hidden: boolean;
  /**
   * The result waits for approval: the finding can also be dismissed, and
   * moved between issue and tip. Once the couple sees it, only its text
   * changes (lib/checks/free.ts editFinding).
   */
  pending: boolean;
  finding: { en: FindingText; he: FindingText };
}) {
  const [hideState, hideAction, hiding] = useActionState(hideFinding, null);
  const [saveState, saveAction, saving] = useActionState(saveFinding, null);
  // What the last save said when the dialog opened: its error isn't shown again.
  const [seen, setSeen] = useState<typeof saveState>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Saved: the page refreshes with the new text, and the dialog closes.
  useEffect(() => {
    if (saveState && "done" in saveState) dialog.current?.close();
  }, [saveState]);

  const ids = { userId, runId, kind, index };
  const hiddenInputs = Object.entries(ids).map(([name, value]) => (
    <input key={name} type="hidden" name={name} value={value} />
  ));
  const item = "flex w-full items-center px-3 py-2 text-start text-[15px] text-navy-900 hover:bg-navy-900/5";
  const field =
    "mt-1 block w-full rounded-lg border border-line-200 px-3 py-2 text-[15px] font-normal text-navy-900 focus-visible:outline-2 focus-visible:outline-teal-600";

  return (
    <div ref={ref} className="relative -me-1.5 -mt-1 flex shrink-0 items-start gap-2 self-start">
      {hideState && "error" in hideState && <span className="text-xs text-terracotta-600">{hideState.error}</span>}
      <button
        type="button"
        aria-label="Finding options"
        aria-expanded={open}
        disabled={hiding}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-navy-900/5 hover:text-navy-900 disabled:opacity-50"
      >
        <Icon name="more" className="size-4" />
      </button>
      {open && (
        <div className="absolute end-0 top-8 z-20 w-44 overflow-hidden rounded-[10px] border border-line-200 bg-white py-1 shadow-soft">
          {!hidden && (
            <button
              type="button"
              className={item}
              onClick={() => {
                setOpen(false);
                setSeen(saveState);
                formRef.current?.reset();
                dialog.current?.showModal();
              }}
            >
              Edit…
            </button>
          )}
          {pending && (
            <form
              action={(formData) => {
                setOpen(false);
                hideAction(formData);
              }}
            >
              {hiddenInputs}
              <input type="hidden" name="hide" value={hidden ? "0" : "1"} />
              <button type="submit" className={item}>
                {hidden ? "Undo dismiss" : "Dismiss"}
              </button>
            </form>
          )}
        </div>
      )}

      <Dialog ref={dialog} title="Edit finding" closeLabel="Cancel">
        <form ref={formRef} action={saveAction} className="space-y-4">
          {hiddenInputs}
          {saveState !== seen && saveState && "error" in saveState && <Notice>{saveState.error}</Notice>}
          {pending ? (
            <fieldset>
              <legend className="text-sm font-semibold text-navy-900">Severity</legend>
              <div className="mt-1.5 flex flex-wrap gap-4 text-[15px] text-navy-900">
                {(
                  [
                    ["issue", "Needs fixing"],
                    ["recommendation", "Can be improved (tip)"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="newKind"
                      value={value}
                      defaultChecked={kind === value}
                      className="size-4 accent-teal-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <input type="hidden" name="newKind" value={kind} />
          )}
          {(
            [
              ["en", "English", "ltr"],
              ["he", "Hebrew", "rtl"],
            ] as const
          ).map(([lang, name, dir]) => (
            <div key={lang} className="space-y-3">
              <label className="block text-sm font-semibold text-navy-900">
                {name} title
                <input
                  name={`${lang}Title`}
                  defaultValue={finding[lang].title}
                  maxLength={MAX_TITLE_LENGTH}
                  dir={dir}
                  className={field}
                />
              </label>
              <label className="block text-sm font-semibold text-navy-900">
                {name} content
                <textarea
                  name={`${lang}Detail`}
                  defaultValue={finding[lang].detail}
                  maxLength={MAX_DETAIL_LENGTH}
                  required
                  rows={4}
                  dir={dir}
                  className={field}
                />
              </label>
            </div>
          ))}
          <p className="text-sm text-slate-600">
            Saved in place: the couple sees it as the check’s own finding, and nothing records the change.
            {!pending && " An email already sent about it keeps the old text, if one was."}
          </p>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => dialog.current?.close()} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
