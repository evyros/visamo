import type { ReactNode } from "react";
import { getAppDictionary } from "@/i18n/app-locale";
import { format } from "@/i18n/messages";
import { chatBalance, listChats } from "@/lib/chat/store";
import { requireCase } from "@/lib/session";
import { ChatHistory } from "@/components/app/chat-history";
import { PendingChatProvider } from "@/components/app/chat-pending";
import { SectionShell } from "@/components/app/section-shell";
import { ButtonLink, TextLink } from "@/components/ui";

// The sidebar: new chat, the case's chats (both partners see them all), and
// the messages left with a way to buy more. The chat page refreshes it after
// each answer.
export default async function ChatLayout({ children }: { children: ReactNode }) {
  const { caseId } = await requireCase();
  const [t, chats, { messagesLeft }] = await Promise.all([
    getAppDictionary(),
    listChats(caseId),
    chatBalance(caseId),
  ]);
  const c = t.app.chat;
  return (
    // Shared by the sidebar and the chat page, for a new chat's stand-in entry.
    <PendingChatProvider>
      <SectionShell
        title={c.nav}
        labels={{ open: t.app.shell.sectionMenu, close: t.app.shell.closeSectionMenu }}
        sidebar={
          <div className="flex flex-1 flex-col gap-6">
            <ButtonLink href="/chat" size="sm" icon="compose">
              {c.newChat}
            </ButtonLink>
            <ChatHistory
              chats={chats}
              t={{
                history: c.history,
                noChats: c.noChats,
                newChat: c.newChat,
                deleteChatNamed: c.deleteChatNamed,
                deleteConfirm: c.deleteConfirm,
              }}
            />
            <div className="mt-auto border-t border-line-200 px-1 pt-4 text-[15px]">
              <p className="mb-1 text-sm text-slate-500">
                {messagesLeft === 1 ? c.messagesLeftOne : format(c.messagesLeft, { count: messagesLeft })}
              </p>
              <TextLink href="/settings/billing">{c.buyMore}</TextLink>
            </div>
          </div>
        }
      >
        {children}
      </SectionShell>
    </PendingChatProvider>
  );
}
