"use client";

import { useActionState, useState, type ReactNode } from "react";
import { giveConsent } from "@/app/(app)/access/actions";
import { Icon, type IconName } from "@/components/icons";
import { ButtonLink } from "@/components/ui";
import { SubmitButton } from "./auth-ui";

// The support-access question (app/(app)/access/[token]). Meant to read like
// a permission prompt, not a contract: what we'll see, for how long, and one
// sentence to agree to. "Not now" records nothing; the link keeps working.

type Copy = {
  title: string;
  intro: string;
  reasonLabel: string;
  reason: string | null;
  rows: readonly { icon: IconName; label: string; body: string }[];
  agree: string;
};

type Labels = {
  allow: string;
  allowing: string;
  notNow: string;
  declinedTitle: string;
  declinedBody: string;
  declinedBack: string;
  backToFile: string;
};

export function AccessConsent({ token, copy, labels }: { token: string; copy: Copy; labels: Labels }) {
  const [, action, pending] = useActionState(giveConsent, null);
  const [agreed, setAgreed] = useState(false);
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <AccessMessage icon="info" title={labels.declinedTitle} body={labels.declinedBody}>
        <button
          type="button"
          onClick={() => setDeclined(false)}
          className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-teal-600 px-6 text-base font-semibold text-white shadow-soft transition-colors hover:bg-teal-700"
        >
          {labels.declinedBack}
        </button>
        <ButtonLink href="/file" variant="secondary" className="w-full">
          {labels.backToFile}
        </ButtonLink>
      </AccessMessage>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="token" value={token} />
      <div className="text-center">
        <Badge icon="shield" />
        <h1 className="mt-4 font-display text-[26px] leading-tight font-semibold text-balance text-navy-900">
          {copy.title}
        </h1>
        <p className="mt-3 text-[16px] text-slate-700">{copy.intro}</p>
      </div>

      {copy.reason && (
        <div className="rounded-xl border-s-4 border-teal-600 bg-sand-50 px-4 py-3">
          <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{copy.reasonLabel}</div>
          <p className="mt-1 text-[16px] text-navy-900">{copy.reason}</p>
        </div>
      )}

      <ul className="space-y-4">
        {copy.rows.map((row) => (
          <li key={row.label} className="flex gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <Icon name={row.icon} className="size-5" />
            </span>
            <div className="text-[15px] leading-snug">
              <div className="font-semibold text-navy-900">{row.label}</div>
              <div className="mt-0.5 text-slate-600">{row.body}</div>
            </div>
          </li>
        ))}
      </ul>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-200 p-4 transition-colors has-checked:border-teal-600 has-checked:bg-teal-100/40">
        <input
          type="checkbox"
          name="agree"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
          className="mt-1 size-5 shrink-0 accent-teal-600"
        />
        <span className="text-[15px] font-medium text-navy-900">{copy.agree}</span>
      </label>

      <div className="space-y-3">
        <SubmitButton pending={pending} pendingLabel={labels.allowing} disabled={!agreed || pending}>
          {labels.allow}
        </SubmitButton>
        <button
          type="button"
          onClick={() => setDeclined(true)}
          className="block w-full py-2 text-center text-[15px] font-semibold text-slate-600 underline-offset-4 hover:underline"
        >
          {labels.notNow}
        </button>
      </div>
    </form>
  );
}

function Badge({ icon, tone = "teal" }: { icon: IconName; tone?: "teal" | "success" | "neutral" }) {
  const tones = {
    teal: "bg-teal-100 text-teal-700",
    success: "bg-teal-600 text-white",
    neutral: "bg-sand-50 text-slate-600 ring-1 ring-line-200",
  };
  return (
    <span className={`mx-auto inline-flex size-14 items-center justify-center rounded-full ${tones[tone]}`}>
      <Icon name={icon} className="size-7" />
    </span>
  );
}

/** How a request ended, or why the link doesn't work: an icon, a line, and what to do next. */
export function AccessMessage({
  icon,
  tone = "neutral",
  title,
  body,
  children,
}: {
  icon: IconName;
  tone?: "success" | "neutral";
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <Badge icon={icon} tone={tone} />
        <h1 className="mt-4 font-display text-[26px] leading-tight font-semibold text-balance text-navy-900">{title}</h1>
        <p className="mt-3 text-[16px] text-slate-700">{body}</p>
      </div>
      {children && <div className="space-y-3">{children}</div>}
    </div>
  );
}
