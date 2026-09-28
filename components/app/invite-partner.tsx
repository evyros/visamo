"use client";

import { useState, type FormEvent } from "react";
import { cancelInvite, invitePartner, resendInvite, type InviteResult } from "@/app/(app)/(main)/settings/actions";
import type { Messages } from "@/i18n/messages";
import { rich } from "@/i18n/rich";
import { Field, Notice, SubmitButton, describe, inputClass, isEmail } from "./auth-ui";
import type { AuthLabels } from "./auth-errors";
import { secondaryButton } from "./settings-ui";

type Labels = Messages["app"]["settings"]["partnerPage"];

function errorMessage(error: NonNullable<InviteResult["error"]>, t: Labels, auth: AuthLabels) {
  if (error === "email") return auth.errors.email;
  if (error === "generic") return auth.errors.generic;
  return t.errors[error];
}

/** The partner's email. The invite's language follows their citizenship (see invitePartner). */
export function InviteForm({
  t,
  auth,
}: {
  t: Labels;
  auth: AuthLabels;
}) {
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const problem = !email ? auth.errors.required : !isEmail(email) ? auth.errors.email : undefined;
    setEmailError(problem);
    setFormError(undefined);
    if (problem) {
      form.querySelector<HTMLElement>('[name="email"]')?.focus();
      return;
    }

    setPending(true);
    // On success the page re-renders with the pending invite in place of the form.
    const { error } = await invitePartner(email);
    setPending(false);
    if (error === "email" || error === "ownEmail") {
      setEmailError(errorMessage(error, t, auth));
      form.querySelector<HTMLElement>('[name="email"]')?.focus();
    } else if (error) {
      setFormError(errorMessage(error, t, auth));
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="max-w-md space-y-5">
      {formError && <Notice>{formError}</Notice>}
      <Field id="email" label={t.email} error={emailError}>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="off"
          className={`${inputClass} text-start`}
          {...describe("email", emailError)}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel={t.sending} className="sm:w-auto">
        {t.send}
      </SubmitButton>
    </form>
  );
}

/** An invite that's out: who it went to, and ways to send it again or take it back. */
export function PendingInvite({
  t,
  auth,
  title,
  body,
}: {
  t: Labels;
  auth: AuthLabels;
  title: string;
  body: string;
}) {
  const [pending, setPending] = useState<"resend" | "cancel">();
  const [notice, setNotice] = useState<{ tone: "error" | "success"; text: string }>();

  async function resend() {
    setPending("resend");
    setNotice(undefined);
    const { error } = await resendInvite();
    setPending(undefined);
    setNotice(error ? { tone: "error", text: errorMessage(error, t, auth) } : { tone: "success", text: t.resent });
  }

  async function cancel() {
    setPending("cancel");
    // The page re-renders with the form in place of the invite.
    await cancelInvite();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-navy-900">{rich(title)}</p>
        <p className="mt-1 text-slate-700">{body}</p>
      </div>
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={resend} disabled={!!pending} className={secondaryButton}>
          {pending === "resend" ? t.sending : t.resend}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={!!pending}
          className="inline-flex h-11 items-center px-3 text-[15px] font-semibold text-terracotta-600 underline-offset-4 hover:underline disabled:opacity-70"
        >
          {t.cancel}
        </button>
      </div>
    </div>
  );
}
