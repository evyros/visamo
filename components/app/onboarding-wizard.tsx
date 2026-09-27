"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createCase } from "@/app/(app)/(onboarding)/onboarding/actions";
import type { Messages } from "@/i18n/messages";
import { format } from "@/i18n/messages";
import {
  NAME_MAX,
  NAME_MIN,
  genders,
  maritalStatuses,
  stages,
  type BranchCode,
  type Gender,
  type MaritalStatus,
  type Stage,
} from "@/lib/case-options";
import { Field, Notice, Select, SubmitButton, describe, inputClass } from "./auth-ui";

// The three onboarding steps. Answers stay in this component until the last
// step sends them all to createCase, so leaving midway saves nothing.

type Labels = Messages["app"]["onboarding"];
type Option<T extends string = string> = { value: T; label: string };

type Answers = {
  name: string;
  gender: Gender | null;
  isIsraeli: boolean | null;
  nationality: string;
  maritalStatus: MaritalStatus | null;
  hasChildren: boolean;
  branch: BranchCode | "";
  stage: Stage | null;
};

type Errors = Partial<Record<"name" | "gender" | "isIsraeli" | "nationality" | "maritalStatus" | "branch" | "stage" | "form", string>>;

const STEPS = ["about", "branch", "stage"] as const;

export function OnboardingWizard({
  t,
  countries,
  branches,
}: {
  t: Labels;
  countries: Option[];
  branches: Option<BranchCode>[];
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    name: "",
    gender: null,
    isIsraeli: null,
    nationality: "",
    maritalStatus: null,
    hasChildren: false,
    branch: "",
    stage: null,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const moved = useRef(false);

  // A new step replaces the form's content; move focus to its heading so it's
  // announced. Not on first render, where the page heading comes first.
  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
    moved.current = true;
  }, [step]);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [key]: value }));

  function nameError(value: string) {
    const name = value.trim();
    if (!name) return t.errors.required;
    if (name.length < NAME_MIN) return t.errors.nameShort;
    if (name.length > NAME_MAX) return t.errors.nameLong;
  }

  function validate(): Errors {
    const e: Errors = {};
    if (step === 0) {
      const name = nameError(answers.name);
      if (name) e.name = name;
      if (!answers.gender) e.gender = t.errors.choose;
      if (answers.isIsraeli === null) e.isIsraeli = t.errors.choose;
      else if (!answers.isIsraeli && !answers.nationality) e.nationality = t.errors.required;
      if (!answers.maritalStatus) e.maritalStatus = t.errors.choose;
    }
    if (step === 1 && !answers.branch) e.branch = t.errors.choose;
    if (step === 2 && !answers.stage) e.stage = t.errors.choose;
    return e;
  }

  async function finish(branch: BranchCode | null) {
    setPending(true);
    // Redirects into the app on success.
    const result = await createCase({
      name: answers.name.trim(),
      gender: answers.gender,
      isIsraeli: answers.isIsraeli,
      nationality: answers.isIsraeli ? null : answers.nationality,
      maritalStatus: answers.maritalStatus,
      hasChildren: answers.isIsraeli ? null : answers.hasChildren,
      branch,
      stage: answers.stage,
    });
    if (result?.error) setErrors({ form: t.errors[result.error] });
    setPending(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish(answers.branch || null);
  }

  function go(to: number) {
    setErrors({});
    setStep(to);
  }

  const last = step === STEPS.length - 1;
  // Continue stays off until every field in the step is answered.
  const complete = Object.keys(validate()).length === 0;

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-teal-700">
          {format(t.stepOf, { current: step + 1, total: STEPS.length })}
        </p>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-teal-600" : "bg-line-200"}`} />
          ))}
        </div>
        <h2 ref={headingRef} tabIndex={-1} className="mt-5 text-xl font-semibold text-navy-900 outline-none">
          {t.steps[STEPS[step]]}
        </h2>
      </div>

      {errors.form && <Notice>{errors.form}</Notice>}

      {step === 0 && (
        <>
          <Field id="name" label={t.name} error={errors.name}>
            <input
              id="name"
              name="name"
              data-field="name"
              autoComplete="name"
              maxLength={NAME_MAX}
              value={answers.name}
              onChange={(e) => {
                set("name", e.target.value);
                // Clear a shown error as soon as the name is fixed.
                if (errors.name && !nameError(e.target.value)) setErrors((x) => ({ ...x, name: undefined }));
              }}
              // Continue stays off while the name is too short; say why once the user moves on.
              onBlur={(e) => {
                const error = e.target.value ? nameError(e.target.value) : undefined;
                setErrors((x) => ({ ...x, name: error }));
              }}
              className={inputClass}
              {...describe("name", errors.name)}
            />
          </Field>
          <Choices
            id="gender"
            legend={t.gender}
            error={errors.gender}
            options={genders.map((g) => ({ value: g, label: t.genders[g] }))}
            value={answers.gender}
            onChange={(v) => set("gender", v)}
            inline
          />
          <Choices
            id="isIsraeli"
            legend={t.israeli}
            error={errors.isIsraeli}
            options={[
              { value: "yes", label: t.yes },
              { value: "no", label: t.no },
            ]}
            value={answers.isIsraeli === null ? null : answers.isIsraeli ? "yes" : "no"}
            onChange={(v) => set("isIsraeli", v === "yes")}
            inline
          />
          {answers.isIsraeli === false && (
            <Field id="nationality" label={t.nationality} error={errors.nationality}>
              <Select
                id="nationality"
                name="nationality"
                data-field="nationality"
                value={answers.nationality}
                onChange={(e) => set("nationality", e.target.value)}
                {...describe("nationality", errors.nationality)}
              >
                <option value="" disabled>
                  {t.nationalityPlaceholder}
                </option>
                {countries.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field
            id="maritalStatus"
            label={answers.isIsraeli ? t.maritalStatusIsraeli : t.maritalStatus}
            error={errors.maritalStatus}
          >
            <Select
              id="maritalStatus"
              name="maritalStatus"
              data-field="maritalStatus"
              value={answers.maritalStatus ?? ""}
              onChange={(e) => set("maritalStatus", e.target.value as MaritalStatus)}
              {...describe("maritalStatus", errors.maritalStatus)}
            >
              <option value="" disabled>
                {t.maritalStatusPlaceholder}
              </option>
              {maritalStatuses.map((m) => (
                <option key={m} value={m}>
                  {t.maritalStatuses[m]}
                </option>
              ))}
            </Select>
          </Field>
          {answers.isIsraeli === false && (
            <label className="flex items-center gap-3 text-[16px] text-navy-900">
              <input
                type="checkbox"
                name="hasChildren"
                checked={answers.hasChildren}
                onChange={(e) => set("hasChildren", e.target.checked)}
                className="size-5 accent-teal-600"
              />
              {t.hasChildren}
            </label>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <p className="text-[16px] text-slate-700">{t.branchIntro}</p>
          <Field id="branch" label={t.branch} error={errors.branch}>
            <Select
              id="branch"
              name="branch"
              data-field="branch"
              value={answers.branch}
              onChange={(e) => set("branch", e.target.value as BranchCode)}
              {...describe("branch", errors.branch)}
            >
              <option value="" disabled>
                {t.branchPlaceholder}
              </option>
              {branches.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}

      {step === 2 && (
        <Choices
          id="stage"
          legend={t.stageIntro}
          error={errors.stage}
          options={stages.map((s) => ({ value: s, label: t.stages[s] }))}
          value={answers.stage}
          onChange={(v) => set("stage", v)}
        />
      )}

      <div className="space-y-3 pt-2">
        <SubmitButton
          pending={pending}
          pendingLabel={t.creating}
          disabled={pending || !complete}
          aria-disabled={pending || !complete}
        >
          {last ? t.finish : t.next}
        </SubmitButton>
        {step === 1 && (
          <button
            type="button"
            onClick={() => {
              set("branch", "");
              go(2);
            }}
            className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border-[1.5px] border-navy-900 px-6 text-base font-semibold text-navy-900 transition-colors hover:bg-navy-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
          >
            {t.skip}
          </button>
        )}
        {step > 0 && (
          <button
            type="button"
            onClick={() => go(step - 1)}
            disabled={pending}
            className="text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline"
          >
            {t.back}
          </button>
        )}
      </div>
    </form>
  );
}

/** A radio group drawn as selectable cards. */
function Choices<T extends string>({
  id,
  legend,
  error,
  options,
  value,
  onChange,
  inline = false,
}: {
  id: string;
  legend: ReactNode;
  error?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Side by side, for short labels like Yes / No. */
  inline?: boolean;
}) {
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="text-[15px] font-semibold text-navy-900">{legend}</legend>
      <div className={`mt-2 grid gap-2 ${inline ? "grid-cols-2" : ""}`}>
        {options.map((option, i) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-line-200 px-3.5 py-3 text-[16px] text-navy-900 transition has-checked:border-teal-600 has-checked:bg-teal-100/50 has-focus-visible:ring-2 has-focus-visible:ring-teal-600/40"
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              // Error focus lands on the first option.
              data-field={i === 0 ? id : undefined}
              className="size-4 shrink-0 accent-teal-600"
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-terracotta-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
