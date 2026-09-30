"use client";

import { useActionState, useState } from "react";
import { requestAccess } from "@/app/admin/(panel)/users/[id]/access/actions";
import { accessDurations, accessReasons, durationLabels, reasonLabels } from "@/lib/support-access-options";
import { Notice, Select, SubmitButton } from "@/components/app/auth-ui";

// Creates a support-access link for the user's case: how long the team may
// look, optionally why (the page names it in their language), and which
// partners get it by email. The link is shown once, to copy into a chat.

type Member = { id: string; name: string; email: string };

export function AccessRequestForm({ userId, members }: { userId: string; members: Member[] }) {
  const [state, action, pending] = useActionState(requestAccess, null);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="userId" value={userId} />
      {state && "error" in state && <Notice>{state.error}</Notice>}
      {state && "url" in state && <CreatedLink {...state} />}

      <fieldset>
        <legend className="text-sm font-semibold text-navy-900">For how long, from when they agree</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {accessDurations.map((hours) => (
            <label
              key={hours}
              className="cursor-pointer rounded-full border border-line-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition-colors has-checked:border-teal-600 has-checked:bg-teal-100 has-checked:text-teal-700 has-focus-visible:outline-2 has-focus-visible:outline-teal-600"
            >
              <input
                type="radio"
                name="duration"
                value={hours}
                defaultChecked={hours === 24}
                className="sr-only"
              />
              {durationLabels[hours]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block max-w-[420px] text-sm font-semibold text-navy-900">
        Reason <span className="font-normal text-slate-500">(optional)</span>
        <Select name="reason" defaultValue="">
          <option value="">No reason</option>
          {accessReasons.map((reason) => (
            <option key={reason} value={reason}>
              {reasonLabels[reason]}
            </option>
          ))}
        </Select>
        <span className="mt-1.5 block text-sm font-normal text-slate-500">They see it in their own language.</span>
      </label>

      {members.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold text-navy-900">Email it to</legend>
          <div className="mt-2 space-y-2">
            {members.map((member) => (
              <label key={member.id} className="flex items-center gap-2.5 text-[15px] text-slate-700">
                <input type="checkbox" name="emailTo" value={member.id} defaultChecked className="size-4 accent-teal-600" />
                <span>
                  <span className="font-semibold text-navy-900">{member.name}</span>{" "}
                  <span className="text-slate-500">{member.email}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <SubmitButton pending={pending} pendingLabel="Creating…" className="sm:w-auto">
        Create link
      </SubmitButton>
    </form>
  );
}

function CreatedLink({ url, emailed, failed }: { url: string; emailed: string[]; failed: string[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-3 rounded-[10px] border border-teal-600/30 bg-teal-100/50 p-4 text-[15px] text-navy-900" role="status">
      <p>
        Link created{emailed.length > 0 && <> and emailed to {emailed.join(" and ")}</>}. It’s shown only now: creating
        another one cancels it.
      </p>
      {failed.length > 0 && <p className="font-semibold text-terracotta-600">The email to {failed.join(" and ")} failed.</p>}
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          dir="ltr"
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 rounded-[10px] border border-line-200 bg-white px-3 py-2 text-sm text-navy-900"
        />
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          }}
          className="shrink-0 rounded-[10px] bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-900/90"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
