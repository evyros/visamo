"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { updateStage } from "@/app/(app)/(main)/file/actions";
import type { Messages } from "@/i18n/messages";
import { format } from "@/i18n/messages";
import { isDated, stageDateKinds, type Stage, type StageDates } from "@/lib/stages";
import { Icon } from "@/components/icons";
import { Field, Notice, SubmitButton, describe, inputClass } from "./auth-ui";
import { Dialog } from "./dialog";
import { Choices } from "./onboarding-wizard";
import { secondaryButton } from "./settings-ui";

// Where the couple is in the process: their track's stages in order
// (lib/stages.ts), and a dialog to move to any of them, forward or back. The
// couple reports it; nobody else knows. Moving to a stage with a date
// (stageDateKinds) asks for it.

type Labels = Messages["app"]["overview"]["stage"];

/** Today's date where the user is, as `yyyy-mm-dd`, for the date inputs' limits. */
function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function StageCard({
  t,
  track,
  stage,
  dates,
  shown,
}: {
  t: Labels;
  /** The case's stages, in order. */
  track: Stage[];
  stage: Stage;
  /** As saved, for the dialog to offer again. */
  dates: StageDates;
  /** The dates as shown, worked out on the server: "Filed on 3 Aug 2026", "Interview on … · in 12 days". */
  shown: Partial<Record<Stage, string>>;
}) {
  const current = track.indexOf(stage);

  return (
    <section className="rounded-card border border-line-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-navy-900">{t.title}</h2>
      <ol className="mt-4">
        {track.map((s, i) => {
          const done = i < current;
          const here = i === current;
          const last = i === track.length - 1;
          const detail = i <= current ? shown[s] : null;
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
        <UpdateStage t={t} track={track} stage={stage} dates={dates} />
        <p className="text-[15px] text-slate-700">
          {t.ask.title}{" "}
          {/* Inline, not flex: a flex link sits on the icon's baseline, not the text's. */}
          <Link href="/chat" className="font-semibold whitespace-nowrap text-teal-700 underline-offset-4 hover:underline">
            <Icon name="chat" className="me-1 inline-block size-4 align-[-0.15em]" />
            {t.ask.action}
          </Link>
        </p>
      </div>
    </section>
  );
}

function UpdateStage({ t, track, stage, dates }: { t: Labels; track: Stage[]; stage: Stage; dates: StageDates }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [chosen, setChosen] = useState<Stage>(stage);
  const [day, setDay] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const dated = isDated(chosen) ? chosen : null;
  const scheduled = !!dated && stageDateKinds[dated] === "scheduled";
  const back = track.indexOf(chosen) < track.indexOf(stage);
  // A date saved for that stage before comes back.
  const savedDate = (s: Stage) => (isDated(s) && dates[s]) || "";

  function open() {
    setChosen(stage);
    setDay(savedDate(stage));
    setError(undefined);
    dialog.current?.showModal();
  }

  function choose(next: Stage) {
    setChosen(next);
    setDay(savedDate(next));
    setError(undefined);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (scheduled && !day) {
      setError(t.errors.dateRequired);
      return;
    }
    setPending(true);
    const result = await updateStage(chosen, dated ? day || null : null);
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
            options={track.map((s) => ({ value: s, label: t.steps[s] }))}
            value={chosen}
            onChange={choose}
          />
          {dated && (
            <Field id="stageDate" label={t.dates[dated].label} hint={scheduled ? undefined : t.pastHint} error={error}>
              <input
                id="stageDate"
                type="date"
                value={day}
                max={scheduled ? undefined : localToday()}
                onChange={(e) => {
                  setDay(e.target.value);
                  setError(undefined);
                }}
                className={inputClass}
                {...describe("stageDate", error, !scheduled)}
              />
            </Field>
          )}
          {!dated && error && <Notice>{error}</Notice>}
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
