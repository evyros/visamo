"use client";

import { useActionState } from "react";
import { Field, Notice, SubmitButton, inputClass } from "@/components/app/auth-ui";
import { requestLoginLink } from "../actions";

export function AdminLoginForm({ linkFailed }: { linkFailed: boolean }) {
  const [state, action, pending] = useActionState(requestLoginLink, null);

  if (state?.sent) {
    return (
      <Notice tone="success">
        If those details are right, a login link is on its way to the admin email. Open it in this browser within 15 minutes.
      </Notice>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {linkFailed && <Notice>That link didn’t work. It may have expired, or been opened in another browser.</Notice>}
      <Field id="email" label="Email">
        <input id="email" name="email" type="email" required autoComplete="email" dir="ltr" className={inputClass} />
      </Field>
      <Field id="otp" label="OTP" hint="The 6-digit code from your authenticator app">
        <input
          id="otp"
          name="otp"
          required
          inputMode="numeric"
          pattern="[0-9 ]*"
          maxLength={7}
          autoComplete="one-time-code"
          aria-describedby="otp-hint"
          dir="ltr"
          className={`${inputClass} tracking-widest`}
        />
      </Field>
      <SubmitButton pending={pending} pendingLabel="Sending…">
        Email me a login link
      </SubmitButton>
    </form>
  );
}
