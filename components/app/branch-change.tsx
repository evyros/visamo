"use client";

import { useRef, useState, type FormEvent } from "react";
import { updateBranch } from "@/app/(app)/(main)/file/actions";
import type { Messages } from "@/i18n/messages";
import type { BranchCode } from "@/lib/case-options";
import { Field, Notice, Select, SubmitButton } from "./auth-ui";
import { Dialog } from "./dialog";
import type { Option } from "./onboarding-wizard";

// Changing the case's Misrad Hapnim branch, from the details card. Not a details edit: the branch doesn't change the document list,
// so changing it doesn't use one of the case's edits.

/** The Change link and its dialog, beside the branch in the details card. */
export function BranchChange({
  t,
  branch,
  branches,
}: {
  t: Messages["app"]["overview"]["branch"];
  branch: BranchCode | null;
  branches: Option<BranchCode>[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [chosen, setChosen] = useState<BranchCode | "">(branch ?? "");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await updateBranch(chosen || null);
    setPending(false);
    if (result.error) setError(t.error);
    else dialog.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setChosen(branch ?? "");
          setError(undefined);
          dialog.current?.showModal();
        }}
        className="font-semibold text-teal-700 underline-offset-4 hover:underline"
      >
        {t.change}
      </button>
      <Dialog ref={dialog} title={t.dialogTitle} closeLabel={t.close}>
        <form noValidate onSubmit={onSubmit} className="space-y-5">
          {error && <Notice>{error}</Notice>}
          <Field id="branchChoice" label={t.label}>
            <Select id="branchChoice" value={chosen} onChange={(e) => setChosen(e.target.value as BranchCode | "")}>
              <option value="">{t.unknown}</option>
              {branches.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </Select>
          </Field>
          <SubmitButton pending={pending} pendingLabel={t.saving} className="sm:w-auto">
            {t.save}
          </SubmitButton>
        </form>
      </Dialog>
    </>
  );
}
