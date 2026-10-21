"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createRequest, inviteFriend } from "@/app/[lang]/tools/recommendation-letter/actions";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import { isEmail, isPersonName } from "@/lib/letters/rules";
import { Icon } from "../icons";
import { Turnstile } from "../turnstile";
import { ErrorNote, Field, describe, inputBase, inputClass, primaryButton } from "./fields";

// The couple's side of the recommendation letters tool: their names and the
// email letters go to, then the link for their friends. The app's documents
// page links here with ?n1=&n2=&email= filled in, so a signed-in couple
// doesn't type them again, and ?from=app, for the stats. They're read after the page loads, so the form
// itself is in the page's HTML. Changing the email makes a new link: the old one
// would keep sending to the old address.

type Labels = Messages["letters"]["tool"];
type Field = "name1" | "name2" | "email";
type Created = { id: string; link: string; email: string | null };

export function RequestForm({ labels, lang }: { labels: Labels; lang: Locale }) {
  const f = labels.form;
  const [values, setValues] = useState<Record<Field, string>>({ name1: "", name2: "", email: "" });
  const [fromApp, setFromApp] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "failed" | "unverified">("idle");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [created, setCreated] = useState<Created | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValues((v) => ({
      name1: params.get("n1") ?? v.name1,
      name2: params.get("n2") ?? v.name2,
      email: params.get("email") ?? v.email,
    }));
    setFromApp(params.get("from") === "app");
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const clean = (key: Field) => values[key].trim().replace(/\s+/g, " ");

    const next: Partial<Record<Field, string>> = {};
    for (const key of ["name1", "name2"] as const) {
      if (!clean(key)) next[key] = f.errors.required;
      else if (!isPersonName(clean(key))) next[key] = f.errors.name;
    }
    // Optional: without it, friends download the letter and send it themselves.
    if (clean("email") && !isEmail(clean("email"))) next.email = f.errors.email;
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
      return;
    }

    const body = new FormData();
    body.set("name1", clean("name1"));
    body.set("name2", clean("name2"));
    body.set("email", clean("email"));
    body.set("language", lang);
    body.set("source", fromApp ? "app" : "site");
    body.set("cf-turnstile-response", String(data.get("cf-turnstile-response") ?? ""));

    setStatus("sending");
    try {
      const result = await createRequest(body);
      if (result.ok) {
        setCreated(result);
        setStatus("idle");
        return;
      }
      setStatus(result.error === "verify" ? "unverified" : "failed");
    } catch (error) {
      console.error(error);
      setStatus("failed");
    }
    setTurnstileReset((n) => n + 1);
  }

  if (created) {
    return (
      <SharePanel
        labels={labels.share}
        created={created}
        onEdit={() => {
          setCreated(null);
          setTurnstileReset((n) => n + 1);
        }}
      />
    );
  }

  const input = (key: Field, props: Record<string, unknown>) => (
    <input
      id={key}
      value={values[key]}
      onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
      className={inputClass}
      aria-required={key !== "email"}
      // A name follows its own script once typed; empty, the example follows the page.
      dir={key !== "email" && values[key] ? "auto" : undefined}
      {...describe(key, errors[key], key !== "name1")}
      {...props}
    />
  );

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-navy-900">{f.title}</h2>
      <Field id="name1" label={f.name1} error={errors.name1}>
        {input("name1", { autoComplete: "given-name", maxLength: 60, placeholder: f.name1Placeholder })}
      </Field>
      <Field id="name2" label={f.name2} error={errors.name2} hint={f.namesHint}>
        {input("name2", { autoComplete: "off", maxLength: 60, placeholder: f.name2Placeholder })}
      </Field>
      <Field id="email" label={f.email} error={errors.email} hint={f.emailHint}>
        {input("email", { type: "email", dir: "ltr", autoComplete: "email", className: `${inputClass} text-start` })}
      </Field>

      <Turnstile resetKey={turnstileReset} />
      {status === "failed" && <ErrorNote>{f.errors.failed}</ErrorNote>}
      {status === "unverified" && <ErrorNote>{f.errors.verify}</ErrorNote>}

      <button type="submit" disabled={status === "sending"} className={`${primaryButton} w-full`}>
        {status === "sending" ? f.sending : f.submit}
      </button>
    </form>
  );
}

function SharePanel({ labels, created, onEdit }: { labels: Labels["share"]; created: Created; onEdit: () => void }) {
  const [copied, setCopied] = useState(false);
  const [friend, setFriend] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [invited, setInvited] = useState<string[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // The form is replaced by the link, so focus moves to it.
  useEffect(() => titleRef.current?.focus(), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(created.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // No clipboard access (an old browser, a denied permission): the link
      // is in the box, selected, to copy by hand.
      document.querySelector<HTMLInputElement>("#letter-link")?.select();
    }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = friend.trim();
    if (!isEmail(email)) return setInviteError(labels.inviteErrors.email);
    setSending(true);
    setInviteError(null);
    try {
      const result = await inviteFriend(created.id, email);
      if (result.ok) {
        setInvited((list) => [...list, email]);
        setFriend("");
      } else {
        setInviteError(labels.inviteErrors[result.error]);
      }
    } catch (error) {
      console.error(error);
      setInviteError(labels.inviteErrors.failed);
    }
    setSending(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 ref={titleRef} tabIndex={-1} className="text-xl font-semibold text-navy-900 outline-none">
          {labels.title}
        </h2>
        <p className="mt-2 text-[16px]">{labels.body}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="letter-link"
          readOnly
          value={created.link}
          dir="ltr"
          aria-label={labels.title}
          onFocus={(e) => e.target.select()}
          className={`${inputBase} ph-mask min-w-0 text-start text-[15px] sm:flex-1`}
        />
        <button type="button" onClick={copy} className={`${primaryButton} shrink-0`}>
          <Icon name={copied ? "check" : "copy"} className="size-5" />
          <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
        </button>
      </div>

      <p className="text-[15px] text-slate-700">
        {created.email ? (
          <>
            {labels.sentTo.split("{email}")[0]}
            <bdi className="font-semibold text-navy-900">{created.email}</bdi>
            {labels.sentTo.split("{email}")[1]}
          </>
        ) : (
          labels.noEmail
        )}{" "}
        <button type="button" onClick={onEdit} className="font-semibold text-teal-700 hover:underline">
          {created.email ? labels.edit : labels.addEmail}
        </button>
      </p>

      <p className="rounded-[10px] bg-sand-50 px-4 py-3 text-[15px]">{labels.tip}</p>

      <form noValidate onSubmit={invite} className="border-t border-line-200 pt-6">
        <h3 className="font-semibold text-navy-900">{labels.inviteTitle}</h3>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Field id="friend" label={labels.inviteLabel} error={inviteError ?? undefined}>
              <input
                id="friend"
                type="email"
                dir="ltr"
                autoComplete="off"
                value={friend}
                onChange={(e) => setFriend(e.target.value)}
                className={`${inputClass} text-start`}
                {...describe("friend", inviteError ?? undefined)}
              />
            </Field>
          </div>
          <button type="submit" disabled={sending} className={`${primaryButton} shrink-0 sm:mb-0`}>
            <Icon name="send" className="size-5" />
            {sending ? labels.inviteSending : labels.inviteSubmit}
          </button>
        </div>
        {invited.length > 0 && (
          <ul aria-live="polite" className="mt-3 space-y-1 text-sm text-teal-700">
            {invited.map((email, i) => (
              <li key={`${email}-${i}`} className="flex items-center gap-1.5">
                <Icon name="check" className="size-4" />
                {labels.invited.split("{email}")[0]}
                <bdi>{email}</bdi>
                {labels.invited.split("{email}")[1]}
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}
