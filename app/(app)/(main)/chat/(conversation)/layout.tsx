import type { ReactNode } from "react";
import { getAppDictionary } from "@/i18n/app-locale";
import { chatBalance, listChats } from "@/lib/chat/store";
import { requireCase } from "@/lib/session";
import { ChatBalanceProvider, MessagesLeft } from "@/components/app/chat-balance";
import { ChatHistory } from "@/components/app/chat-history";
import { PendingChatProvider } from "@/components/app/chat-pending";
import { SectionShell } from "@/components/app/section-shell";
import { BuyLink } from "@/components/app/purchase";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";

// The sidebar: new chat, the case's chats (both partners see them all), and
// the messages left with a way to buy more. The chat page refreshes it after
// each answer, and takes a message off the count as soon as it's sent.
export default async function ChatLayout({ children }: { children: ReactNode }) {
  const { caseId } = await requireCase();
  const [t, chats, { messagesLeft }] = await Promise.all([
    getAppDictionary(),
    listChats(caseId),
    chatBalance(caseId),
  ]);
  const c = t.app.chat;
  return (
    // Shared by the sidebar and the chat page: a new chat's stand-in entry, and
    // the messages left.
    <PendingChatProvider>
      <ChatBalanceProvider messagesLeft={messagesLeft}>
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
                  <MessagesLeft t={{ messagesLeft: c.messagesLeft, messagesLeftOne: c.messagesLeftOne }} />
                </p>
                <BuyLink className="inline-flex items-center gap-1.5 font-semibold text-teal-700 underline-offset-4 hover:underline">
                  {c.buyMore}
                  <Icon name="arrow" className="size-4" />
                </BuyLink>
              </div>
            </div>
          }
        >
          {children}
        </SectionShell>
      </ChatBalanceProvider>
    </PendingChatProvider>
  );
}
