"use client";

import { useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { updateBranch, updateStage } from "@/app/(app)/(main)/file/actions";
import type { Messages } from "@/i18n/messages";
import { format } from "@/i18n/messages";
import { stageDates, stages, type BranchCode, type Stage } from "@/lib/case-options";
import { Icon } from "@/components/icons";
import { Field, Notice, Select, SubmitButton, describe, inputClass } from "./auth-ui";
import { Choices, type Option } from "./onboarding-wizard";
import { secondaryButton } from "./settings-ui";

// Where the couple is with Misrad Hapnim: the stages in order, and a dialog
// to move to any of them, forward or back. The couple reports it; nobody
// else knows. Moving to a stage with a date (stageDates) asks for it.

type Labels = Messages["app"]["overview"]["stage"];

/** Today's date where the user is, as `yyyy-mm-dd`, for the date inputs' limits. */
function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function StageCard({
  t,
  stage,
  dates,
  shown,
  branch,
  branchName,
  branches,
}: {
  t: Labels;
  stage: Stage;
  /** As saved, for the dialog to offer again. */
  dates: { filedOn: string | null; interviewOn: string | null };
  /** The dates as shown, worked out on the server: "Filed on 3 Aug 2026", "Interview on … · in 12 days". */
  shown: { filedOn: string | null; interviewOn: string | null };
  branch: BranchCode | null;
  branchName: string | null;
  branches: Option<BranchCode>[];
}) {
  const current = stages.indexOf(stage);
  const note: Partial<Record<Stage, string | null>> = {
    filedAwaiting: shown.filedOn,
    interviewScheduled: shown.interviewOn,
  };

  return (
    <section className="rounded-card border border-line-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-navy-900">{t.title}</h2>
      <ol className="mt-4">
        {stages.map((s, i) => {
          const done = i < current;
          const here = i === current;
          const last = i === stages.length - 1;
          const detail = i <= current ? note[s] : null;
          return (
            <li key={s} aria-current={here ? "step" : undefined} className="relative flex gap-3 pb-4 last:pb-0">
              {!last && (
                <span
                  aria-hidden
                  className={`absolute start-[11px] top-6 bottom-0 w-0.5 ${done ? "bg-teal-600" : "bg-line-200"}`}
                />
              )}
              <span
                aria-hidden
                className={`relative flex size-6 shrink-0 items-center justify-center rounded-full ${
                  done
                    ? "bg-teal-600 text-white"
                    : here
                      ? "bg-white ring-[5px] ring-teal-600 ring-inset"
                      : "bg-white ring-2 ring-line-200 ring-inset"
                }`}
              >
                {done && <Icon name="check" className="size-4" />}
              </span>
              <span className="min-w-0 pt-px">
                {/* The pill wraps under a long stage name rather than squeezing it. */}
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={`text-[15px] ${
                      here ? "font-semibold text-navy-900" : done ? "text-navy-900" : "text-slate-500"
                    }`}
                  >
                    {t.steps[s]}
                  </span>
                  {here && (
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                      {t.now}
                    </span>
                  )}
                </span>
                {detail && <span className="mt-0.5 block text-sm text-slate-600">{detail}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 space-y-4 border-t border-line-200 pt-4">
        <UpdateStage t={t} stage={stage} dates={dates} />
        <BranchLine t={t} branch={branch} branchName={branchName} branches={branches} />
      </div>
    </section>
  );
}

/** A native modal dialog, closed by its button, Escape or a click outside. */
function Dialog({
  ref,
  title,
  closeLabel,
  children,
}: {
  ref: RefObject<HTMLDialogElement | null>;
  title: string;
  closeLabel: string;
  children: ReactNode;
}) {
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
      className="m-auto w-[min(92vw,480px)] rounded-card bg-white p-0 shadow-soft backdrop:bg-navy-900/50"
    >
      <div className="flex items-center gap-3 border-b border-line-200 px-5 py-3">
        <h3 className="min-w-0 flex-1 text-lg font-semibold text-navy-900">{title}</h3>
        <button
          type="button"
          aria-label={closeLabel}
          onClick={() => ref.current?.close()}
          className="inline-flex size-9 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5"
        >
          <Icon name="x" className="size-5" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-auto px-5 py-5">{children}</div>
    </dialog>
  );
}

function UpdateStage({
  t,
  stage,
  dates,
}: {
  t: Labels;
  stage: Stage;
  dates: { filedOn: string | null; interviewOn: string | null };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [chosen, setChosen] = useState<Stage>(stage);
  const [day, setDay] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const column = chosen in stageDates ? stageDates[chosen as keyof typeof stageDates] : null;
  const back = stages.indexOf(chosen) < stages.indexOf(stage);

  function open() {
    setChosen(stage);
    setDay((stage in stageDates && dates[stageDates[stage as keyof typeof stageDates]]) || "");
    setError(undefined);
    dialog.current?.showModal();
  }

  function choose(next: Stage) {
    setChosen(next);
    // A date saved for that stage before comes back.
    setDay((next in stageDates && dates[stageDates[next as keyof typeof stageDates]]) || "");
    setError(undefined);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (chosen === "interviewScheduled" && !day) {
      setError(t.errors.dateRequired);
      return;
    }
    setPending(true);
    const result = await updateStage(chosen, column ? day || null : null);
    setPending(false);
    if (result.error) setError(t.errors[result.error]);
    else dialog.current?.close();
  }

  return (
    <>
      <button type="button" onClick={open} className={secondaryButton}>
        {t.update}
      </button>
      <Dialog ref={dialog} title={t.dialogTitle} closeLabel={t.close}>
        <form noValidate onSubmit={onSubmit} className="space-y-5">
          <Choices
            id="stage"
            legend={<span className="sr-only">{t.dialogTitle}</span>}
            options={stages.map((s) => ({ value: s, label: t.steps[s] }))}
            value={chosen}
            onChange={choose}
          />
          {column && (
            <Field
              id="stageDate"
              label={column === "filedOn" ? t.filedDate : t.interviewDate}
              hint={column === "filedOn" ? t.filedDateHint : undefined}
              error={error}
            >
              <input
                id="stageDate"
                type="date"
                value={day}
                max={column === "filedOn" ? localToday() : undefined}
                onChange={(e) => {
                  setDay(e.target.value);
                  setError(undefined);
                }}
                className={inputClass}
                {...describe("stageDate", error, column === "filedOn")}
              />
            </Field>
          )}
          {!column && error && <Notice>{error}</Notice>}
          {back && <Notice tone="warning">{format(t.back, { stage: t.steps[chosen] })}</Notice>}
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pending={pending} pendingLabel={t.saving} className="sm:w-auto">
              {t.save}
            </SubmitButton>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="px-3 text-[15px] font-semibold text-slate-600 hover:underline"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function BranchLine({
  t,
  branch,
  branchName,
  branches,
}: {
  t: Labels;
  branch: BranchCode | null;
  branchName: string | null;
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
    if (result.error) setError(t.errors.generic);
    else dialog.current?.close();
  }

  return (
    // One line: a long branch name is cut short, so Change stays beside it.
    <div className="flex min-w-0 items-baseline gap-1.5 text-[15px] text-slate-700">
      <span className="shrink-0 font-semibold text-navy-900">{t.branch}:</span>
      <span className="min-w-0 truncate" title={branchName ?? undefined}>
        {branchName ?? t.noBranch}
      </span>
      <span aria-hidden className="shrink-0">
        ·
      </span>
      <button
        type="button"
        onClick={() => {
          setChosen(branch ?? "");
          setError(undefined);
          dialog.current?.showModal();
        }}
        className="shrink-0 font-semibold text-teal-700 underline-offset-4 hover:underline"
      >
        {t.changeBranch}
      </button>
      <Dialog ref={dialog} title={t.branchTitle} closeLabel={t.close}>
        <form noValidate onSubmit={onSubmit} className="space-y-5">
          {error && <Notice>{error}</Notice>}
          <Field id="branchChoice" label={t.branch}>
            <Select id="branchChoice" value={chosen} onChange={(e) => setChosen(e.target.value as BranchCode | "")}>
              <option value="">{t.branchUnknown}</option>
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
    </div>
  );
}
