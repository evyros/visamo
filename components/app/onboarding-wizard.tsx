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
  RENEWAL,
  TOGETHER_SINCE_MIN,
  genders,
  israeliStatuses,
  locations,
  marriagePlaces,
  otherParents,
  previousMarriages,
  relationships,
  residences,
  type BranchCode,
  type CaseDetails,
  type IsraeliStatus,
  type OtherParent,
} from "@/lib/case-options";
import { onboardingTrack } from "@/lib/stages";
import { AuthHeading } from "./auth-heading";
import { Field, Notice, Select, SubmitButton, describe, inputClass } from "./auth-ui";
import {
  emptyRole,
  useOnboarding,
  type Answers,
  type PersonAnswers,
  type RelationshipAnswers,
} from "./onboarding-state";

// The onboarding steps, each at its own URL so the browser's back and
// forward buttons move between them. The answers live in OnboardingProvider
// until the last step sends them all to createCase, so leaving midway saves
// nothing.

type Labels = Messages["app"]["onboarding"];
export type Option<T extends string = string> = { value: T; label: string };

type FieldName =
  | keyof PersonAnswers
  | keyof RelationshipAnswers
  | "knowsBranch"
  | "branch"
  | "stage"
  | "form";
export type Errors = Partial<Record<FieldName, string>>;
type SetErrors = (update: (errors: Errors) => Errors) => void;

/** Matches onboardingPaths in lib/app-paths.ts. */
const STEPS = ["about", "partner", "relationship", "branch", "stage"] as const;
const RELATIONSHIP = STEPS.indexOf("relationship");
const BRANCH = STEPS.indexOf("branch");
const STAGE = STEPS.indexOf("stage");

function nameError(value: string, t: Labels) {
  const name = value.trim();
  if (!name) return t.errors.required;
  if (name.length < NAME_MIN) return t.errors.nameShort;
  if (name.length > NAME_MAX) return t.errors.nameLong;
}

/** The unanswered questions of one person's step, in the order they show. */
export function personErrors(person: PersonAnswers, t: Labels): Errors {
  const e: Errors = {};
  const name = nameError(person.name, t);
  if (name) e.name = name;
  if (!person.gender) e.gender = t.errors.choose;
  if (person.isIsraeli === null) e.israeliStatus = t.errors.choose;
  else if (person.isIsraeli) {
    if (!person.israeliStatus) e.israeliStatus = t.errors.choose;
    if (!person.residence) e.residence = t.errors.choose;
  } else {
    if (!person.nationality) e.nationality = t.errors.required;
    if (person.nationality && person.bornInNationality === null) e.bornInNationality = t.errors.choose;
    else if (person.bornInNationality === false && !person.birthCountry) e.birthCountry = t.errors.required;
    if (person.livedElsewhere === null) e.livedElsewhere = t.errors.choose;
    else if (person.livedElsewhere && person.countriesLived.some((c) => !c)) e.countriesLived = t.errors.required;
    if (!person.location) e.location = t.errors.choose;
    if (person.nameChanged === null) e.nameChanged = t.errors.choose;
  }
  if (!person.previousMarriages) e.previousMarriages = t.errors.choose;
  if (person.isIsraeli === false) {
    if (person.hasChildren === null) e.hasChildren = t.errors.choose;
    else if (person.hasChildren && person.childrenMoving === null) e.childrenMoving = t.errors.choose;
    else if (person.hasChildren && person.childrenMoving && !person.otherParents.length)
      e.otherParents = t.errors.choose;
  }
  return e;
}

export function relationshipErrors(r: RelationshipAnswers, t: Labels): Errors {
  const e: Errors = {};
  if (!r.relationship) e.relationship = t.errors.choose;
  else if (r.relationship === "married") {
    if (!r.marriagePlace) e.marriagePlace = t.errors.choose;
    else if (r.marriagePlace === "abroad" && !r.marriageCountry) e.marriageCountry = t.errors.required;
  }
  if (r.livingTogether === null) e.livingTogether = t.errors.choose;
  else if (r.livingTogether && !r.togetherSince) e.togetherSince = t.errors.required;
  if (r.childrenTogether === null) e.childrenTogether = t.errors.choose;
  return e;
}

/**
 * A person's answers as createCase expects them: only their role's
 * questions, and only the follow-ups that were asked.
 */
export function personInput(person: PersonAnswers) {
  const foreign = !person.isIsraeli;
  const moving = foreign && person.hasChildren ? person.childrenMoving : null;
  return {
    name: person.name.trim(),
    gender: person.gender,
    isIsraeli: person.isIsraeli,
    israeliStatus: foreign ? null : person.israeliStatus,
    previousMarriages: person.previousMarriages,
    nationality: foreign ? person.nationality : null,
    birthCountry: foreign ? (person.bornInNationality ? person.nationality : person.birthCountry) : null,
    countriesLived: foreign ? (person.livedElsewhere ? person.countriesLived : []) : null,
    location: foreign ? person.location : null,
    nameChanged: foreign ? person.nameChanged : null,
    hasChildren: foreign ? person.hasChildren : null,
    childrenMoving: moving,
    otherParents: moving ? person.otherParents : null,
    residence: foreign ? null : person.residence,
  };
}

export function relationshipInput(r: RelationshipAnswers) {
  const married = r.relationship === "married";
  return {
    relationship: r.relationship,
    marriagePlace: married ? r.marriagePlace : null,
    marriageCountry: married && r.marriagePlace === "abroad" ? r.marriageCountry : null,
    livingTogether: r.livingTogether,
    togetherSince: r.livingTogether ? Number(r.togetherSince) : null,
    childrenTogether: r.childrenTogether,
  };
}

/** Every step's answers by role, as the stage step reads them. Only called once they're all answered. */
function detailsOf(answers: Answers): CaseDetails {
  const self = personInput(answers.self) as CaseDetails["israeli"];
  const partner = personInput(answers.partner) as CaseDetails["israeli"];
  const [israeli, foreign] = self.isIsraeli ? [self, partner] : [partner, self];
  return { relationship: relationshipInput(answers.relationship) as CaseDetails["relationship"], israeli, foreign };
}

export function OnboardingWizard({
  t,
  countries,
  birthCountries,
  branches,
}: {
  t: Labels;
  /** Every country but Israel. */
  countries: Option[];
  /** Every country, Israel too. */
  birthCountries: Option[];
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
  const setRelationship = <K extends keyof RelationshipAnswers>(key: K, value: RelationshipAnswers[K]) =>
    setAnswers((a) => ({ ...a, relationship: { ...a.relationship, [key]: value } }));

  // Only the user says whether they're the Israeli side; the partner is the
  // other one, and says if they're a citizen or a resident on their own step.
  // Moving the user to the other side swaps the roles, so both people's role
  // questions start over, and the partner step has to be answered again
  // before the steps after it. Citizen to resident is no swap.
  function setOwnStatus(status: IsraeliStatus | "neither") {
    const isIsraeli = status !== "neither";
    const swap = answers.self.isIsraeli !== null && answers.self.isIsraeli !== isIsraeli;
    setAnswers((a) => ({
      ...a,
      self: { ...a.self, ...(swap ? emptyRole : {}), isIsraeli, israeliStatus: isIsraeli ? status : null },
      partner: { ...a.partner, ...(swap ? emptyRole : {}), isIsraeli: !isIsraeli },
    }));
    if (swap) setReached(0);
  }

  // The stages follow from the earlier steps, all answered by the stage step.
  // A stage chosen before going back and changing them may be gone.
  const offered = step === STAGE ? onboardingTrack(detailsOf(answers)) : [];

  function validate(): Errors {
    if (step === 0) return personErrors(answers.self, t);
    if (step === 1) return personErrors(answers.partner, t);
    if (step === RELATIONSHIP) return relationshipErrors(answers.relationship, t);
    if (step === BRANCH && answers.knowsBranch === null) return { knowsBranch: t.errors.choose };
    if (step === BRANCH && answers.knowsBranch && !answers.branch) return { branch: t.errors.choose };
    if (step === STAGE && !(answers.stage === RENEWAL || offered.some((s) => s === answers.stage))) {
      return { stage: t.errors.choose };
    }
    return {};
  }

  async function finish() {
    setPending(true);
    // Redirects into the app on success.
    const result = await createCase({
      self: personInput(answers.self),
      partner: personInput(answers.partner),
      relationship: relationshipInput(answers.relationship),
      branch: (answers.knowsBranch && answers.branch) || null,
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
    else finish();
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
  // Renewals aren't supported yet: the wizard stops there, with a notice.
  const renewal = step === STAGE && answers.stage === RENEWAL;
  // Continue stays off until every field in the step is answered.
  const complete = Object.keys(validate()).length === 0 && !renewal;

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
            q={t.questions.self}
            countries={countries}
            birthCountries={birthCountries}
            person={answers.self}
            onChange={(key, value) => setPerson("self", key, value)}
            onOwnStatus={setOwnStatus}
            errors={errors}
            setErrors={setErrors}
            autoComplete="name"
          />
        )}

        {step === 1 && (
          <PersonFields
            key="partner"
            t={t}
            q={t.questions.partner}
            countries={countries}
            birthCountries={birthCountries}
            person={answers.partner}
            onChange={(key, value) => setPerson("partner", key, value)}
            errors={errors}
            setErrors={setErrors}
            // Not the user's own name, so no autofill.
            autoComplete="off"
          />
        )}

        {step === RELATIONSHIP && (
          <RelationshipFields
            t={t}
            countries={countries}
            answers={answers.relationship}
            onChange={setRelationship}
            errors={errors}
          />
        )}

        {step === BRANCH && (
          <>
            <p className="text-[16px] text-slate-700">{t.branchIntro}</p>
            <Choices
              id="knowsBranch"
              legend={t.knowsBranch}
              error={errors.knowsBranch}
              options={[
                { value: "yes", label: t.knowsBranchOptions.yes },
                { value: "no", label: t.knowsBranchOptions.no },
              ]}
              value={answers.knowsBranch === null ? null : answers.knowsBranch ? "yes" : "no"}
              onChange={(v) => set("knowsBranch", v === "yes")}
              inline
            />
            {answers.knowsBranch && (
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
            )}
          </>
        )}

        {step === STAGE && (
          <Choices
            id="stage"
            legend={t.stageIntro}
            error={errors.stage}
            options={([...offered, RENEWAL] as const).map((s) => ({ value: s, label: t.stages[s] }))}
            value={answers.stage}
            onChange={(v) => set("stage", v)}
          />
        )}

        {renewal && <Notice tone="warning">{t.renewalUnsupported}</Notice>}

        <div className="space-y-3 pt-2">
          <SubmitButton
            pending={pending}
            pendingLabel={t.creating}
            disabled={pending || !complete}
            aria-disabled={pending || !complete}
          >
            {last ? t.finish : t.next}
          </SubmitButton>
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

/**
 * The questions about one person: the user in the first step, their partner
 * in the second. Which ones show depends on whether the person is the
 * Israeli or the foreign partner. Editing an existing case (lockIdentity)
 * leaves out who the person is: name, gender, status, nationality and birth.
 */
export function PersonFields({
  t,
  q,
  countries,
  birthCountries,
  person,
  onChange,
  onOwnStatus,
  errors,
  setErrors,
  autoComplete,
  lockIdentity = false,
  startHint,
}: {
  t: Labels;
  /** The questions worded for this person. */
  q: Labels["questions"]["self"];
  countries: Option[];
  birthCountries: Option[];
  person: PersonAnswers;
  onChange: <K extends keyof PersonAnswers>(key: K, value: PersonAnswers[K]) => void;
  /** Given for the user only, who answers for both sides. The partner is asked only their status. */
  onOwnStatus?: (status: IsraeliStatus | "neither") => void;
  errors: Errors;
  setErrors: SetErrors;
  autoComplete: string;
  lockIdentity?: boolean;
  /** Once the process started, where they are is where they were then: the stage records a move since (lib/stages.ts). */
  startHint?: string;
}) {
  const foreign = person.isIsraeli === false;
  const identity = !lockIdentity;
  return (
    <>
      {identity && (
        <>
          <Field id="name" label={q.name} error={errors.name}>
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
          {onOwnStatus ? (
            <Choices
              id="israeliStatus"
              legend={q.israeliStatus}
              hint={t.israeliHint}
              error={errors.israeliStatus}
              options={[...israeliStatuses, "neither" as const].map((s) => ({ value: s, label: t.israeliStatuses[s] }))}
              value={person.isIsraeli === null ? null : (person.israeliStatus ?? "neither")}
              onChange={onOwnStatus}
              inline
            />
          ) : (
            person.isIsraeli && (
              <Choices
                id="israeliStatus"
                legend={q.israeliStatus}
                error={errors.israeliStatus}
                options={israeliStatuses.map((s) => ({ value: s, label: t.israeliStatuses[s] }))}
                value={person.israeliStatus}
                onChange={(v) => onChange("israeliStatus", v)}
                inline
              />
            )
          )}
        </>
      )}

      {person.isIsraeli && (
        <Choices
          id="residence"
          legend={q.residence}
          hint={startHint ? `${t.residenceHint} ${startHint}` : t.residenceHint}
          error={errors.residence}
          options={residences.map((r) => ({ value: r, label: t.residences[r] }))}
          value={person.residence}
          onChange={(v) => onChange("residence", v)}
          inline
        />
      )}

      {foreign && identity && (
        <>
          <CountrySelect
            id="nationality"
            t={t}
            label={q.nationality}
            error={errors.nationality}
            options={countries}
            value={person.nationality}
            onChange={(v) => {
              onChange("nationality", v);
              // "Other countries" means besides this one.
              onChange("countriesLived", person.countriesLived.filter((c) => c !== v));
              // A "No, born elsewhere" can't name the new nationality. A "Yes" now means the new one.
              if (person.birthCountry === v) onChange("birthCountry", "");
            }}
          />
          {/* Most are born in their country of nationality: one tap, and the list only for the rest. */}
          {person.nationality && (
            <YesNo
              id="bornInNationality"
              t={t}
              legend={format(q.bornInNationality, {
                country: countries.find((c) => c.value === person.nationality)?.label ?? "",
              })}
              hint={t.bornInNationalityHint}
              error={errors.bornInNationality}
              value={person.bornInNationality}
              onChange={(v) => onChange("bornInNationality", v)}
            />
          )}
          {person.nationality && person.bornInNationality === false && (
            <CountrySelect
              id="birthCountry"
              t={t}
              label={q.birthCountry}
              error={errors.birthCountry}
              options={birthCountries.filter((c) => c.value !== person.nationality)}
              value={person.birthCountry}
              onChange={(v) => onChange("birthCountry", v)}
            />
          )}
        </>
      )}

      {foreign && (
        <>
          <YesNo
            id="livedElsewhere"
            t={t}
            legend={q.countriesLived}
            hint={t.countriesLivedHint}
            error={errors.livedElsewhere}
            value={person.livedElsewhere}
            onChange={(v) => {
              onChange("livedElsewhere", v);
              if (v && !person.countriesLived.length) onChange("countriesLived", [""]);
            }}
          />
          {person.livedElsewhere && (
            <CountryList
              t={t}
              error={errors.countriesLived}
              // Not the nationality: the question is about other countries.
              options={countries.filter((c) => c.value !== person.nationality)}
              values={person.countriesLived}
              onChange={(v) => onChange("countriesLived", v)}
            />
          )}
          <Choices
            id="location"
            legend={q.location}
            hint={startHint}
            error={errors.location}
            options={locations.map((l) => ({ value: l, label: t.locations[l] }))}
            value={person.location}
            onChange={(v) => onChange("location", v)}
          />
          {person.location === "israelInvalid" && <Notice tone="warning">{t.withoutVisaNotice}</Notice>}
          <YesNo
            id="nameChanged"
            t={t}
            legend={q.nameChanged}
            hint={t.nameChangedHint}
            error={errors.nameChanged}
            value={person.nameChanged}
            onChange={(v) => onChange("nameChanged", v)}
          />
        </>
      )}

      {person.isIsraeli !== null && (
        <Choices
          id="previousMarriages"
          legend={q.previousMarriages}
          error={errors.previousMarriages}
          options={previousMarriages.map((m) => ({ value: m, label: t.previousMarriageOptions[m] }))}
          value={person.previousMarriages}
          onChange={(v) => onChange("previousMarriages", v)}
        />
      )}

      {foreign && (
        <>
          <YesNo
            id="hasChildren"
            t={t}
            legend={q.hasChildren}
            error={errors.hasChildren}
            value={person.hasChildren}
            onChange={(v) => onChange("hasChildren", v)}
          />
          {person.hasChildren && (
            <YesNo
              id="childrenMoving"
              t={t}
              legend={t.childrenMoving}
              error={errors.childrenMoving}
              value={person.childrenMoving}
              onChange={(v) => onChange("childrenMoving", v)}
            />
          )}
          {person.hasChildren && person.childrenMoving && (
            <Checks
              id="otherParents"
              legend={t.otherParents}
              hint={t.otherParentsHint}
              error={errors.otherParents}
              options={otherParents.map((o) => ({ value: o, label: t.otherParentOptions[o] }))}
              values={person.otherParents}
              onChange={(v: OtherParent[]) => onChange("otherParents", v)}
            />
          )}
        </>
      )}
    </>
  );
}

/** The questions about the couple together. */
export function RelationshipFields({
  t,
  countries,
  answers,
  onChange,
  errors,
}: {
  t: Labels;
  countries: Option[];
  answers: RelationshipAnswers;
  onChange: <K extends keyof RelationshipAnswers>(key: K, value: RelationshipAnswers[K]) => void;
  errors: Errors;
}) {
  // Newest first: most couples moved in recently.
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - TOGETHER_SINCE_MIN + 1 }, (_, i) => String(thisYear - i));
  return (
    <>
      <Choices
        id="relationship"
        legend={t.relationship}
        error={errors.relationship}
        options={relationships.map((r) => ({ value: r, label: t.relationships[r] }))}
        value={answers.relationship}
        onChange={(v) => onChange("relationship", v)}
      />
      {answers.relationship === "married" && (
        <Choices
          id="marriagePlace"
          legend={t.marriagePlace}
          error={errors.marriagePlace}
          options={marriagePlaces.map((p) => ({ value: p, label: t.marriagePlaces[p] }))}
          value={answers.marriagePlace}
          onChange={(v) => onChange("marriagePlace", v)}
        />
      )}
      {answers.relationship === "married" && answers.marriagePlace === "abroad" && (
        <CountrySelect
          id="marriageCountry"
          t={t}
          label={t.marriageCountry}
          error={errors.marriageCountry}
          options={countries}
          value={answers.marriageCountry}
          onChange={(v) => onChange("marriageCountry", v)}
        />
      )}
      {answers.relationship && (
        <YesNo
          id="livingTogether"
          t={t}
          legend={t.livingTogether}
          error={errors.livingTogether}
          value={answers.livingTogether}
          onChange={(v) => onChange("livingTogether", v)}
        />
      )}
      {answers.relationship && answers.livingTogether && (
        <Field id="togetherSince" label={t.togetherSince} error={errors.togetherSince}>
          <Select
            id="togetherSince"
            name="togetherSince"
            data-field="togetherSince"
            value={answers.togetherSince}
            onChange={(e) => onChange("togetherSince", e.target.value)}
            {...describe("togetherSince", errors.togetherSince)}
          >
            <option value="" disabled>
              {t.yearPlaceholder}
            </option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <YesNo
        id="childrenTogether"
        t={t}
        legend={t.childrenTogether}
        error={errors.childrenTogether}
        value={answers.childrenTogether}
        onChange={(v) => onChange("childrenTogether", v)}
      />
    </>
  );
}

function CountrySelect({
  id,
  t,
  label,
  hint,
  error,
  options,
  value,
  onChange,
}: {
  id: string;
  t: Labels;
  label: string;
  hint?: string;
  error?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <Select
        id={id}
        name={id}
        data-field={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...describe(id, error, !!hint)}
      >
        <option value="" disabled>
          {t.countryPlaceholder}
        </option>
        {options.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/** Other countries lived in: one select per country, and a button for another. */
function CountryList({
  t,
  error,
  options,
  values,
  onChange,
}: {
  t: Labels;
  error?: string;
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const replace = (i: number, value: string) => onChange(values.map((v, j) => (j === i ? value : v)));
  return (
    <div className="space-y-2">
      {values.map((value, i) => {
        const label = format(t.country, { number: i + 1 });
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 [&>div]:mt-0">
              <Select
                name={`countriesLived-${i}`}
                aria-label={label}
                // Error focus lands on the first row not chosen yet.
                data-field={i === values.findIndex((v) => !v) ? "countriesLived" : undefined}
                value={value}
                onChange={(e) => replace(i, e.target.value)}
                aria-invalid={!!error && !value}
                aria-describedby={error && !value ? "countriesLived-error" : undefined}
              >
                <option value="" disabled>
                  {t.countryPlaceholder}
                </option>
                {/* Each country once: not the ones chosen in other rows. */}
                {options
                  .filter((c) => c.value === value || !values.includes(c.value))
                  .map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
              </Select>
            </div>
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                aria-label={format(t.removeCountryLabel, { number: i + 1 })}
                className="px-2 text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline"
              >
                {t.removeCountry}
              </button>
            )}
          </div>
        );
      })}
      {error && (
        <p id="countriesLived-error" className="text-sm font-medium text-terracotta-600">
          {error}
        </p>
      )}
      {values.every(Boolean) && (
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          {t.addCountry}
        </button>
      )}
    </div>
  );
}

/** A yes / no question, answered as a boolean. */
function YesNo({
  id,
  t,
  legend,
  hint,
  error,
  value,
  onChange,
}: {
  id: string;
  t: Labels;
  legend: string;
  hint?: string;
  error?: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <Choices
      id={id}
      legend={legend}
      hint={hint}
      error={error}
      options={[
        { value: "yes", label: t.yes },
        { value: "no", label: t.no },
      ]}
      value={value === null ? null : value ? "yes" : "no"}
      onChange={(v) => onChange(v === "yes")}
      inline
    />
  );
}

const cardClass =
  "flex cursor-pointer items-center gap-3 rounded-[10px] border border-line-200 bg-white px-3.5 py-3 text-[16px] text-navy-900 transition has-checked:border-teal-600 has-checked:bg-teal-100/50 has-focus-visible:ring-2 has-focus-visible:ring-teal-600/40";

// Spelled out so Tailwind finds the class names.
const gridColumns = { 1: "", 2: "grid-cols-2", 3: "grid-cols-3" };

/** The frame around a group of cards: the question, then the cards, then the hint or error. */
function CardGroup({
  id,
  legend,
  hint,
  error,
  columns = 1,
  children,
}: {
  id: string;
  legend: ReactNode;
  hint?: string;
  error?: string;
  columns?: 1 | 2 | 3;
  children: ReactNode;
}) {
  return (
    <fieldset aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}>
      <legend className="text-[15px] font-semibold text-navy-900">{legend}</legend>
      <div className={`mt-2 grid gap-2 ${gridColumns[columns]}`}>{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-terracotta-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-slate-600">
            {hint}
          </p>
        )
      )}
    </fieldset>
  );
}

/** A radio group drawn as selectable cards. */
export function Choices<T extends string>({
  id,
  legend,
  hint,
  error,
  options,
  value,
  onChange,
  inline = false,
}: {
  id: string;
  legend: ReactNode;
  hint?: string;
  error?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Side by side, for short labels like Yes / No. Up to three options. */
  inline?: boolean;
}) {
  return (
    <CardGroup id={id} legend={legend} hint={hint} error={error} columns={inline ? (options.length === 3 ? 3 : 2) : 1}>
      {options.map((option, i) => (
        <label key={option.value} className={cardClass}>
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
    </CardGroup>
  );
}

/** Like Choices, but any number of the options can be chosen. */
function Checks<T extends string>({
  id,
  legend,
  hint,
  error,
  options,
  values,
  onChange,
}: {
  id: string;
  legend: ReactNode;
  hint?: string;
  error?: string;
  options: Option<T>[];
  values: T[];
  onChange: (values: T[]) => void;
}) {
  return (
    <CardGroup id={id} legend={legend} hint={hint} error={error}>
      {options.map((option, i) => (
        <label key={option.value} className={cardClass}>
          <input
            type="checkbox"
            name={id}
            value={option.value}
            checked={values.includes(option.value)}
            onChange={(e) => {
              const on = (v: T) => (v === option.value ? e.target.checked : values.includes(v));
              // Kept in the options' order.
              onChange(options.map((o) => o.value).filter(on));
            }}
            data-field={i === 0 ? id : undefined}
            className="size-4 shrink-0 rounded accent-teal-600"
          />
          {option.label}
        </label>
      ))}
    </CardGroup>
  );
}
