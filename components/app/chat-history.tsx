"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type CSSProperties, type ToggleEvent } from "react";
import { deleteChat } from "@/app/(app)/(main)/chat/actions";
import type { Locale } from "@/i18n/config";
import { format, type Messages } from "@/i18n/messages";
import { Icon } from "@/components/icons";
import { usePendingChat } from "./chat-pending";
import { LinkPendingHighlight } from "./link-pending";
import { ShareChatDialog } from "./share-chat-dialog";

export type ChatSummary = { id: string; title: string | null };

/**
 * The case's chats in the sidebar, latest first, each with a menu to share or
 * delete it. A chat that's just been started shows on top at once, titled with
 * its first message, until the saved chat and its real title arrive.
 */
export function ChatHistory({
  chats,
  locale,
  t,
}: {
  chats: ChatSummary[];
  locale: Locale;
  t: Pick<Messages["app"]["chat"], "history" | "noChats" | "newChat" | "chatMenu" | "shareChat" | "delete" | "deleteConfirm" | "share">;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [deleting, startTransition] = useTransition();
  const [sharing, setSharing] = useState<string | null>(null);
  const { pending, setPending } = usePendingChat();
  const saved = !!pending?.id && chats.some((chat) => chat.id === pending.id);

  // The saved chat is in the list now: it takes over from the stand-in.
  useEffect(() => {
    if (saved) setPending(null);
  }, [saved, setPending]);

  function remove(id: string) {
    if (!window.confirm(t.deleteConfirm)) return;
    startTransition(async () => {
      await deleteChat(id);
      if (pathname === `/chat/${id}`) router.replace("/chat");
    });
  }

  return (
    <section aria-labelledby="chat-history" className="min-h-0">
      <h2 id="chat-history" className="px-1 text-sm font-semibold text-slate-500">
        {t.history}
      </h2>
      {chats.length === 0 && !pending ? (
        <p className="mt-2 px-1 text-sm text-slate-500">{t.noChats}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-0.5" aria-busy={deleting}>
          {pending && !saved && (
            <li className="group">
              {pathname === "/chat" || pathname === `/chat/${pending.id}` ? (
                // The chat on screen, so not a link. Deleting waits for it to be saved.
                <span
                  aria-current="page"
                  className="block rounded-lg bg-teal-100 px-3 py-2 text-[15px] font-medium text-teal-700"
                >
                  <SlidingTitle text={pending.title} />
                </span>
              ) : (
                // The user went elsewhere while it was being answered.
                <Link
                  href={pending.id ? `/chat/${pending.id}` : "/chat"}
                  className="relative block rounded-lg px-3 py-2 text-[15px] text-slate-700 transition-colors hover:bg-sand-50 hover:text-navy-900"
                >
                  <SlidingTitle text={pending.title} />
                  <LinkPendingHighlight />
                </Link>
              )}
            </li>
          )}
          {chats.map((chat) => {
            const active = pathname === `/chat/${chat.id}`;
            const title = chat.title ?? t.newChat;
            return (
              <li key={chat.id} className="group relative">
                <Link
                  href={`/chat/${chat.id}`}
                  aria-current={active ? "page" : undefined}
                  // The title takes the whole row; on a desktop the ⋯ button shows over its end.
                  className={`relative block rounded-lg py-2 ps-3 pe-10 text-[15px] transition-colors lg:pe-3 ${
                    // The whole row, ⋯ button included, keeps the hover color, and so does an open menu.
                    active
                      ? "bg-teal-100 font-medium text-teal-700"
                      : "text-slate-700 group-hover:bg-sand-50 group-hover:text-navy-900 group-has-[[aria-expanded=true]]:bg-sand-50 group-has-[[aria-expanded=true]]:text-navy-900"
                  }`}
                >
                  <SlidingTitle text={title} menu />
                  <LinkPendingHighlight />
                </Link>
                <ChatMenu
                  label={format(t.chatMenu, { title })}
                  disabled={deleting}
                  onShare={() => setSharing(chat.id)}
                  onDelete={() => remove(chat.id)}
                  t={t}
                />
              </li>
            );
          })}
        </ul>
      )}
      {sharing && (
        <ShareChatDialog key={sharing} chatId={sharing} locale={locale} onClose={() => setSharing(null)} t={t.share} />
      )}
    </section>
  );
}

/**
 * How long a title takes to slide, in seconds. CSS can't turn the distance
 * into a time, so it comes from the title's length: about 7.5px a character,
 * past the ~160px a desktop row shows, at 40px a second.
 */
const slideTime = (text: string) => Math.max(1, (text.length * 7.5 - 160) / 40);

/**
 * A chat's title on one line, across the whole row: it fades out at the end
 * when it doesn't fit, and slides to show the rest while the row is hovered.
 * All in CSS (.chat-title in app/globals.css). `menu`: the row has a ⋯ button,
 * which covers the end of a hovered row on a desktop.
 */
function SlidingTitle({ text, menu = false }: { text: string; menu?: boolean }) {
  return (
    <span
      className="chat-title"
      data-menu={menu || undefined}
      style={{ "--slide-time": `${slideTime(text)}s` } as CSSProperties}
    >
      <bdi>{text}</bdi>
    </span>
  );
}

/**
 * A chat's ⋯ menu. It opens as a popover, above the page, so the sidebar's
 * scrolling can't clip it: under the button, or above it near the bottom of
 * the window. It closes when the sidebar scrolls, which would leave it behind.
 */
function ChatMenu({
  label,
  disabled,
  onShare,
  onDelete,
  t,
}: {
  label: string;
  disabled: boolean;
  onShare: () => void;
  onDelete: () => void;
  t: { shareChat: string; delete: string };
}) {
  const id = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const stopListening = useRef<(() => void) | null>(null);

  // A row can go while its menu is open (the partner deleted the chat): its listeners go too.
  useEffect(() => () => stopListening.current?.(), []);

  // Before the popover opens: line its end up with the button's.
  function place(button: HTMLElement) {
    const menu = menuRef.current;
    if (!menu) return;
    const box = button.getBoundingClientRect();
    const below = window.innerHeight - box.bottom > 120;
    const rtl = getComputedStyle(button).direction === "rtl";
    Object.assign(menu.style, {
      top: below ? `${box.bottom + 4}px` : "auto",
      bottom: below ? "auto" : `${window.innerHeight - box.top + 4}px`,
      left: rtl ? `${box.left}px` : "auto",
      right: rtl ? "auto" : `${document.documentElement.clientWidth - box.right}px`,
    });
  }

  function onToggle(event: ToggleEvent<HTMLDivElement>) {
    stopListening.current?.();
    stopListening.current = null;
    setOpen(event.newState === "open");
    if (event.newState !== "open") return;
    const sidebar = event.currentTarget.closest("aside");
    const close = () => menuRef.current?.hidePopover();
    sidebar?.addEventListener("scroll", close);
    window.addEventListener("resize", close);
    stopListening.current = () => {
      sidebar?.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
    menuRef.current?.querySelector("button")?.focus();
  }

  function choose(action: () => void) {
    menuRef.current?.hidePopover();
    action();
  }

  const item = "flex w-full items-center gap-2.5 px-3 py-2 text-start text-[15px] hover:bg-navy-900/5";

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        onClick={(event) => place(event.currentTarget)}
        disabled={disabled}
        aria-label={label}
        aria-expanded={open}
        // On a desktop it shows once the row has been hovered for a moment,
        // as a long title starts to slide (SlidingTitle), and while its menu is open.
        className={`absolute inset-y-0 end-1 my-auto inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:text-black lg:opacity-0 lg:transition-opacity lg:duration-0 lg:group-hover:opacity-100 lg:group-hover:delay-300 lg:group-hover:duration-150 lg:focus-visible:opacity-100 ${
          open ? "lg:opacity-100" : ""
        }`}
      >
        <Icon name="more" className="size-4" />
      </button>
      <div
        ref={menuRef}
        id={id}
        popover="auto"
        onToggle={onToggle}
        className="fixed m-0 w-40 overflow-hidden rounded-[10px] border border-line-200 bg-white p-0 py-1 shadow-soft"
      >
        <button type="button" onClick={() => choose(onShare)} className={`${item} text-navy-900`}>
          <Icon name="share" className="size-4 shrink-0" />
          {t.shareChat}
        </button>
        <button type="button" onClick={() => choose(onDelete)} className={`${item} text-terracotta-600`}>
          <Icon name="trash" className="size-4 shrink-0" />
          {t.delete}
        </button>
      </div>
    </>
  );
}
