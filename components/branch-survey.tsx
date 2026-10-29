"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { resendCode, submitVote, verifyVote } from "@/app/[lang]/branches/survey/actions";
import { stageIds, type Plural, type StageId, type SurveyTexts } from "@/content/branches";
import { locales, type Locale } from "@/i18n/config";
import {
  COMMENT_MAX,
  SINCE,
  filedError,
  satisfactionChoices,
  stageWaitError,
  surveyMonth,
  waitSteps,
  type Satisfaction,
  type SurveyStageAnswer,
} from "@/lib/branch-report-options";
import { isEmail } from "@/lib/letters/rules";
import { Icon } from "./icons";
import { ErrorNote, Field, Select, describe, inputClass, primaryButton } from "./letters/fields";
import { Turnstile } from "./turnstile";
import { WaitSlider } from "./wait-slider";

// The branches survey (/branches/survey): a branch, the month they filed
// online and how long after it each stage came (or that they're still
// waiting), how it went, an optional note, and their email.
// The vote counts once the code we email is entered here, or through the
// email's link, which opens this page with ?vote=&code= and enters it. A link
// with ?branch= chooses that branch. The page reads those and passes them in
// as `initial`.

/** A stage's answer: whether they tell us about it, the slider's stop (null until it's moved), and "still waiting". */
type StageAnswer = { on: boolean; step: number | null; waiting: boolean };
type FieldError = "branch" | "filed" | "satisfaction" | "email" | "consent" | `${StageId}-wait`;

const blankStages = () =>
  Object.fromEntries(stageIds.map((id) => [id, { on: false, step: null, waiting: false }])) as Record<StageId, StageAnswer>;

/** Today, in the browser's own calendar: the latest a past date can be. */
const today = () => new Date().toLocaleDateString("en-CA");

/** A stage as the server takes it: the slider's stop, or null while still waiting. */
const answerOf = (id: StageId, s: StageAnswer): SurveyStageAnswer => ({ stage: id, step: s.waiting ? null : s.step });

export function BranchSurvey({
  texts,
  lang,
  branches,
  privacyHref,
  backHref,
  initial,
}: {
  texts: SurveyTexts;
  lang: Locale;
  /** Every branch, as the reader's language names it, in the order to show. */
  branches: { code: string; name: string }[];
  privacyHref: string;
  backHref: string;
  initial: { branch: string; vote: string | null; code: string | null };
}) {
  const [phase, setPhase] = useState<"form" | "code" | "done">(initial.vote ? "code" : "form");
  const [branch, setBranch] = useState(initial.branch);
  const [filedMonth, setFiledMonth] = useState("");
  const [filedYear, setFiledYear] = useState("");
  const [stages, setStages] = useState(blankStages);
  const [satisfaction, setSatisfaction] = useState<Satisfaction | "">("");
  const [comment, setComment] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldError, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "failed" | "unverified" | "limit" | "daily" | "branches">("idle");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [vote, setVote] = useState<{ id: string; email: string } | null>(initial.vote ? { id: initial.vote, email: "" } : null);
  const formRef = useRef<HTMLFormElement>(null);

  const setStage = (id: StageId, change: Partial<StageAnswer>) => setStages((s) => ({ ...s, [id]: { ...s[id], ...change } }));
  const filed = filedYear && filedMonth ? `${filedYear}-${filedMonth}` : "";
  const chosen = stageIds.filter((id) => stages[id].on);

  function validate() {
    const next: Partial<Record<FieldError, string>> = {};
    if (!branch) next.branch = texts.errors.branch;
    const filedProblem = filedError(filed, today());
    if (filedProblem) next.filed = texts.errors[filedProblem];
    for (const id of chosen) {
      if (!stages[id].waiting && stages[id].step === null) {
        next[`${id}-wait`] = texts.errors.wait;
        continue;
      }
      const problem = stageWaitError(answerOf(id, stages[id]), filed, today());
      // A wait's length is measured against the filing month, so "too long" waits for there to be one.
      if (problem === "wait" || (problem === "long" && !filedProblem)) next[`${id}-wait`] = texts.errors[problem];
    }
    // Experiences from before SINCE aren't counted, so a vote can't promise to count one.
    if (!filedProblem && !chosen.some((id) => next[`${id}-wait`])) {
      const answers = chosen.map((id) => answerOf(id, stages[id]));
      if (surveyMonth(filed, answers, today()) < SINCE) next.filed = texts.errors.old.replace("{year}", SINCE);
    }
    if (!satisfaction) next.satisfaction = texts.errors.satisfaction;
    if (!isEmail(email.trim().toLowerCase())) next.email = texts.errors.email;
    if (!consent) next.consent = texts.errors.consent;
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
      return;
    }

    const data = new FormData(event.currentTarget);
    const body = new FormData();
    body.set("language", lang);
    body.set("branch", branch);
    body.set("satisfaction", satisfaction);
    body.set("filed", filed);
    body.set("stages", JSON.stringify(chosen.map((id) => answerOf(id, stages[id]))));
    body.set("comment", comment.trim());
    body.set("email", email.trim().toLowerCase());
    body.set("consent", consent ? "yes" : "");
    body.set("cf-turnstile-response", String(data.get("cf-turnstile-response") ?? ""));

    setStatus("sending");
    try {
      const result = await submitVote(body);
      if (result.ok) {
        setVote({ id: result.id, email: result.email });
        setPhase("code");
        setStatus("idle");
        return;
      }
      setStatus(result.error === "verify" ? "unverified" : result.error);
    } catch (error) {
      console.error(error);
      setStatus("failed");
    }
    setTurnstileReset((n) => n + 1);
  }

  if (phase === "done") {
    return (
      <div className="rounded-2xl border border-line-200 bg-white p-6 text-center sm:p-10">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <Icon name="checkCircle" className="size-7" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-semibold whitespace-pre-line text-navy-900">{texts.done.title}</h2>
        <p className="mt-2">{texts.done.body}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={backHref} className={primaryButton}>
            {texts.done.back}
          </Link>
          <button
            type="button"
            onClick={() => {
              setBranch("");
              setFiledMonth("");
              setFiledYear("");
              setStages(blankStages());
              setSatisfaction("");
              setComment("");
              setVote(null);
              setTurnstileReset((n) => n + 1);
              setPhase("form");
              // Leave the email's ?vote=&code= behind, so a reload doesn't verify again.
              window.history.replaceState(null, "", window.location.pathname);
            }}
            className="h-12 px-4 font-semibold text-teal-700 hover:underline"
          >
            {texts.done.another}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "code" && vote) {
    return (
      <CodeStep
        texts={texts.code}
        limitText={texts.errors.limit}
        vote={vote}
        linkCode={initial.vote === vote.id ? initial.code : null}
        onVerified={() => setPhase("done")}
        onChangeEmail={() => {
          setVote(null);
          setTurnstileReset((n) => n + 1);
          setPhase("form");
          window.history.replaceState(null, "", window.location.pathname);
        }}
      />
    );
  }

  // The filing month's choices: the months by name in the reader's language, and the last eight years, newest first.
  const monthName = new Intl.DateTimeFormat(locales[lang].intlLocale, { month: "long", timeZone: "UTC" });
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    name: monthName.format(new Date(Date.UTC(2026, i, 1))),
  }));
  // From two years before SINCE: a long wait that began then can still end within it.
  const thisYear = Number(today().slice(0, 4));
  const years = Array.from({ length: thisYear - Number(SINCE) + 3 }, (_, i) => String(thisYear - i));
  // Each stage's slider stops in words: "Under a week", "2 weeks", "8 months"…
  const plurals = new Intl.PluralRules(locales[lang].intlLocale);
  const count = (forms: Plural, n: number) => {
    const category = plurals.select(n);
    return ((category === "one" || category === "two" ? forms[category] : undefined) ?? forms.other).replace("{count}", String(n));
  };
  const { scale } = texts.stages;
  const stepWords = (id: StageId) =>
    waitSteps[id].map((s) => (s.unit === "under" ? scale.under : s.unit === "over" ? scale.over : count(scale[s.unit], s.n)));

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="space-y-8 rounded-2xl border border-line-200 bg-white p-5 sm:p-8">
      <Field id="branch" label={texts.branch.label} error={errors.branch}>
        <Select
          id="branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="mt-1.5"
          aria-required
          {...describe("branch", errors.branch)}
        >
          <option value="">{texts.branch.placeholder}</option>
          {branches.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>

      {/* Two dropdowns rather than a month picker, which Safari and Firefox on desktop don't have. */}
      <fieldset aria-describedby={errors.filed ? "filed-error" : undefined}>
        <legend className="text-sm font-semibold text-navy-900">{texts.filed.label}</legend>
        <div className="mt-1.5 grid max-w-sm grid-cols-[1fr_7.5rem] gap-2">
          <Select
            id="filed"
            aria-label={texts.filed.month}
            aria-invalid={!!errors.filed}
            value={filedMonth}
            onChange={(e) => setFiledMonth(e.target.value)}
          >
            <option value="">{texts.filed.month}</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label={texts.filed.year}
            aria-invalid={!!errors.filed}
            value={filedYear}
            onChange={(e) => setFiledYear(e.target.value)}
          >
            <option value="">{texts.filed.year}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        {errors.filed && (
          <p id="filed-error" className="mt-1.5 text-sm text-terracotta-600">
            {errors.filed}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-navy-900">{texts.stages.label}</legend>
        <p className="mt-1 text-xs text-slate-500">{texts.stages.hint}</p>
        <div className="mt-3 space-y-3">
          {stageIds.map((id) => {
            const item = texts.stages.items[id];
            const s = stages[id];
            return (
              <div key={id} className={`rounded-xl border p-4 transition-colors ${s.on ? "border-teal-600/40 bg-teal-100/30" : "border-line-200"}`}>
                <label className="flex cursor-pointer items-center gap-3 font-semibold text-navy-900">
                  <input
                    type="checkbox"
                    checked={s.on}
                    onChange={(e) => setStage(id, { on: e.target.checked })}
                    className="size-5 accent-teal-600"
                  />
                  <span>
                    {item.label}
                    {item.note && <span className="ms-2 text-sm font-normal text-slate-500">{item.note}</span>}
                  </span>
                </label>
                {s.on && (
                  <div className="mt-4">
                    <WaitSlider
                      id={`${id}-wait`}
                      label={texts.stages.wait}
                      // While still waiting it shows no stop; the one chosen comes back if they untick it.
                      value={s.waiting ? null : s.step}
                      steps={stepWords(id)}
                      choose={scale.choose}
                      rtl={locales[lang].dir === "rtl"}
                      disabled={s.waiting}
                      error={errors[`${id}-wait`]}
                      onChange={(step) => setStage(id, { step })}
                    />
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={s.waiting}
                        onChange={(e) => setStage(id, { waiting: e.target.checked })}
                        className="size-4 accent-teal-600"
                      />
                      {item.waiting}
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset id="satisfaction" tabIndex={-1} aria-describedby={errors.satisfaction ? "satisfaction-error" : undefined}>
        <legend className="text-sm font-semibold text-navy-900">{texts.satisfaction.label}</legend>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {satisfactionChoices.map((choice) => {
            const chosen = satisfaction === choice;
            return (
              <label
                key={choice}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 px-2 py-4 text-center text-[15px] font-semibold text-navy-900 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-600 ${
                  chosen ? moods[choice].chosen : `border-line-200 bg-white hover:-translate-y-0.5 hover:shadow-soft ${moods[choice].hover}`
                }`}
              >
                <input
                  type="radio"
                  name="satisfaction"
                  value={choice}
                  checked={chosen}
                  onChange={() => setSatisfaction(choice)}
                  className="sr-only"
                />
                <Face choice={choice} chosen={chosen} />
                {texts.satisfaction.items[choice]}
              </label>
            );
          })}
        </div>
        {errors.satisfaction && (
          <p id="satisfaction-error" className="mt-1.5 text-sm text-terracotta-600">
            {errors.satisfaction}
          </p>
        )}
      </fieldset>

      <Field id="comment" label={texts.comment.label} hint={texts.comment.hint}>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={COMMENT_MAX}
          rows={3}
          dir="auto"
          aria-describedby="comment-hint"
          className="mt-1.5 w-full rounded-[10px] border border-line-200 bg-white px-3.5 py-3 text-[16px] text-navy-900 transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
      </Field>

      <div className="space-y-4 border-t border-line-200 pt-6">
        <Field id="email" label={texts.email.label} error={errors.email} hint={texts.email.hint}>
          <input
            id="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} text-start`}
            aria-required
            {...describe("email", errors.email, true)}
          />
        </Field>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-6 text-slate-700">
            <input
              id="consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-teal-600"
              {...describe("consent", errors.consent)}
            />
            <span>
              {texts.consent}{" "}
              <Link href={privacyHref} target="_blank" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
                {texts.privacy}
              </Link>
            </span>
          </label>
          {errors.consent && (
            <p id="consent-error" className="mt-1.5 text-sm text-terracotta-600">
              {errors.consent}
            </p>
          )}
        </div>

        <Turnstile resetKey={turnstileReset} />
        {status === "failed" && <ErrorNote>{texts.errors.failed}</ErrorNote>}
        {status === "unverified" && <ErrorNote>{texts.errors.verify}</ErrorNote>}
        {status === "limit" && <ErrorNote>{texts.errors.limit}</ErrorNote>}
        {status === "daily" && <ErrorNote>{texts.errors.daily}</ErrorNote>}
        {status === "branches" && <ErrorNote>{texts.errors.branches}</ErrorNote>}

        <button type="submit" disabled={status === "sending"} className={`${primaryButton} w-full`}>
          {status === "sending" ? texts.sending : texts.submit}
        </button>
      </div>
    </form>
  );
}

/** The code we emailed: typed in, or entered from the email's link. */
function CodeStep({
  texts,
  limitText,
  vote,
  linkCode,
  onVerified,
  onChangeEmail,
}: {
  texts: SurveyTexts["code"];
  /** When the address has had its codes for the hour. */
  limitText: string;
  vote: { id: string; email: string };
  /** The code from the email's link, entered at once. */
  linkCode: string | null;
  onVerified: () => void;
  onChangeEmail: () => void;
}) {
  const [code, setCode] = useState(linkCode ?? "");
  const [status, setStatus] = useState<"idle" | "checking" | "resent">(linkCode ? "checking" : "idle");
  const [error, setError] = useState<keyof SurveyTexts["code"]["errors"] | "limit" | null>(null);
  const [cooldown, setCooldown] = useState(true);
  const started = useRef(false);

  /** What the server said about a code. */
  function settle(result: Awaited<ReturnType<typeof verifyVote>>) {
    if (result.ok) return onVerified();
    setError(result.error);
    setStatus("idle");
  }
  const fail = (e: unknown) => {
    console.error(e);
    settle({ ok: false, error: "failed" });
  };

  function check(value: string) {
    setStatus("checking");
    setError(null);
    verifyVote(vote.id, value).then(settle, fail);
  }

  // The email's link brings its code: enter it at once. A new code can be asked for after 30 seconds.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (linkCode) verifyVote(vote.id, linkCode).then(settle, fail);
    const timer = setTimeout(() => setCooldown(false), 30_000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resend() {
    setError(null);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 30_000);
    const result = await resendCode(vote.id).catch(() => ({ ok: false as const, error: "failed" as const }));
    if (result.ok) setStatus("resent");
    else setError(result.error === "limit" ? "limit" : "failed");
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (code.replace(/\D/g, "").length === 6) check(code);
        else setError("wrong");
      }}
      className="rounded-2xl border border-line-200 bg-white p-6 sm:p-10"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-sage-200 text-navy-900">
        <Icon name="mail" className="size-6" />
      </span>
      <h2 className="mt-4 font-display text-2xl font-semibold text-navy-900">{texts.title}</h2>
      {vote.email && <p className="mt-2">{texts.body.replace("{email}", vote.email)}</p>}

      <div className="mt-6">
        <Field id="code" label={texts.label}>
          <CodeSlots value={code} onChange={setCode} invalid={!!error} />
        </Field>
      </div>
      {error && (
        <div className="mt-3">
          <ErrorNote>{error === "limit" ? limitText : texts.errors[error]}</ErrorNote>
        </div>
      )}
      {status === "resent" && !error && <p className="mt-3 text-sm text-teal-700">{texts.resent}</p>}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={status === "checking"} className={primaryButton}>
          {status === "checking" ? texts.checking : texts.submit}
        </button>
        <button type="button" disabled={cooldown} onClick={resend} className="h-12 px-4 font-semibold text-teal-700 hover:underline disabled:text-slate-500 disabled:no-underline">
          {texts.resend}
        </button>
        <button type="button" onClick={onChangeEmail} className="h-12 px-4 text-sm text-slate-500 hover:underline">
          {texts.change}
        </button>
      </div>
    </form>
  );
}

/**
 * How each answer to "how was dealing with the branch" looks: the branches page's colors for the same three (teal,
 * slate, amber), and a face to match. A chosen one fills in.
 */
const moods: Record<Satisfaction, { tone: string; tint: string; chosen: string; hover: string; mouth: string }> = {
  satisfied: {
    tone: "text-teal-600",
    tint: "fill-teal-100",
    chosen: "border-teal-600 bg-teal-100/70",
    hover: "hover:border-teal-600/50",
    mouth: "M15 28.5c2.4 3.6 5.4 5.5 9 5.5s6.6-1.9 9-5.5",
  },
  neutral: {
    tone: "text-slate-500",
    tint: "fill-slate-500/10",
    chosen: "border-slate-500 bg-slate-500/10",
    hover: "hover:border-slate-500/50",
    mouth: "M16.5 31h15",
  },
  unsatisfied: {
    tone: "text-amber-500",
    tint: "fill-amber-100",
    chosen: "border-amber-500 bg-amber-100/70",
    hover: "hover:border-amber-500/50",
    mouth: "M15 34c2.4-3.6 5.4-5.5 9-5.5s6.6 1.9 9 5.5",
  },
};

function Face({ choice, chosen }: { choice: Satisfaction; chosen: boolean }) {
  const mood = moods[choice];
  const feature = chosen ? "#fff" : "currentColor";
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={`size-11 ${mood.tone} ${chosen ? "animate-cheer" : ""}`}>
      <circle cx="24" cy="24" r="21" className={chosen ? "fill-current" : mood.tint} />
      <circle cx="17.5" cy="19.5" r="2.5" fill={feature} />
      <circle cx="30.5" cy="19.5" r="2.5" fill={feature} />
      <path d={mood.mouth} fill="none" stroke={feature} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The emailed code as six slots, one per digit, over a single real input: the phone's "from Messages/Mail" suggestion,
 * pasting and deleting all work as in any field. The slots only draw what it holds, with the next one to fill marked.
 */
function CodeSlots({ value, onChange, invalid }: { value: string; onChange: (code: string) => void; invalid: boolean }) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  return (
    <div dir="ltr" className="group relative mt-1.5 max-w-sm">
      <input
        id="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        // No maxLength: a pasted "Your code: 944 636" would be cut before its digits. Six are kept from whatever comes.
        value={digits}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        aria-invalid={invalid}
        // Invisible but there: it takes the taps, the typing and the focus. 16px keeps iOS from zooming in.
        className="peer absolute inset-0 z-10 size-full cursor-text text-[16px] text-transparent caret-transparent opacity-0 outline-none"
      />
      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }, (_, i) => {
          const next = i === Math.min(digits.length, 5);
          return (
            <div
              key={i}
              className={`flex h-14 items-center justify-center rounded-[10px] border bg-white text-2xl font-semibold text-navy-900 tabular-nums transition ${
                invalid ? "border-terracotta-600" : "border-line-200"
              } ${next ? "group-focus-within:border-teal-600 group-focus-within:ring-2 group-focus-within:ring-teal-600/20" : ""}`}
            >
              {digits[i] ?? (next && <span className="hidden h-6 w-0.5 animate-pulse rounded-full bg-navy-900 group-focus-within:block" />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
