"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { deleteChat } from "@/app/(app)/(main)/chat/actions";
import { format } from "@/i18n/messages";
import { Icon } from "@/components/icons";
import { usePendingChat } from "./chat-pending";
import { LinkPendingHighlight } from "./link-pending";

export type ChatSummary = { id: string; title: string | null };

/**
 * The case's chats in the sidebar, latest first, each with a delete button.
 * A chat that's just been started shows on top at once, titled with its first
 * message, until the saved chat and its real title arrive.
 */
export function ChatHistory({
  chats,
  t,
}: {
  chats: ChatSummary[];
  t: { history: string; noChats: string; newChat: string; deleteChatNamed: string; deleteConfirm: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [deleting, startTransition] = useTransition();
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
            <li>
              {pathname === "/chat" || pathname === `/chat/${pending.id}` ? (
                // The chat on screen, so not a link. Deleting waits for it to be saved.
                <span
                  aria-current="page"
                  className="block truncate rounded-lg bg-teal-100 py-2 ps-3 pe-10 text-[15px] font-medium text-teal-700"
                >
                  <bdi>{pending.title}</bdi>
                </span>
              ) : (
                // The user went elsewhere while it was being answered.
                <Link
                  href={pending.id ? `/chat/${pending.id}` : "/chat"}
                  className="relative block truncate rounded-lg py-2 ps-3 pe-10 text-[15px] text-slate-700 transition-colors hover:bg-sand-50 hover:text-navy-900"
                >
                  <bdi>{pending.title}</bdi>
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
                  className={`relative block truncate rounded-lg py-2 ps-3 pe-10 text-[15px] transition-colors ${
                    active ? "bg-teal-100 font-medium text-teal-700" : "text-slate-700 hover:bg-sand-50 hover:text-navy-900"
                  }`}
                >
                  <bdi>{title}</bdi>
                  <LinkPendingHighlight />
                </Link>
                <button
                  type="button"
                  onClick={() => remove(chat.id)}
                  disabled={deleting}
                  aria-label={format(t.deleteChatNamed, { title })}
                  className={`absolute inset-y-0 end-1 my-auto inline-flex size-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-terracotta-600 focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 ${
                    active ? "lg:opacity-100" : ""
                  }`}
                >
                  <Icon name="trash" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
