"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Field, Notice, SubmitButton, describe, inputClass, isEmail } from "./auth-ui";
import { authErrorMessage, type AuthLabels } from "./auth-errors";
import { PasswordInput } from "./password-input";

export function LoginForm({ t }: { t: AuthLabels }) {
  const router = useRouter();
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    const next: typeof errors = {};
    if (!email) next.email = t.errors.required;
    else if (!isEmail(email)) next.email = t.errors.email;
    if (!password) next.password = t.errors.required;
    setErrors(next);
    if (next.email || next.password) {
      form.querySelector<HTMLElement>(`[name="${next.email ? "email" : "password"}"]`)?.focus();
      return;
    }

    setPending(true);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setErrors({ form: authErrorMessage(error, t) });
      setPending(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {errors.form && <Notice>{errors.form}</Notice>}
      <Field id="email" label={t.email} error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          className={`${inputClass} text-start`}
          {...describe("email", errors.email)}
        />
      </Field>
      <Field id="password" label={t.password} error={errors.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          labels={{ show: t.showPassword, hide: t.hidePassword }}
          {...describe("password", errors.password)}
        />
      </Field>
      <div className="-mt-2 text-end">
        <Link href="/forgot-password" className="text-sm font-semibold text-teal-700 underline-offset-4 hover:underline">
          {t.login.forgot}
        </Link>
      </div>
      <SubmitButton pending={pending} pendingLabel={t.login.submit}>
        {t.login.submit}
      </SubmitButton>
    </form>
  );
}
