"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { sendContactMessage } from "@/app/[lang]/contact/actions";
import type { Locale } from "@/i18n/config";
import {
  CONTACT_ACCEPT,
  CONTACT_MAX_FILES as MAX_FILES,
  CONTACT_MAX_TOTAL_BYTES as MAX_TOTAL_BYTES,
  isContactAttachment,
  isPhone,
} from "@/lib/contact";
import { Icon } from "./icons";
import { Turnstile } from "./turnstile";

// Submissions go to a server action, which checks them again and emails them
// to the support inbox. The checks here are for quick feedback.

type Labels = {
  name: string;
  email: string;
  emailHint: string;
  phone: string;
  reason: string;
  reasonPlaceholder: string;
  reasons: string[];
  message: string;
  attachments: string;
  attachmentsHint: string;
  addFiles: string;
  remove: string;
  submit: string;
  sending: string;
  successTitle: string;
  successBody: string;
  error: string;
  errors: {
    required: string;
    email: string;
    phone: string;
    tooMany: string;
    tooLarge: string;
    type: string;
    verify: string;
  };
};

type Field = "name" | "email" | "phone" | "reason" | "message" | "attachments";

function formatSize(bytes: number, locale: string) {
  const mb = bytes / (1024 * 1024);
  const [value, unit] = mb < 1 ? [bytes / 1024, "kilobyte"] : [mb, "megabyte"];
  return new Intl.NumberFormat(locale, { style: "unit", unit, maximumFractionDigits: mb < 1 ? 0 : 1 }).format(value);
}

export function ContactForm({
  labels,
  lang,
  locale,
  supportEmail,
}: {
  labels: Labels;
  lang: Locale;
  /** For number formatting, e.g. "he-IL". */
  locale: string;
  supportEmail: string;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed" | "unverified">("idle");
  const [sent, setSent] = useState({ email: "", ticket: "" });
  // Bumped after each send: a Turnstile token works only once.
  const [turnstileReset, setTurnstileReset] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // The form is replaced by the confirmation, so focus moves there and screen
  // readers announce it instead of losing their place.
  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)];
    let error: string | undefined;
    if (next.some((f) => !isContactAttachment(f))) error = labels.errors.type;
    else if (next.length > MAX_FILES) error = labels.errors.tooMany;
    else if (next.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) error = labels.errors.tooLarge;

    setErrors((e) => ({ ...e, attachments: error }));
    if (!error) setFiles(next);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
    setErrors((e) => ({ ...e, attachments: undefined }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    // A field people never see; bots tend to fill it in.
    if (data.get("website")) return;

    const value = (key: string) => String(data.get(key) ?? "").trim();
    const nextErrors: Partial<Record<Field, string>> = {};
    for (const key of ["name", "email", "reason", "message"] as const) {
      if (!value(key)) nextErrors[key] = labels.errors.required;
    }
    if (value("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value("email"))) nextErrors.email = labels.errors.email;
    if (value("phone") && !isPhone(value("phone"))) nextErrors.phone = labels.errors.phone;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }

    const body = new FormData();
    body.set("name", value("name"));
    body.set("email", value("email"));
    body.set("phone", value("phone"));
    body.set("reason", value("reason"));
    body.set("message", value("message"));
    body.set("language", lang);
    body.set("cf-turnstile-response", value("cf-turnstile-response"));
    for (const file of files) body.append("attachments", file);

    setStatus("sending");
    try {
      const result = await sendContactMessage(body);
      if (result.ok) {
        setSent({ email: value("email"), ticket: result.ticket });
        setStatus("sent");
        return;
      }
      setStatus(result.error === "verify" ? "unverified" : "failed");
    } catch (error) {
      console.error(error);
      setStatus("failed");
    }
    setTurnstileReset((n) => n + 1);
  }

  if (status === "sent") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-2xl outline-none border border-teal-600/30 bg-teal-100/50 p-8 text-center">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-teal-600 text-white">
          <Icon name="check" className="size-6" strokeWidth={2.4} />
        </span>
        <p className="mt-4 text-xl font-semibold text-navy-900">{labels.successTitle}</p>
        <p className="mt-2">{labels.successBody.replace("{ticket}", sent.ticket).replace("{email}", sent.email)}</p>
      </div>
    );
  }

  const total = files.reduce((sum, f) => sum + f.size, 0);
  const inputClass =
    "mt-1.5 w-full rounded-[10px] border border-line-200 bg-white px-3.5 py-2.5 text-[16px] text-navy-900 transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 aria-invalid:border-terracotta-600";

  // Ties each field to its error (or hint) so screen readers read it with the label.
  const describedBy = (field: Field, hasHint = false) =>
    errors[field] ? `${field}-error` : hasHint ? `${field}-hint` : undefined;
  const fieldProps = (field: Field, hasHint = false) => ({
    "aria-invalid": !!errors[field],
    "aria-required": true,
    "aria-describedby": describedBy(field, hasHint),
  });

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5" acceptCharset="UTF-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldBlock id="name" label={labels.name} error={errors.name}>
          <input id="name" name="name" autoComplete="name" className={inputClass} {...fieldProps("name")} />
        </FieldBlock>
        <FieldBlock id="email" label={labels.email} error={errors.email} hint={labels.emailHint}>
          <input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            className={`${inputClass} text-start`}
            {...fieldProps("email", true)}
          />
        </FieldBlock>
      </div>

      <FieldBlock id="phone" label={labels.phone} error={errors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          dir="ltr"
          autoComplete="tel"
          className={`${inputClass} text-start`}
          aria-invalid={!!errors.phone}
          aria-describedby={describedBy("phone")}
        />
      </FieldBlock>

      <FieldBlock id="reason" label={labels.reason} error={errors.reason}>
        <select id="reason" name="reason" defaultValue="" className={inputClass} {...fieldProps("reason")}>
          <option value="" disabled>
            {labels.reasonPlaceholder}
          </option>
          {labels.reasons.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
      </FieldBlock>

      <FieldBlock id="message" label={labels.message} error={errors.message}>
        <textarea id="message" name="message" rows={6} className={inputClass} {...fieldProps("message")} />
      </FieldBlock>

      <div>
        <p id="attachments-label" className="text-sm font-semibold text-navy-900">
          {labels.attachments}
        </p>
        <p id="attachments-hint" className="mt-0.5 text-sm text-slate-500">
          {labels.attachmentsHint}
        </p>
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-3 rounded-[10px] border border-line-200 bg-white px-3 py-2 text-sm"
              >
                <Icon name="file" className="size-4 text-slate-500" />
                <span className="min-w-0 flex-1 truncate text-navy-900">
                  <bdi>{file.name}</bdi>
                </span>
                <span className="text-slate-500">
                  <bdi>{formatSize(file.size, locale)}</bdi>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="rounded-md p-1 text-slate-500 hover:bg-sand-50 hover:text-navy-900"
                  aria-label={`${labels.remove} ${file.name}`}
                >
                  <Icon name="x" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {files.length < MAX_FILES && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            aria-describedby="attachments-label attachments-hint"
            className="mt-3 inline-flex items-center gap-2 rounded-[10px] border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold text-teal-700 hover:border-teal-600 hover:bg-teal-100/40"
          >
            <Icon name="file" className="size-4" />
            {labels.addFiles}
          </button>
        )}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={CONTACT_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => addFiles(e.target.files)}
        />
        {total > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            <bdi>
              {formatSize(total, locale)} / {formatSize(MAX_TOTAL_BYTES, locale)}
            </bdi>
          </p>
        )}
        {/* Announced as it appears: it follows a file pick, not a focus move. */}
        <p role="alert" className="mt-2 text-sm text-terracotta-600 empty:hidden">
          {errors.attachments}
        </p>
      </div>

      {/* Honeypot: hidden from people and screen readers. */}
      <div aria-hidden="true" className="sr-only">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Turnstile resetKey={turnstileReset} />

      {(status === "failed" || status === "unverified") && (
        <p role="alert" className="rounded-[10px] bg-terracotta-100 px-4 py-3 text-sm text-terracotta-600">
          {status === "unverified" ? labels.errors.verify : labels.error.replace("{email}", supportEmail)}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-teal-600 px-6 font-semibold text-white shadow-soft transition-colors hover:bg-teal-700 disabled:opacity-70 sm:w-auto"
      >
        {status === "sending" ? labels.sending : labels.submit}
      </button>
    </form>
  );
}

function FieldBlock({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-navy-900">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-terracotta-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
