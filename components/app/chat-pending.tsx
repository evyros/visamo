"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// A new chat the sidebar shows before the server has it: from the moment its
// first message is sent until a refresh brings the saved chat and its title.
// The chat page sets it; the sidebar shows it.
//
// Once answered, the new chat moves to its own URL, and the page there mounts
// the chat view anew. The old view hands over what it had on screen (the
// handoff), so the conversation stays put and nothing typed is lost.

export type PendingChat = {
  /** Null until the server answers with the new chat's id. */
  id: string | null;
  /** The first message, standing in for the title. */
  title: string;
};

export type ChatHandoff = {
  chatId: string;
  /** Where the conversation was scrolled to. */
  scrollTop: number;
  /** What was in the box to ask in. */
  input: string;
};

const PendingChatContext = createContext<{
  pending: PendingChat | null;
  setPending: (chat: PendingChat | null) => void;
  handoff: ChatHandoff | null;
  setHandoff: (handoff: ChatHandoff | null) => void;
}>({ pending: null, setPending: () => {}, handoff: null, setHandoff: () => {} });

export function PendingChatProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingChat | null>(null);
  const [handoff, setHandoff] = useState<ChatHandoff | null>(null);
  return (
    <PendingChatContext value={{ pending, setPending, handoff, setHandoff }}>{children}</PendingChatContext>
  );
}

export const usePendingChat = () => useContext(PendingChatContext);
