"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { answersKey } from "@/content/process/types";
import { Icon } from "../icons";

// The landing page's three questions about the couple's situation
// (content/process), one at a time: what it takes to hand them their process
// for free. A choice moves on by itself; the last one opens the guide for their
// situation. Those are static pages, so the paths come from the server.

export type SituationQuestion = {
  id: "relationship" | "location" | "lived";
  title: string;
  options: { value: string; label: string; hint: string; chip: string }[];
};

/** How long a choice stays highlighted before the next question. */
const ADVANCE_MS = 220;

export function SituationPicker({
  questions,
  paths,
  labels,
}: {
  questions: SituationQuestion[];
  /** The guide's page for each situation, by answersKey. */
  paths: Record<string, string>;
  labels: { label: string; progress: string; back: string; opening: string; footnote: string };
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<SituationQuestion["id"], string>>>({});
  const [opening, startOpening] = useTransition();
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Whether a choice was made: from then on, each question slides in and takes the focus.
  const [moved, setMoved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // After a choice, focus the next question, so a screen reader reads it. Not on the first render.
  useEffect(() => {
    if (moved) titleRef.current?.focus();
  }, [moved, step]);

  const question = questions[step];
  const last = step === questions.length - 1;

  // Both versions the last answer can open, loaded while it's being chosen.
  useEffect(() => {
    if (!last || !answers.relationship || !answers.location) return;
    for (const option of question.options) router.prefetch(paths[answersKey(answers.relationship, answers.location, option.value)]);
  }, [last, answers.relationship, answers.location, question.options, paths, router]);

  function go(to: number) {
    clearTimeout(timer.current);
    setMoved(true);
    setStep(to);
  }

  function choose(value: string) {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (!last) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => go(step + 1), ADVANCE_MS);
      return;
    }
    const path = paths[answersKey(next.relationship!, next.location!, next.lived!)];
    startOpening(() => router.push(path));
  }

  const answered = questions.slice(0, step).map((q, i) => ({
    index: i,
    chip: q.options.find((o) => o.value === answers[q.id])?.chip,
  }));

  return (
    <div className="relative rounded-3xl border border-line-200 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-teal-700">{labels.label}</p>
        <p className="text-sm text-slate-500" aria-hidden="true">
          {labels.progress.replace("{n}", String(step + 1)).replace("{total}", String(questions.length))}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden="true">
        {questions.map((q, i) => (
          <span key={q.id} className="h-1.5 overflow-hidden rounded-full bg-line-200">
            <span
              className={`block h-full rounded-full bg-teal-600 transition-[width] duration-300 ease-out ${
                i < step || (i === step && answers[q.id]) ? "w-full" : i === step ? "w-1/3" : "w-0"
              }`}
            />
          </span>
        ))}
      </div>

      {answered.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {answered.map(({ index, chip }) => (
            <li key={index}>
              <button
                type="button"
                onClick={() => go(index)}
                disabled={opening}
                className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700 hover:bg-sage-200"
              >
                <Icon name="check" className="size-3.5" strokeWidth={2.6} />
                {chip}
              </button>
            </li>
          ))}
        </ul>
      )}

      {opening ? (
        <div className="flex min-h-[248px] flex-col items-center justify-center gap-4 text-center" role="status">
          <span className="size-9 animate-spin rounded-full border-[3px] border-teal-100 border-t-teal-600" aria-hidden="true" />
          <p className="font-semibold text-navy-900">{labels.opening}</p>
        </div>
      ) : (
        <div key={question.id} className={`mt-5 ${moved ? "animate-rise" : ""}`} role="group" aria-labelledby={`situation-${question.id}`}>
          <h2
            ref={titleRef}
            id={`situation-${question.id}`}
            tabIndex={-1}
            className="font-display text-2xl leading-tight font-semibold text-balance text-navy-900 focus:outline-none sm:text-[26px]"
          >
            {question.title}
          </h2>
          <ul className="mt-5 grid gap-2.5">
            {question.options.map((option) => {
              const chosen = answers[question.id] === option.value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => choose(option.value)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border-[1.5px] px-4 py-3.5 text-start transition-colors sm:px-5 sm:py-4 ${
                      chosen
                        ? "border-teal-600 bg-teal-100/60"
                        : "border-line-200 hover:border-teal-600 hover:bg-sand-50"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        chosen ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 group-hover:border-teal-600"
                      }`}
                    >
                      {chosen && <Icon name="check" className="animate-pop size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-navy-900">{option.label}</span>
                      <span className="mt-0.5 block text-[15px] leading-6 text-slate-500">{option.hint}</span>
                    </span>
                    <Icon
                      name="chevron"
                      className="size-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600 rtl:group-hover:-translate-x-0.5"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-5 flex min-h-6 items-center justify-between gap-4 text-sm">
        {step > 0 && !opening ? (
          <button
            type="button"
            onClick={() => go(step - 1)}
            className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-navy-900"
          >
            <Icon name="arrow" className="size-4 rotate-180" />
            {labels.back}
          </button>
        ) : (
          <span />
        )}
        <span className="text-slate-500">{labels.footnote}</span>
      </div>
    </div>
  );
}
