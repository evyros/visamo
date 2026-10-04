"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { format } from "@/i18n/messages";
import { rich } from "@/i18n/rich";
import { Icon } from "@/components/icons";
import { Field, Notice, SubmitButton, describe, inputClass } from "./auth-ui";
import { authErrorMessage, type AuthLabels } from "./auth-errors";

// The second step of a password login: the 6-digit code we emailed (the
// two-factor plugin in lib/auth.ts). The first code went out when the
// password was accepted. The login waits for it for 10 minutes.

export function LoginCodeForm({ email, t, onBack }: { email: string; t: AuthLabels; onBack: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The password form is replaced by this one; move focus to the code.
  useEffect(() => inputRef.current?.focus(), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = (inputRef.current?.value ?? "").replace(/\s/g, "");
    const problem = !code ? t.errors.required : !/^\d{6}$/.test(code) ? t.errors.codeInvalid : undefined;
    setError(problem);
    setFormError(undefined);
    setResent(false);
    if (problem) {
      inputRef.current?.focus();
      return;
    }

    setPending(true);
    const { error } = await authClient.twoFactor.verifyOtp({ code });
    if (error) {
      setFormError(authErrorMessage(error, t));
      setPending(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function resend() {
    setSending(true);
    setFormError(undefined);
    setResent(false);
    const { error } = await authClient.twoFactor.sendOtp();
    setSending(false);
    if (error) setFormError(authErrorMessage(error, t));
    else setResent(true);
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-4 text-center">
        <span className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <Icon name="mail" className="size-6" />
        </span>
        <h2 className="text-xl font-semibold text-navy-900">{t.code.title}</h2>
        <p>{rich(format(t.code.intro, { email }))}</p>
        <p className="text-sm text-slate-600">{t.checkEmail.spam}</p>
      </div>
      {formError && <Notice>{formError}</Notice>}
      {resent && <Notice tone="success">{t.code.resent}</Notice>}
      <Field id="code" label={t.code.label} error={error}>
        <input
          ref={inputRef}
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          dir="ltr"
          className={`${inputClass} text-center text-xl tracking-[0.5em]`}
          {...describe("code", error)}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel={t.code.submit}>
        {t.code.submit}
      </SubmitButton>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-teal-700">
        <button type="button" onClick={resend} disabled={sending} className="underline-offset-4 hover:underline">
          {sending ? t.sending : t.code.resend}
        </button>
        <button type="button" onClick={onBack} className="underline-offset-4 hover:underline">
          {t.code.back}
        </button>
      </div>
    </form>
  );
}
