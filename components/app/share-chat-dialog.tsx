"use client";

import { useEffect, useId, useRef, useState } from "react";
import { chatShareLink, shareChat } from "@/app/(app)/(main)/chat/actions";
import type { Locale } from "@/i18n/config";
import { formatDateTime } from "@/i18n/format";
import { format, type Messages } from "@/i18n/messages";
import { shareDurations, type ShareDuration } from "@/lib/chat/share-options";
import type { ShareLink } from "@/lib/chat/shares";
import { Icon } from "@/components/icons";
import { Notice } from "./auth-ui";
import { Dialog } from "./dialog";

/**
 * A public link to one chat (lib/chat/shares.ts): picks how long it works and
 * creates it, or shows the one the chat has, to copy. There's no stopping a
 * link: it expires, or the chat is deleted. Opens as it's mounted; mount a new
 * one for each chat.
 */
export function ShareChatDialog({
  chatId,
  locale,
  onClose,
  t,
}: {
  chatId: string;
  locale: Locale;
  onClose: () => void;
  t: Messages["app"]["chat"]["share"];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const name = useId();
  // undefined while it's looked up; null when the chat has no link.
  const [link, setLink] = useState<ShareLink | null | undefined>(undefined);
  const [duration, setDuration] = useState<ShareDuration>("1w");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
    chatShareLink(chatId).then(setLink, () => setFailed(true));
  }, [chatId]);

  async function create() {
    setBusy(true);
    setFailed(false);
    const created = await shareChat(chatId, duration).catch(() => null);
    if (created) setLink(created);
    else setFailed(true);
    setBusy(false);
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the link is selected in its field to copy by hand.
    }
  }

  return (
    <Dialog ref={dialog} title={t.title} closeLabel={t.close} onClose={onClose}>
      <div className="space-y-4">
        {failed && <Notice>{t.error}</Notice>}
        {link === undefined ? (
          !failed && <p className="text-[15px] text-slate-600">{t.loading}</p>
        ) : link === null ? (
          <>
            <p className="text-[15px] text-slate-700">{t.intro}</p>
            <fieldset>
              <legend className="text-sm font-semibold text-navy-900">{t.expiresAfter}</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {shareDurations.map((d) => (
                  <label key={d} className="cursor-pointer">
                    <input
                      type="radio"
                      name={name}
                      value={d}
                      checked={duration === d}
                      onChange={() => setDuration(d)}
                      className="peer sr-only"
                    />
                    <span className="flex h-10 items-center justify-center rounded-[10px] border border-line-200 text-[15px] text-navy-900 transition-colors peer-checked:border-teal-600 peer-checked:bg-teal-100 peer-checked:font-semibold peer-checked:text-teal-700 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600">
                      {t.durations[d]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center justify-end gap-4 text-[15px] font-semibold">
              <button type="button" onClick={() => dialog.current?.close()} className="text-slate-600 hover:underline">
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={create}
                disabled={busy}
                className="rounded-lg bg-navy-900 px-4 py-2 text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-line-200 disabled:text-slate-500"
              >
                {busy ? t.creating : t.create}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[15px] text-slate-700">
              {format(t.ready, { date: formatDateTime(link.expiresAt, locale) })}
            </p>
            <div className="flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="sr-only">{t.linkLabel}</span>
                {/* ph-mask: session recordings never show the link (components/posthog.tsx). */}
                <input
                  type="text"
                  readOnly
                  dir="ltr"
                  value={link.url}
                  onFocus={(event) => event.currentTarget.select()}
                  className="ph-mask block h-10 w-full rounded-[10px] border border-line-200 bg-sand-50 px-3 text-[15px] text-navy-900 focus-visible:outline-2 focus-visible:outline-teal-600"
                />
              </label>
              <button
                type="button"
                onClick={() => copy(link.url)}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-teal-600 px-3 text-[15px] font-semibold text-white transition-colors hover:bg-teal-700"
              >
                <Icon name="copy" className="size-4" />
                <span aria-live="polite">{copied ? t.copied : t.copy}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
