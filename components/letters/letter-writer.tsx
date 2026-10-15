"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { format, type Messages } from "@/i18n/messages";
import { trackLetterOpened } from "@/app/[lang]/letter/[token]/actions";
import { BODY_MAX, ID_PDF_MAX_BYTES, bodyProblem, isIsraeliId, isPersonName, isPdfFile, isPhone } from "@/lib/letters/rules";
import { shrinkImage } from "@/lib/letters/shrink-image";
import { coupleNames, letterFileName, letterText } from "@/lib/letters/text";
import type { LetterVia } from "@/lib/letters/tracking";
import { localePath } from "@/lib/site";
import { Icon } from "../icons";
import { Turnstile } from "../turnstile";
import { ErrorNote, Field, describe, inputClass, primaryButton, secondaryButton } from "./fields";
import { SignaturePad, type SignaturePadHandle } from "./signature-pad";

// The friend's side of the recommendation letters tool, one step at a time:
// their details, then the letter itself, written in one box inside the
// letter's frame (the address and subject above, their details below, so
// they write only the body), a photo of their ID card, a signature, and a
// preview with "Download PDF" and "Send to the couple". The server builds the
// PDF from what's posted (app/api/letters/[id]/...) and keeps none of it.
// Only the letter, name and phone are saved as a draft, in this browser,
// until the letter is sent.

type Labels = Messages["letters"]["writer"];
type Details = { name: string; idNumber: string; phone: string };
type ActionError = keyof Labels["actions"]["errors"];

const STEP = { intro: 0, details: 1, letter: 2, idCard: 3, sign: 4, preview: 5, done: 6 };
/** Numbered steps: details, letter, ID card, signature and preview. */
const TOTAL = STEP.preview;

const draftKey = (id: string) => `visamo:letter:${id}`;

/**
 * For the stats: a random id this browser keeps, to count each friend once,
 * and how they got the link, kept for the visit (an invite email's link
 * says ?via=email; it's gone from the URL after a reload elsewhere).
 */
function readVisit(id: string): { visitor: string; via: LetterVia } {
  let visitor = "";
  let via: LetterVia = "link";
  try {
    visitor = localStorage.getItem("visamo:letter-visitor") ?? "";
    if (!visitor) {
      visitor = crypto.randomUUID();
      localStorage.setItem("visamo:letter-visitor", visitor);
    }
    const key = `visamo:letter-via:${id}`;
    if (new URLSearchParams(window.location.search).get("via") === "email") sessionStorage.setItem(key, "email");
    via = sessionStorage.getItem(key) === "email" ? "email" : "link";
  } catch {
    // No storage: a fresh id for this visit only.
    visitor ||= crypto.randomUUID();
  }
  return { visitor, via };
}

type Visit = ReturnType<typeof readVisit>;



function readDraft(id: string): { body?: string; name?: string; phone?: string } {
  try {
    return JSON.parse(localStorage.getItem(draftKey(id)) ?? "{}");
  } catch {
    return {};
  }
}

export function LetterWriter({
  id,
  names,
  email,
  labels,
  lang,
}: {
  id: string;
  /** Both partners, as the couple wrote them. */
  names: [string, string];
  /** Where the letter is sent, masked; null when the couple gave no email, and the friend can only download it. */
  email: string | null;
  labels: Labels;
  lang: Locale;
}) {
  const couple = coupleNames(names, lang);
  const [step, setStep] = useState(STEP.intro);
  const [body, setBody] = useState("");
  const [details, setDetails] = useState<Details>({ name: "", idNumber: "", phone: "" });
  // A photo, shrunk here, or a scanned PDF as it is (its name shown, since there's no picture of it).
  const [idCard, setIdCard] = useState<{ blob: Blob; url: string; pdf?: string } | null>(null);
  const [idCardState, setIdCardState] = useState<"idle" | "processing" | "unreadable" | "tooLarge">("idle");
  const [signature, setSignature] = useState<{ blob: Blob; url: string } | null>(null);
  const [signed, setSigned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Details, string>>>({});
  const [action, setAction] = useState<"idle" | "downloading" | "sending">("idle");
  const [actionError, setActionError] = useState<ActionError | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const visit = useRef<Visit | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const padRef = useRef<SignaturePadHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // The draft, from an earlier visit on this device, and the visit for the stats.
  useEffect(() => {
    visit.current = readVisit(id);
    // For the stats, without waiting or failing anything.
    trackLetterOpened(id, visit.current.visitor, visit.current.via).catch(() => {});
    const draft = readDraft(id);
    setBody(draft.body ?? "");
    setDetails((d) => ({ ...d, name: draft.name ?? "", phone: draft.phone ?? "" }));
    setLoaded(true);
  }, [id]);

  useEffect(() => {
    if (!loaded || step === STEP.done) return;
    try {
      localStorage.setItem(draftKey(id), JSON.stringify({ body, name: details.name, phone: details.phone }));
    } catch {
      // Private browsing or full storage: there's just no draft.
    }
  }, [id, loaded, step, body, details.name, details.phone]);

  // Each step opens at its heading, for screen readers and on small screens.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  // Object URLs for the previews are released when they're replaced.
  useEffect(() => {
    if (idCard) return () => URL.revokeObjectURL(idCard.url);
  }, [idCard]);
  useEffect(() => {
    if (signature) return () => URL.revokeObjectURL(signature.url);
  }, [signature]);

  function go(next: number) {
    setError(null);
    setActionError(null);
    setStep(next);
  }

  async function next() {
    if (step === STEP.letter) {
      const problem = bodyProblem(body);
      if (problem) {
        setError(labels.letter.errors[problem]);
        return document.getElementById("letter-body")?.focus();
      }
    }
    if (step === STEP.details) {
      const errors: Partial<Record<keyof Details, string>> = {};
      if (!isPersonName(details.name.trim().replace(/\s+/g, " "))) errors.name = labels.details.errors.name;
      if (!isIsraeliId(details.idNumber.replace(/[\s-]/g, ""))) errors.idNumber = labels.details.errors.idNumber;
      if (!isPhone(details.phone.trim())) errors.phone = labels.details.errors.phone;
      setFieldErrors(errors);
      const firstError = Object.keys(errors)[0];
      if (firstError) return document.getElementById(`writer-${firstError}`)?.focus();
    }
    if (step === STEP.idCard && !idCard) return setError(labels.idCard.errors.required);
    if (step === STEP.sign) {
      if (!signature) {
        const blob = signed ? await padRef.current?.toBlob() : null;
        if (!blob) return setError(labels.sign.errors.required);
        setSignature({ blob, url: URL.createObjectURL(blob) });
      }
    }
    go(step + 1);
  }

  async function chooseIdCard(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    if (isPdfFile(file)) {
      if (file.size > ID_PDF_MAX_BYTES) return setIdCardState("tooLarge");
      setIdCard({ blob: file, url: URL.createObjectURL(file), pdf: file.name });
      return setIdCardState("idle");
    }
    setIdCardState("processing");
    try {
      const blob = await shrinkImage(file);
      setIdCard({ blob, url: URL.createObjectURL(blob) });
      setIdCardState("idle");
    } catch {
      setIdCardState("unreadable");
    }
  }

  function letterForm() {
    const form = new FormData();
    form.set("body", body);
    form.set("name", details.name.trim().replace(/\s+/g, " "));
    form.set("idNumber", details.idNumber.replace(/[\s-]/g, ""));
    form.set("phone", details.phone.trim());
    if (idCard) form.set("idCard", idCard.blob, idCard.pdf ? "id-card.pdf" : "id-card.jpg");
    if (signature) form.set("signature", signature.blob, "signature.png");
    if (visit.current) {
      form.set("visitor", visit.current.visitor);
      form.set("via", visit.current.via);
    }
    return form;
  }

  async function errorOf(response: Response): Promise<ActionError> {
    const { error } = (await response.json().catch(() => ({}))) as { error?: string };
    return error && error in labels.actions.errors ? (error as ActionError) : "failed";
  }

  async function download() {
    setAction("downloading");
    setActionError(null);
    try {
      const response = await fetch(`/api/letters/${id}/pdf`, { method: "POST", body: letterForm() });
      if (!response.ok) {
        setActionError(await errorOf(response));
      } else {
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement("a");
        link.href = url;
        link.download = letterFileName(details.name.trim());
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        // Without the couple's email, downloading is how the letter leaves: it's done.
        if (!email && step === STEP.preview) {
          try {
            localStorage.removeItem(draftKey(id));
          } catch {}
          setAction("idle");
          return go(STEP.done);
        }
      }
    } catch {
      setActionError("failed");
    }
    setAction("idle");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = new FormData(event.currentTarget).get("cf-turnstile-response");
    const form = letterForm();
    form.set("cf-turnstile-response", typeof token === "string" ? token : "");
    setAction("sending");
    setActionError(null);
    try {
      const response = await fetch(`/api/letters/${id}/send`, { method: "POST", body: form });
      if (response.ok) {
        try {
          localStorage.removeItem(draftKey(id));
        } catch {}
        setAction("idle");
        return go(STEP.done);
      }
      setActionError(await errorOf(response));
    } catch {
      setActionError("failed");
    }
    setAction("idle");
    setTurnstileReset((n) => n + 1);
  }

  const heading = (text: string) => (
    <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold text-navy-900 outline-none sm:text-3xl">
      {text}
    </h1>
  );

  if (step === STEP.intro) {
    const t = labels.intro;
    return (
      <Card>
        <p className="text-sm font-semibold tracking-wide text-teal-700">{t.eyebrow}</p>
        <div className="mt-2">{heading(format(t.title, { names: couple }))}</div>
        <p className="mt-4">{t.body}</p>
        <h2 className="mt-6 font-semibold text-navy-900">{t.needsTitle}</h2>
        <ul className="mt-2 space-y-1.5">
          {t.needs.map((need) => (
            <li key={need} className="flex items-center gap-2">
              <Icon name="check" className="size-5 text-teal-600" />
              {need}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-[10px] bg-sand-50 px-4 py-3 text-[15px]">{t.hebrew}</p>
        <button type="button" onClick={() => go(1)} className={`${primaryButton} mt-6 w-full sm:w-auto`}>
          <Icon name="pen" className="size-5" />
          {t.start}
        </button>
        <p className="mt-3 text-xs text-slate-500">{t.draft}</p>
      </Card>
    );
  }

  if (step === STEP.done) {
    const t = labels.done;
    return (
      <Card>
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-teal-600 text-white">
          <Icon name="check" className="size-6" strokeWidth={2.4} />
        </span>
        <div className="mt-4">{heading(t.title)}</div>
        <p className="mt-2">{format(email ? t.body : t.bodyDownloaded, { names: couple })}</p>
        <button type="button" onClick={download} disabled={action !== "idle"} className={`${secondaryButton} mt-6`}>
          <Icon name="download" className="size-5" />
          {action === "downloading" ? labels.actions.preparing : t.copy}
        </button>
        {actionError && (
          <div className="mt-4">
            <ErrorNote>{format(labels.actions.errors[actionError], { names: couple })}</ErrorNote>
          </div>
        )}
        <div className="mt-8 rounded-2xl bg-navy-900 p-6 text-slate-300">
          <h2 className="text-lg font-semibold text-white">{t.promoTitle}</h2>
          <p className="mt-2 text-[15px]">{t.promoBody}</p>
          <Link href={localePath(lang, "/")} className="mt-4 inline-flex items-center gap-1.5 font-semibold text-sage-200 hover:underline">
            {t.promoCta}
            <Icon name="arrow" className="size-4" />
          </Link>
        </div>
      </Card>
    );
  }

  const nav = (nextLabel: string | null = labels.next) => (
    <div className="mt-8 flex items-center justify-between gap-3">
      <button type="button" onClick={() => go(step - 1)} className="inline-flex h-12 items-center gap-1.5 px-2 font-semibold text-slate-700 hover:text-navy-900">
        <Icon name="arrow" className="size-4 rotate-180" />
        {labels.back}
      </button>
      {nextLabel && (
        <button type="button" onClick={next} disabled={idCardState === "processing"} className={primaryButton}>
          {nextLabel}
        </button>
      )}
    </div>
  );

  const progress = (
    <div className="mb-6">
      <p className="text-sm font-semibold text-slate-500">{format(labels.step, { n: step, total: TOTAL })}</p>
      <div className="mt-2 h-1.5 rounded-full bg-line-200" aria-hidden="true">
        <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>
    </div>
  );

  // What the letter says around the friend's part, with their details filled in.
  const text = letterText({
    names,
    writer: { name: details.name.trim(), idNumber: details.idNumber.replace(/[\s-]/g, ""), phone: details.phone.trim() },
    body,
    date: new Date(),
  });

  if (step === STEP.letter) {
    const t = labels.letter;
    return (
      <Card wide>
        {progress}
        {heading(t.title)}
        <p className="mt-2 text-[15px] text-slate-700">{t.body}</p>
        <div className="mt-5 rounded-[10px] bg-sand-50 px-4 py-4 text-[15px] sm:px-5">
          <h2 className="font-semibold text-navy-900">{t.guideTitle}</h2>
          <ul className="mt-2 list-disc space-y-1 ps-5">
            {t.guide.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-2 text-slate-700">{t.length}</p>
        </div>
        <LetterPaper text={text} quiet>
          <label htmlFor="letter-body" className="sr-only">
            {t.label}
          </label>
          <textarea
            id="letter-body"
            dir="rtl"
            value={body}
            maxLength={BODY_MAX + 500}
            placeholder={t.placeholder}
            onChange={(e) => {
              setBody(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "letter-body-error" : undefined}
            className="mt-3 block min-h-80 w-full resize-y rounded-[10px] border border-dashed border-teal-600/60 bg-teal-100/20 p-3 text-[16px] leading-7 text-navy-900 [field-sizing:content] focus:border-solid focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none aria-invalid:border-terracotta-600"
          />
          <div className="mt-1.5 flex justify-between gap-3 text-sm">
            <p id="letter-body-error" className="text-terracotta-600">
              {error}
            </p>
            <p className={`shrink-0 ${body.length > BODY_MAX ? "text-terracotta-600" : "text-slate-500"}`}>
              <bdi>{format(t.count, { n: body.length, max: BODY_MAX })}</bdi>
            </p>
          </div>
        </LetterPaper>
        {nav()}
      </Card>
    );
  }

  if (step === STEP.details) {
    const t = labels.details;
    const input = (key: keyof Details, props: Record<string, unknown>) => (
      <input
        id={`writer-${key}`}
        value={details[key]}
        onChange={(e) => setDetails((d) => ({ ...d, [key]: e.target.value }))}
        className={inputClass}
        aria-required
        {...describe(`writer-${key}`, fieldErrors[key])}
        {...props}
      />
    );
    return (
      <Card>
        {progress}
        {heading(t.title)}
        <p className="mt-2 text-[15px] text-slate-700">{t.body}</p>
        <div className="mt-6 space-y-5">
          <Field id="writer-name" label={t.name} error={fieldErrors.name}>
            {input("name", { autoComplete: "name", maxLength: 60, dir: "auto" })}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="writer-idNumber" label={t.idNumber} error={fieldErrors.idNumber}>
              {input("idNumber", { inputMode: "numeric", dir: "ltr", autoComplete: "off", maxLength: 11, className: `${inputClass} text-start` })}
            </Field>
            <Field id="writer-phone" label={t.phone} error={fieldErrors.phone}>
              {input("phone", { type: "tel", dir: "ltr", autoComplete: "tel", className: `${inputClass} text-start` })}
            </Field>
          </div>
        </div>
        {nav()}
      </Card>
    );
  }

  if (step === STEP.idCard) {
    const t = labels.idCard;
    return (
      <Card>
        {progress}
        {heading(t.title)}
        <p className="mt-2 text-[15px] text-slate-700">{t.body}</p>
        {idCard && (
          <figure className="mt-5">
            {idCard.pdf ? (
              <PdfTile name={idCard.pdf} url={idCard.url} open={t.open} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- a local object URL
              <img src={idCard.url} alt={t.alt} className="max-h-72 w-auto rounded-[10px] border border-line-200" />
            )}
            <figcaption className="mt-2 text-sm text-slate-700">{idCard.pdf ? t.pdfNote : t.check}</figcaption>
          </figure>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={idCardState === "processing"}
          className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-dashed border-slate-300 px-4 py-3 font-semibold text-teal-700 hover:border-teal-600 hover:bg-teal-100/40 disabled:opacity-70"
        >
          <Icon name="upload" className="size-5" />
          {idCardState === "processing" ? t.processing : idCard ? t.replace : t.choose}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => chooseIdCard(e.target.files?.[0])}
        />
        <p role="alert" className="mt-2 text-sm text-terracotta-600 empty:hidden">
          {idCardState === "unreadable" ? t.errors.type : idCardState === "tooLarge" ? t.errors.tooLarge : error}
        </p>
        {nav()}
      </Card>
    );
  }

  if (step === STEP.sign) {
    const t = labels.sign;
    return (
      <Card>
        {progress}
        {heading(t.title)}
        <p className="mt-2 text-[15px] text-slate-700">{t.body}</p>
        <div className="mt-5">
          {signature ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local object URL
            <img src={signature.url} alt={t.label} className="h-44 w-full rounded-[10px] border-2 border-dashed border-slate-300 bg-white object-contain p-4" />
          ) : (
            <SignaturePad ref={padRef} label={t.label} onChange={setSigned} invalid={!!error} />
          )}
          <button
            type="button"
            onClick={() => {
              setSignature(null);
              padRef.current?.clear();
            }}
            className="mt-2 text-sm font-semibold text-teal-700 hover:underline"
          >
            {t.clear}
          </button>
        </div>
        <p role="alert" className="mt-2 text-sm text-terracotta-600 empty:hidden">
          {error}
        </p>
        {nav()}
      </Card>
    );
  }

  // The preview, with the two ways out.
  const t = labels.preview;
  const a = labels.actions;
  return (
    <Card wide>
      {progress}
      {heading(t.title)}
      <p className="mt-2 text-[15px] text-slate-700">{t.body}</p>

      <LetterPaper text={text} signature={signature?.url} signatureLabel={labels.sign.label}>
        {text.paragraphs.map((paragraph, i) => (
          <p key={i} className="mt-3">
            {paragraph}
          </p>
        ))}
      </LetterPaper>
      {idCard && (
        <figure className="mt-4">
          <figcaption className="text-sm font-semibold text-slate-700">{t.idCard}</figcaption>
          {idCard.pdf ? (
            <div className="mt-2">
              <PdfTile name={idCard.pdf} url={idCard.url} open={labels.idCard.open} />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- a local object URL
            <img src={idCard.url} alt={labels.idCard.alt} className="mt-2 max-h-40 w-auto rounded-[10px] border border-line-200" />
          )}
        </figure>
      )}

      {email ? (
        <form onSubmit={send} className="mt-8 space-y-4 border-t border-line-200 pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={action !== "idle"} className={primaryButton}>
              <Icon name="send" className="size-5" />
              {action === "sending" ? a.sending : format(a.send, { names: couple })}
            </button>
            <button type="button" onClick={download} disabled={action !== "idle"} className={secondaryButton}>
              <Icon name="download" className="size-5" />
              {action === "downloading" ? a.preparing : a.download}
            </button>
          </div>
          <p className="text-sm text-slate-700">
            {a.sendTo.split("{email}")[0]}
            <bdi dir="ltr">{email}</bdi>
            {a.sendTo.split("{email}")[1]}
          </p>
          <Turnstile resetKey={turnstileReset} />
          {actionError && <ErrorNote>{format(a.errors[actionError], { names: couple })}</ErrorNote>}
          <Disclaimer title={a.disclaimerTitle} text={format(a.disclaimer, { names: couple })} />
        </form>
      ) : (
        // The couple gave no email: the friend downloads the letter and sends it to them.
        <div className="mt-8 space-y-4 border-t border-line-200 pt-6">
          <button type="button" onClick={download} disabled={action !== "idle"} className={primaryButton}>
            <Icon name="download" className="size-5" />
            {action === "downloading" ? a.preparing : a.download}
          </button>
          <p className="text-sm text-slate-700">{format(a.downloadOnly, { names: couple })}</p>
          {actionError && <ErrorNote>{format(a.errors[actionError], { names: couple })}</ErrorNote>}
          <Disclaimer title={a.disclaimerTitle} text={a.disclaimerDownload} />
        </div>
      )}
      {nav(null)}
    </Card>
  );
}

/**
 * The letter as it's laid out on the page, around `children`: the friend's
 * part. `quiet` is for while they write: it greys out what's filled in for
 * them and leaves out the ID card note.
 */
function LetterPaper({
  text,
  quiet = false,
  signature,
  signatureLabel = "",
  children,
}: {
  text: ReturnType<typeof letterText>;
  quiet?: boolean;
  signature?: string;
  signatureLabel?: string;
  children: ReactNode;
}) {
  const fixed = quiet ? "text-slate-500" : "";
  return (
    <article
      dir="rtl"
      lang="he"
      className="mt-6 rounded-[10px] border border-line-200 bg-white p-5 text-[15px] leading-7 text-navy-900 shadow-soft [overflow-wrap:anywhere] sm:p-10"
    >
      <p className="text-end text-slate-500">{text.date}</p>
      <p className={`mt-5 ${fixed}`}>
        {text.to.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>
      <p className={`mt-5 font-semibold ${fixed}`}>{text.subject}</p>
      {/* The ID card note is for the clerk: shown in the preview, not while they write. */}
      {!quiet && (
        <p className="mt-3 rounded-md border-[1.5px] border-navy-900 bg-sage-200/40 px-3 py-2 font-bold">{text.attachment}</p>
      )}
      {children}
      <p className={`mt-6 ${fixed}`}>{text.regards}</p>
      {signature && (
        // eslint-disable-next-line @next/next/no-img-element -- a local object URL
        <img src={signature} alt={signatureLabel} className="mt-1 h-auto max-h-14 w-auto max-w-40" />
      )}
      {text.signedBy.map((line, i) => (
        // Short lines, kept whole so "050-1234567" never breaks at its hyphen.
        <p key={line} className={`whitespace-nowrap ${i === 0 ? `font-semibold ${fixed}` : "text-slate-500"}`}>
          {line}
        </p>
      ))}
    </article>
  );
}

function Disclaimer({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-[10px] bg-sage-200/50 px-4 py-3 text-sm">
      <Icon name="lock" className="mt-0.5 size-5 shrink-0 text-navy-900" />
      <p>
        <span className="font-semibold text-navy-900">{title}</span> {text}
      </p>
    </div>
  );
}

/** A chosen PDF: its name, and a link to open it in the browser's viewer. */
function PdfTile({ name, url, open }: { name: string; url: string; open: string }) {
  return (
    <div className="flex max-w-md items-center gap-3 rounded-[10px] border border-line-200 bg-white px-4 py-3">
      <Icon name="pdf" className="size-7 shrink-0 text-teal-700" />
      <span className="min-w-0 flex-1 truncate font-medium text-navy-900">
        <bdi>{name}</bdi>
      </span>
      <a href={url} target="_blank" rel="noopener" className="shrink-0 text-sm font-semibold text-teal-700 hover:underline">
        {open}
      </a>
    </div>
  );
}

function Card({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`mx-auto rounded-2xl border border-line-200 bg-white p-6 shadow-soft sm:p-10 ${wide ? "max-w-3xl" : "max-w-2xl"}`}>
      {children}
    </div>
  );
}
