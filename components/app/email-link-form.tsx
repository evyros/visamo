"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { format } from "@/i18n/messages";
import { rich } from "@/i18n/rich";
import { Icon } from "@/components/icons";
import { Field, Notice, SubmitButton, describe, inputClass, isEmail } from "./auth-ui";
import { authErrorMessage, type AuthLabels } from "./auth-errors";

// Asks for an email and sends it a link: the sign-up link (magic link) or a
// password reset link. Then shows "check your email" in place of the form.

type Kind = "signup" | "reset";

async function send(kind: Kind, email: string) {
  if (kind === "signup") {
    return authClient.signIn.magicLink({
      email,
      callbackURL: "/",
      newUserCallbackURL: "/set-password",
      errorCallbackURL: "/signup",
    });
  }
  return authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
}

export function EmailLinkForm({
  kind,
  t,
  submitLabel,
  lead,
  defaultEmail,
  children,
}: {
  kind: Kind;
  t: AuthLabels;
  submitLabel: string;
  /** Shown above the form and hidden once the link is sent, e.g. "Continue with Google". */
  lead?: ReactNode;
  defaultEmail?: string;
  /** Shown under the button, e.g. the terms consent. */
  children?: ReactNode;
}) {
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [resent, setResent] = useState(false);
  const sentRef = useRef<HTMLDivElement>(null);

  // The form is replaced by the confirmation; move focus so it's announced.
  useEffect(() => {
    if (sentTo) sentRef.current?.focus();
  }, [sentTo]);

  async function submit(email: string) {
    setPending(true);
    setFormError(undefined);
    const { error } = await send(kind, email);
    setPending(false);
    if (error) {
      setFormError(authErrorMessage(error, t));
      return false;
    }
    return true;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("email") as HTMLInputElement;
    const email = input.value.trim();
    const problem = !email ? t.errors.required : !isEmail(email) ? t.errors.email : undefined;
    setError(problem);
    if (problem) {
      input.focus();
      return;
    }
    if (await submit(email)) setSentTo(email);
  }

  async function resend() {
    setResent(false);
    if (await submit(sentTo)) setResent(true);
  }

  if (sentTo) {
    const title = kind === "signup" ? t.checkEmail.title : t.forgot.sentTitle;
    const body = kind === "signup" ? t.checkEmail.body : t.forgot.sentBody;
    return (
      <div ref={sentRef} tabIndex={-1} className="space-y-4 text-center outline-none">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <Icon name="mail" className="size-6" />
        </span>
        <h2 className="text-xl font-semibold text-navy-900">{title}</h2>
        <p>{rich(format(body, { email: sentTo }))}</p>
        <p className="text-sm text-slate-600">{t.checkEmail.spam}</p>
        {formError && <Notice>{formError}</Notice>}
        {resent && <Notice tone="success">{t.checkEmail.resent}</Notice>}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-teal-700">
          <button type="button" onClick={resend} disabled={pending} className="underline-offset-4 hover:underline">
            {pending ? t.sending : t.checkEmail.resend}
          </button>
          <button
            type="button"
            onClick={() => {
              setSentTo("");
              setResent(false);
              setFormError(undefined);
            }}
            className="underline-offset-4 hover:underline"
          >
            {t.checkEmail.changeEmail}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {lead}
      {formError && <Notice>{formError}</Notice>}
      <Field id="email" label={t.email} error={error}>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          defaultValue={defaultEmail}
          className={`${inputClass} text-start`}
          {...describe("email", error)}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel={t.sending}>
        {submitLabel}
      </SubmitButton>
      {children}
    </form>
  );
}
