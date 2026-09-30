import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { allCaseChats, chatHref, chatTitle, type AdminChat } from "@/lib/admin-chats";
import { findUser } from "@/lib/admin-users";
import { formatDateTime, PageHeading, Pill, Stat } from "@/components/admin/admin-ui";

export async function generateMetadata({ params }: PageProps<"/admin/users/[id]/chats">): Promise<Metadata> {
  const user = await findUser((await params).id);
  return { title: user ? `${user.name}: chats` : "Chats" };
}

// The case's chats with the assistant, as both partners see them, plus the
// ones they deleted.
export default async function AdminUserChatsPage({ params }: PageProps<"/admin/users/[id]/chats">) {
  await requireAdmin();
  const user = await findUser((await params).id);
  if (!user) notFound();

  if (!user.caseId) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeading title="Chats">
          {user.name} hasn’t finished onboarding, so there’s no case and no chats yet.
        </PageHeading>
      </div>
    );
  }

  const chats = await allCaseChats(user.caseId);
  const deleted = chats.filter((c) => c.deletedAt).length;
  const messages = chats.reduce((total, c) => total + c.messages, 0);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading title="Chats">The case’s, shared by both partners. Latest first.</PageHeading>

      <div className="mt-6 grid grid-cols-3 gap-3 md:max-w-[640px]">
        <Stat label="Chats" value={chats.length} />
        <Stat label="Deleted" value={deleted} />
        <Stat label="Messages" value={messages} note="Questions and answers" />
      </div>

      <div className="mt-8 overflow-x-auto rounded-card border border-line-200 bg-white">
        <table className="w-full min-w-[760px] text-[15px]">
          <thead className="border-b border-line-200 bg-sand-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start">Chat</th>
              <th className="px-4 py-3 text-end">Messages</th>
              <th className="px-4 py-3 text-start">Started</th>
              <th className="px-4 py-3 text-start">Last message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-200 text-slate-700">
            {chats.map((c) => (
              <ChatRow key={c.id} chat={c} userId={user.id} />
            ))}
            {chats.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  No chats yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChatRow({ chat, userId }: { chat: AdminChat; userId: string }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-2.5">
        <Link href={chatHref(userId, chat.id)} dir="auto" className="font-semibold text-teal-700 hover:underline">
          {chatTitle(chat)}
        </Link>
        {chat.deletedAt && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Pill tone="slate">Deleted</Pill>
            {formatDateTime(chat.deletedAt)}
            {chat.deletedByName && ` by ${chat.deletedByName}`}
          </div>
        )}
      </td>
      <td className="px-4 py-2.5 text-end tabular-nums">{chat.messages}</td>
      <td className="px-4 py-2.5 text-sm">
        <div className="whitespace-nowrap">{formatDateTime(chat.createdAt)}</div>
        <div className="text-slate-500">{chat.createdByName ?? "—"}</div>
      </td>
      <td className="whitespace-nowrap px-4 py-2.5 text-sm">{formatDateTime(chat.updatedAt)}</td>
    </tr>
  );
}
