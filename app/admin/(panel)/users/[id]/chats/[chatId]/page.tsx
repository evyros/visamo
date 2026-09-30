import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { caseChat, chatTitle, messageId } from "@/lib/admin-chats";
import { findUser } from "@/lib/admin-users";
import { formatDateTime, PageHeading, Pill } from "@/components/admin/admin-ui";
import { AnswerDetails } from "@/components/admin/answer-details";
import { ChatMarkdown, textDirection } from "@/components/app/chat-markdown";
import { Icon } from "@/components/icons";
import { LogoMark } from "@/components/logo";

export async function generateMetadata({ params }: PageProps<"/admin/users/[id]/chats/[chatId]">): Promise<Metadata> {
  const { id, chatId } = await params;
  const user = await findUser(id);
  const found = user?.caseId ? await caseChat(user.caseId, chatId) : null;
  return { title: found ? chatTitle(found.chat) : "Chat" };
}

// One of the case's chats, deleted or not, message by message: who asked
// what, and when, and under each answer what it took and was given.
export default async function AdminUserChatPage({ params }: PageProps<"/admin/users/[id]/chats/[chatId]">) {
  await requireAdmin();
  const { id, chatId } = await params;
  const user = await findUser(id);
  if (!user?.caseId) notFound();
  const found = await caseChat(user.caseId, chatId);
  if (!found) notFound();
  const { chat, messages } = found;

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href={`/users/${user.id}/chats`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
      >
        <Icon name="arrow" className="size-4 rotate-180" />
        Chats
      </Link>

      <PageHeading title={chatTitle(chat)}>
        Started {formatDateTime(chat.createdAt)}
        {chat.createdByName && ` by ${chat.createdByName}`}. {chat.messages}{" "}
        {chat.messages === 1 ? "message" : "messages"}.
        {chat.deletedAt && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill tone="slate">Deleted</Pill>
            {formatDateTime(chat.deletedAt)}
            {chat.deletedByName && ` by ${chat.deletedByName}`}. The couple no longer sees it.
          </div>
        )}
      </PageHeading>

      {messages.length > 0 ? (
        <ol className="mt-8 flex max-w-[760px] flex-col gap-6">
          {messages.map((message) =>
            message.role === "user" ? (
              <li key={message.id} id={messageId(message.id)} className="group flex scroll-mt-4 flex-col items-end">
                <span className="mb-1 pe-1 text-xs font-medium text-slate-500">
                  {message.authorName ?? "Deleted account"} · {formatDateTime(message.createdAt)}
                </span>
                <div className="max-w-[85%] rounded-2xl rounded-ee-md bg-teal-100 px-4 py-2.5 text-navy-900 group-target:ring-2 group-target:ring-amber-500">
                  <p dir={textDirection(message.content)} className="whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              </li>
            ) : (
              <li key={message.id} className="flex gap-3">
                <LogoMark className="size-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-slate-500">{formatDateTime(message.createdAt)}</span>
                  <div dir={textDirection(message.content)} className="mt-1 break-words text-slate-700">
                    <ChatMarkdown text={message.content} />
                  </div>
                  <AnswerDetails message={message} />
                </div>
              </li>
            ),
          )}
        </ol>
      ) : (
        <p className="mt-8 text-[15px] text-slate-500">No messages.</p>
      )}
    </div>
  );
}
