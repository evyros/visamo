"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { format } from "@/i18n/messages";

// The case's messages left, shared by the sidebar and the box to ask in, so a
// message sent takes one off both at once rather than when the answer ends.
// A refresh (after an answer, or a purchase) brings the server's count.

const ChatBalanceContext = createContext<{
  messagesLeft: number;
  setMessagesLeft: (update: number | ((left: number) => number)) => void;
}>({ messagesLeft: 0, setMessagesLeft: () => {} });

export function ChatBalanceProvider({ messagesLeft: initial, children }: { messagesLeft: number; children: ReactNode }) {
  const [messagesLeft, setMessagesLeft] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setMessagesLeft(initial);
  }
  return <ChatBalanceContext value={{ messagesLeft, setMessagesLeft }}>{children}</ChatBalanceContext>;
}

export const useChatBalance = () => useContext(ChatBalanceContext);

/** "12 messages left", or the singular. */
export function messagesLeftText(count: number, t: { messagesLeft: string; messagesLeftOne: string }) {
  return count === 1 ? t.messagesLeftOne : format(t.messagesLeft, { count });
}

export function MessagesLeft({ t }: { t: { messagesLeft: string; messagesLeftOne: string } }) {
  return <>{messagesLeftText(useChatBalance().messagesLeft, t)}</>;
}
