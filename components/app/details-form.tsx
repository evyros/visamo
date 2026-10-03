"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  previewDetails,
  saveDetails,
  type DetailsError,
  type DetailsPreview,
} from "@/app/(app)/(main)/file/actions";
import type { Messages } from "@/i18n/messages";
import type { CaseDetails, PersonInput, RelationshipInput } from "@/lib/case-options";
import type { Stage } from "@/lib/stages";
import { Notice, SubmitButton } from "./auth-ui";
import {
  Choices,
  PersonFields,
  RelationshipFields,
  personErrors,
  personInput,
  relationshipErrors,
  relationshipInput,
  type Errors,
  type Option,
} from "./onboarding-wizard";
import type { PersonAnswers, RelationshipAnswers } from "./onboarding-state";
import { secondaryButton } from "./settings-ui";

// Editing a case's answers after onboarding, with onboarding's questions.
// One section shows at a time: both people's questions share field ids.
// Saving goes through a preview of what changes in the document list, since
// that's what uses one of the case's edits. When the changes change the
// couple's stages (lib/stages.ts), the preview asks where they are now.

type Labels = Messages["app"]["detailsPage"];
type Section = "couple" | "israeli" | "foreign";

function personAnswers(p: PersonInput): PersonAnswers {
  const foreign = !p.isIsraeli;
  return {
    name: p.name,
    gender: p.gender,
    isIsraeli: p.isIsraeli,
    previousMarriages: p.previousMarriages,
    israeliStatus: p.israeliStatus,
    residence: p.residence,
    nationality: p.nationality ?? "",
    bornInNationality: foreign ? p.birthCountry === p.nationality : null,
    birthCountry: p.birthCountry ?? "",
    livedElsewhere: foreign ? !!p.countriesLived?.length : null,
    countriesLived: p.countriesLived ?? [],
    location: p.location,
    nameChanged: p.nameChanged,
    hasChildren: p.hasChildren,
    childrenMoving: p.childrenMoving,
    otherParents: p.otherParents ?? [],
  };
}

function relationshipAnswers(r: RelationshipInput): RelationshipAnswers {
  return {
    relationship: r.relationship,
    marriagePlace: r.marriagePlace,
    marriageCountry: r.marriageCountry ?? "",
    livingTogether: r.livingTogether,
    togetherSince: r.togetherSince ? String(r.togetherSince) : "",
    childrenTogether: r.childrenTogether,
  };
}

export function DetailsForm({
  t,
  q,
  initial,
  selfIsIsraeli,
  sections,
  locked,
  countries,
  birthCountries,
  steps,
  started,
}: {
  t: Labels;
  /** Onboarding's questions and options. */
  q: Messages["app"]["onboarding"];
  initial: CaseDetails;
  /** Which person the user is, so the questions say "you" to them. */
  selfIsIsraeli: boolean;
  /** The sections' tab names. */
  sections: Record<Section, string>;
  /** Who each person is, shown and not editable. */
  locked: Record<"israeli" | "foreign", string[]>;
  countries: Option[];
  birthCountries: Option[];
  /** The stages' names. */
  steps: Record<Stage, string>;
  /** Past the first stage: where they are is where they were when it started. */
  started: boolean;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("couple");
  const [relationship, setRelationship] = useState(() => relationshipAnswers(initial.relationship));
  const [people, setPeople] = useState(() => ({
    israeli: personAnswers(initial.israeli),
    foreign: personAnswers(initial.foreign),
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [preview, setPreview] = useState<DetailsPreview>();
  const [stage, setStage] = useState<Stage | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const errorsOf = (s: Section): Errors =>
    s === "couple" ? relationshipErrors(relationship, q) : personErrors(people[s], q);
  const payload = () => ({
    relationship: relationshipInput(relationship),
    israeli: personInput(people.israeli),
    foreign: personInput(people.foreign),
  });
  const showError = (error: DetailsError) => setFormError(t.errors[error]);

  function go(next: Section) {
    setSection(next);
    setErrors({});
  }

  async function onReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);
    // The first section with a question left open, starting with this one.
    const order: Section[] = [section, ...(["couple", "israeli", "foreign"] as const).filter((s) => s !== section)];
    const wrong = order.find((s) => Object.keys(errorsOf(s)).length > 0);
    if (wrong) {
      const found = errorsOf(wrong);
      setSection(wrong);
      setErrors(found);
      // After the section renders.
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>(`[data-field="${Object.keys(found)[0]}"]`)?.focus(),
      );
      return;
    }
    setPending(true);
    const result = await previewDetails(payload());
    setPending(false);
    if ("error" in result) showError(result.error);
    else {
      setPreview(result);
      setStage(result.stage);
    }
  }

  async function onSave() {
    if (preview?.track && !stage) {
      showError("stage");
      return;
    }
    setPending(true);
    const result = await saveDetails(payload(), stage);
    if (result.error) {
      setPending(false);
      showError(result.error);
      return;
    }
    router.push("/file");
  }

  if (preview) {
    return (
      <section className="mt-8 rounded-card border border-line-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-navy-900">{t.previewTitle}</h2>
        <div className="mt-4 space-y-4 text-[15px] text-slate-700">
          {formError && <Notice>{formError}</Notice>}
          <p>{preview.unchanged ? t.unchanged : t.listNote}</p>
          {preview.track && (
            <Choices
              id="stage"
              legend={t.stageTitle}
              hint={t.stageNote}
              options={preview.track.map((s) => ({ value: s, label: steps[s] }))}
              value={stage}
              onChange={(s) => {
                setStage(s);
                setFormError(undefined);
              }}
            />
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!preview.unchanged && (
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-teal-600 px-5 text-[15px] font-semibold text-white shadow-soft hover:bg-teal-700 disabled:opacity-70"
            >
              {pending ? t.saving : t.save}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setPreview(undefined);
              setFormError(undefined);
            }}
            disabled={pending}
            className={secondaryButton}
          >
            {t.keepEditing}
          </button>
        </div>
      </section>
    );
  }

  const tabs: Section[] = ["couple", "israeli", "foreign"];
  const role = section === "couple" ? null : section;

  return (
    <form ref={formRef} noValidate onSubmit={onReview} className="mt-8 space-y-6">
      {/* Tabs, but plain buttons: every section is part of the one form. */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={section === s}
            onClick={() => go(s)}
            className={`rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
              section === s ? "bg-teal-100 text-teal-700" : "text-slate-600 ring-1 ring-line-200 hover:text-navy-900"
            }`}
          >
            {sections[s]}
          </button>
        ))}
      </div>

      {formError && <Notice>{formError}</Notice>}

      <div className="space-y-6 rounded-card border border-line-200 bg-white p-5 sm:p-6">
        {role && (
          <div className="rounded-[10px] bg-sand-50 px-4 py-3">
            <p className="font-semibold text-navy-900">{locked[role].join(" · ")}</p>
            <p className="mt-1 text-sm text-slate-600">{t.locked}</p>
          </div>
        )}
        {role ? (
          <PersonFields
            key={role}
            t={q}
            q={(role === "israeli") === selfIsIsraeli ? q.questions.self : q.questions.partner}
            countries={countries}
            birthCountries={birthCountries}
            person={people[role]}
            onChange={(key, value) => setPeople((p) => ({ ...p, [role]: { ...p[role], [key]: value } }))}
            errors={errors}
            setErrors={setErrors}
            autoComplete="off"
            lockIdentity
            startHint={started ? t.startHint : undefined}
          />
        ) : (
          <RelationshipFields
            t={q}
            countries={countries}
            answers={relationship}
            onChange={(key, value) => setRelationship((r) => ({ ...r, [key]: value }))}
            errors={errors}
          />
        )}
      </div>

      <SubmitButton pending={pending} pendingLabel={t.checking} className="sm:w-auto">
        {t.review}
      </SubmitButton>
    </form>
  );
}
