"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createCase } from "@/app/(app)/(onboarding)/onboarding/actions";
import type { Messages } from "@/i18n/messages";
import { format } from "@/i18n/messages";
import { onboardingPaths } from "@/lib/app-paths";
import {
  NAME_MAX,
  NAME_MIN,
  genders,
  maritalStatuses,
  stages,
  type BranchCode,
  type MaritalStatus,
} from "@/lib/case-options";
import { AuthHeading } from "./auth-heading";
import { Field, Notice, Select, SubmitButton, describe, inputClass } from "./auth-ui";
import { useOnboarding, type Answers, type PersonAnswers } from "./onboarding-state";

// The onboarding steps, each at its own URL so the browser's back and
// forward buttons move between them. The answers live in OnboardingProvider
// until the last step sends them all to createCase, so leaving midway saves
// nothing.

type Labels = Messages["app"]["onboarding"];
type Option<T extends string = string> = { value: T; label: string };

type Errors = Partial<Record<"name" | "gender" | "isIsraeli" | "nationality" | "maritalStatus" | "branch" | "stage" | "form", string>>;
type SetErrors = (update: (errors: Errors) => Errors) => void;

/** Matches onboardingPaths in lib/app-paths.ts. */
const STEPS = ["about", "partner", "branch", "stage"] as const;
const BRANCH = STEPS.indexOf("branch");
const STAGE = STEPS.indexOf("stage");

function nameError(value: string, t: Labels) {
  const name = value.trim();
  if (!name) return t.errors.required;
  if (name.length < NAME_MIN) return t.errors.nameShort;
  if (name.length > NAME_MAX) return t.errors.nameLong;
}

function personErrors(person: PersonAnswers, t: Labels): Errors {
  const e: Errors = {};
  const name = nameError(person.name, t);
  if (name) e.name = name;
  if (!person.gender) e.gender = t.errors.choose;
  if (person.isIsraeli === null) e.isIsraeli = t.errors.choose;
  else if (!person.isIsraeli && !person.nationality) e.nationality = t.errors.required;
  if (!person.maritalStatus) e.maritalStatus = t.errors.choose;
  return e;
}

/** A person's answers as createCase expects them. */
function personInput(person: PersonAnswers) {
  return {
    name: person.name.trim(),
    gender: person.gender,
    isIsraeli: person.isIsraeli,
    nationality: person.isIsraeli ? null : person.nationality,
    maritalStatus: person.maritalStatus,
    hasChildren: person.isIsraeli ? null : person.hasChildren,
  };
}

export function OnboardingWizard({
  t,
  countries,
  branches,
}: {
  t: Labels;
  countries: Option[];
  branches: Option<BranchCode>[];
}) {
  const step = Math.max(0, onboardingPaths.indexOf(usePathname()));
  const { answers, setAnswers, reached, setReached } = useOnboarding();
  // A step the user hasn't reached yet: a refresh or a pasted link past step 1.
  const ahead = step > reached;
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

  // Start over from the first step. The answers from before are gone.
  useEffect(() => {
    if (ahead) window.history.replaceState(null, "", onboardingPaths[0]);
  }, [ahead]);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers((a) => ({ ...a, [key]: value }));
  const setPerson = <K extends keyof PersonAnswers>(who: "self" | "partner", key: K, value: PersonAnswers[K]) =>
    setAnswers((a) => ({ ...a, [who]: { ...a[who], [key]: value } }));

  function validate(): Errors {
    if (step === 0) return personErrors(answers.self, t);
    if (step === 1) return personErrors(answers.partner, t);
    if (step === BRANCH && !answers.branch) return { branch: t.errors.choose };
    if (step === STAGE && !answers.stage) return { stage: t.errors.choose };
    return {};
  }

  async function finish(branch: BranchCode | null) {
    setPending(true);
    // Redirects into the app on success.
    const result = await createCase({
      self: personInput(answers.self),
      partner: personInput(answers.partner),
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
    if (step < STEPS.length - 1) forward(step + 1);
    else finish(answers.branch || null);
  }

  function forward(to: number) {
    setErrors({});
    setReached((r) => Math.max(r, to));
    window.history.pushState(null, "", onboardingPaths[to]);
  }

  function back() {
    setErrors({});
    // Steps are only reached in order, so the previous history entry is the previous step.
    window.history.back();
  }

  if (ahead) return null;

  const last = step === STEPS.length - 1;
  // Continue stays off until every field in the step is answered.
  const complete = Object.keys(validate()).length === 0;

  // The page title and intro show on the first step only. After that the step
  // name is the page's main heading.
  const StepHeading = step === 0 ? "h2" : "h1";

  return (
    <>
      {step === 0 && <AuthHeading title={t.title}>{t.intro}</AuthHeading>}
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
          <StepHeading ref={headingRef} tabIndex={-1} className="mt-5 text-xl font-semibold text-navy-900 outline-none">
            {t.steps[STEPS[step]]}
          </StepHeading>
        </div>

        {errors.form && <Notice>{errors.form}</Notice>}

        {step === 0 && (
          <PersonFields
            key="self"
            t={t}
            countries={countries}
            person={answers.self}
            onChange={(key, value) => setPerson("self", key, value)}
            errors={errors}
            setErrors={setErrors}
            labels={{
              israeli: t.israeli,
              nationality: t.nationality,
              maritalStatus: t.maritalStatus,
              maritalStatusIsraeli: t.maritalStatusIsraeli,
              hasChildren: t.hasChildren,
            }}
            autoComplete="name"
          />
        )}

        {step === 1 && (
          <PersonFields
            key="partner"
            t={t}
            countries={countries}
            person={answers.partner}
            onChange={(key, value) => setPerson("partner", key, value)}
            errors={errors}
            setErrors={setErrors}
            labels={{
              israeli: t.partnerIsraeli,
              nationality: t.partnerNationality,
              maritalStatus: t.partnerMaritalStatus,
              maritalStatusIsraeli: t.partnerMaritalStatusIsraeli,
              hasChildren: t.partnerHasChildren,
            }}
            // Not the user's own name, so no autofill.
            autoComplete="off"
          />
        )}

        {step === BRANCH && (
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

        {step === STAGE && (
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
          {step === BRANCH && (
            <button
              type="button"
              onClick={() => {
                set("branch", "");
                forward(STAGE);
              }}
              className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border-[1.5px] border-navy-900 px-6 text-base font-semibold text-navy-900 transition-colors hover:bg-navy-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900"
            >
              {t.skip}
            </button>
          )}
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              disabled={pending}
              className="text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline"
            >
              {t.back}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

/** The questions about one person: the user in the first step, their partner in the second. */
function PersonFields({
  t,
  countries,
  person,
  onChange,
  errors,
  setErrors,
  labels,
  autoComplete,
}: {
  t: Labels;
  countries: Option[];
  person: PersonAnswers;
  onChange: <K extends keyof PersonAnswers>(key: K, value: PersonAnswers[K]) => void;
  errors: Errors;
  setErrors: SetErrors;
  /** The questions worded for this person. */
  labels: { israeli: string; nationality: string; maritalStatus: string; maritalStatusIsraeli: string; hasChildren: string };
  autoComplete: string;
}) {
  return (
    <>
      <Field id="name" label={t.name} error={errors.name}>
        <input
          id="name"
          name="name"
          data-field="name"
          autoComplete={autoComplete}
          maxLength={NAME_MAX}
          value={person.name}
          onChange={(e) => {
            onChange("name", e.target.value);
            // Clear a shown error as soon as the name is fixed.
            if (errors.name && !nameError(e.target.value, t)) setErrors((x) => ({ ...x, name: undefined }));
          }}
          // Continue stays off while the name is too short; say why once the user moves on.
          onBlur={(e) => {
            const error = e.target.value ? nameError(e.target.value, t) : undefined;
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
        value={person.gender}
        onChange={(v) => onChange("gender", v)}
        inline
      />
      <Choices
        id="isIsraeli"
        legend={labels.israeli}
        error={errors.isIsraeli}
        options={[
          { value: "yes", label: t.yes },
          { value: "no", label: t.no },
        ]}
        value={person.isIsraeli === null ? null : person.isIsraeli ? "yes" : "no"}
        onChange={(v) => onChange("isIsraeli", v === "yes")}
        inline
      />
      {person.isIsraeli === false && (
        <Field id="nationality" label={labels.nationality} error={errors.nationality}>
          <Select
            id="nationality"
            name="nationality"
            data-field="nationality"
            value={person.nationality}
            onChange={(e) => onChange("nationality", e.target.value)}
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
        label={person.isIsraeli ? labels.maritalStatusIsraeli : labels.maritalStatus}
        error={errors.maritalStatus}
      >
        <Select
          id="maritalStatus"
          name="maritalStatus"
          data-field="maritalStatus"
          value={person.maritalStatus ?? ""}
          onChange={(e) => onChange("maritalStatus", e.target.value as MaritalStatus)}
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
      {person.isIsraeli === false && (
        <label className="flex items-center gap-3 text-[16px] text-navy-900">
          <input
            type="checkbox"
            name="hasChildren"
            checked={person.hasChildren}
            onChange={(e) => onChange("hasChildren", e.target.checked)}
            className="size-5 accent-teal-600"
          />
          {labels.hasChildren}
        </label>
      )}
    </>
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
            className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-line-200 bg-white px-3.5 py-3 text-[16px] text-navy-900 transition has-checked:border-teal-600 has-checked:bg-teal-100/50 has-focus-visible:ring-2 has-focus-visible:ring-teal-600/40"
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
