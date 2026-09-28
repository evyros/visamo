"use client";

import { useState, type FormEvent } from "react";
import { changePassword } from "@/app/(app)/(main)/settings/actions";
import type { Messages } from "@/i18n/messages";
import { Field, Notice, SubmitButton, describe } from "./auth-ui";
import type { AuthLabels } from "./auth-errors";
import { PasswordInput } from "./password-input";

type Errors = { current?: string; password?: string; form?: string };

export function ChangePasswordForm({
  t,
  auth,
}: {
  t: Messages["app"]["settings"]["accountPage"];
  auth: AuthLabels;
}) {
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const current = String(data.get("current") ?? "");
    const password = String(data.get("password") ?? "");

    const next: Errors = {};
    if (!current) next.current = auth.errors.required;
    if (!password) next.password = auth.errors.required;
    else if (password.length < 8) next.password = auth.errors.passwordShort;
    else if (password.length > 128) next.password = auth.errors.passwordLong;
    setErrors(next);
    setDone(false);
    if (next.current || next.password) {
      form.querySelector<HTMLElement>(`[name="${next.current ? "current" : "password"}"]`)?.focus();
      return;
    }

    setPending(true);
    const { error } = await changePassword(current, password);
    setPending(false);
    if (error === "wrongPassword") {
      setErrors({ current: t.wrongPassword });
      form.querySelector<HTMLElement>('[name="current"]')?.focus();
    } else if (error) {
      setErrors({ form: auth.errors[error] });
    } else {
      form.reset();
      setDone(true);
    }
  }

  const labels = { show: auth.showPassword, hide: auth.hidePassword };
  return (
    <form noValidate onSubmit={onSubmit} className="max-w-md space-y-5">
      {errors.form && <Notice>{errors.form}</Notice>}
      {done && <Notice tone="success">{t.passwordChanged}</Notice>}
      <Field id="current" label={t.currentPassword} error={errors.current}>
        <PasswordInput
          id="current"
          name="current"
          autoComplete="current-password"
          labels={labels}
          {...describe("current", errors.current)}
        />
      </Field>
      <Field id="password" label={t.newPassword} error={errors.password} hint={auth.passwordHint}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          labels={labels}
          {...describe("password", errors.password, true)}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel={auth.saving} className="sm:w-auto">
        {t.savePassword}
      </SubmitButton>
    </form>
  );
}
