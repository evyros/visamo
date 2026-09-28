import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { maxMessageLength } from "@/lib/chat/plans";
import { chatBalance, chatMessages } from "@/lib/chat/store";
import { requireCase } from "@/lib/session";
import { localePath, site } from "@/lib/site";
import { ChatView } from "@/components/app/chat-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.chat };
}

// /chat is a new chat; /chat/<id> is one of the case's chats.
export default async function ChatPage({ params }: PageProps<"/chat/[[...id]]">) {
  const { id: segments } = await params;
  if (segments && segments.length > 1) notFound();
  const chatId = segments?.[0] ?? null;

  const { user, caseId } = await requireCase();
  const [t, locale, { plan, messagesLeft }, messages] = await Promise.all([
    getAppDictionary(),
    getAppLocale(),
    chatBalance(caseId),
    chatId ? chatMessages(chatId, caseId) : [],
  ]);
  if (!messages) notFound();

  return (
    <ChatView
      chatId={chatId}
      initialMessages={messages.map(({ id, role, content, userId, name }) => ({
        id,
        role,
        content,
        // Both partners write in the case's chats: name the other one's messages.
        author: role === "user" && userId !== user.id ? (name ?? t.app.chat.partner) : null,
      }))}
      messagesLeft={messagesLeft}
      maxLength={maxMessageLength(plan)}
      termsUrl={new URL(localePath(locale, "/legal/terms"), site.url).toString()}
      t={t.app.chat}
    />
  );
}
