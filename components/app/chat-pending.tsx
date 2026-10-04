"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// A new chat the sidebar shows before the server has it: from the moment its
// first message is sent until a refresh brings the saved chat and its title.
// The chat page sets it; the sidebar shows it.

export type PendingChat = {
  /** Null until the server answers with the new chat's id. */
  id: string | null;
  /** The first message, standing in for the title. */
  title: string;
};

const PendingChatContext = createContext<{
  pending: PendingChat | null;
  setPending: (chat: PendingChat | null) => void;
}>({ pending: null, setPending: () => {} });

export function PendingChatProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingChat | null>(null);
  return <PendingChatContext value={{ pending, setPending }}>{children}</PendingChatContext>;
}

export const usePendingChat = () => useContext(PendingChatContext);
