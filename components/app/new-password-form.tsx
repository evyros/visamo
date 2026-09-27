"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { setPassword } from "@/app/(app)/actions";
import { authClient } from "@/lib/auth-client";
import { Field, Notice, SubmitButton, describe } from "./auth-ui";
import { authErrorMessage, type AuthLabels } from "./auth-errors";
import { PasswordInput } from "./password-input";

// The two password fields. `set` finishes an email sign-up (the user is
// signed in); `reset` uses the token from a reset email.

type Props = { t: AuthLabels; submitLabel: string } & ({ mode: "set" } | { mode: "reset"; token: string });

export function NewPasswordForm(props: Props) {
  const { t, submitLabel } = props;
  const router = useRouter();
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    const next: typeof errors = {};
    if (!password) next.password = t.errors.required;
    else if (password.length < 8) next.password = t.errors.passwordShort;
    else if (password.length > 128) next.password = t.errors.passwordLong;
    if (!next.password && password !== confirm) next.confirm = t.errors.passwordMismatch;
    setErrors(next);
    if (next.password || next.confirm) {
      form.querySelector<HTMLElement>(`[name="${next.password ? "password" : "confirm"}"]`)?.focus();
      return;
    }

    setPending(true);
    if (props.mode === "set") {
      // Redirects into the app on success.
      const result = await setPassword(password);
      if (result?.error) setErrors({ form: t.errors[result.error] });
    } else {
      const { error } = await authClient.resetPassword({ newPassword: password, token: props.token });
      if (!error) {
        router.replace("/login?reset=done");
        return;
      }
      setErrors({ form: error.code === "INVALID_TOKEN" ? t.reset.invalid : authErrorMessage(error, t) });
    }
    setPending(false);
  }

  const labels = { show: t.showPassword, hide: t.hidePassword };
  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {errors.form && <Notice>{errors.form}</Notice>}
      <Field id="password" label={t.newPassword} error={errors.password} hint={t.passwordHint}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          labels={labels}
          {...describe("password", errors.password, true)}
        />
      </Field>
      <Field id="confirm" label={t.confirmPassword} error={errors.confirm}>
        <PasswordInput
          id="confirm"
          name="confirm"
          autoComplete="new-password"
          labels={labels}
          {...describe("confirm", errors.confirm)}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel={t.saving}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
