import { LogoMark } from "@/components/logo";
import { ChatMarkdown, textDirection } from "./chat-markdown";

export type ChatMessageData = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** The other partner's name, for a message they wrote; null for the user's own. */
  author: string | null;
};

// One message of a chat, in the app (components/app/chat-view.tsx) and on a
// shared chat's public page (app/(app)/shared/[token]). A question with an
// author is the other partner's: white, under their name.
export function ChatMessage({ message, t }: { message: ChatMessageData; t: { you: string; assistant: string } }) {
  if (message.role === "user") {
    return (
      <li data-message-id={message.id} className="flex flex-col items-end">
        {message.author && (
          <span aria-hidden="true" className="mb-1 pe-1 text-xs font-medium text-slate-500">
            <bdi>{message.author}</bdi>
          </span>
        )}
        <div
          className={`max-w-[85%] rounded-2xl rounded-ee-md px-4 py-2.5 text-navy-900 ${
            message.author ? "border border-line-200 bg-white" : "bg-teal-100"
          }`}
        >
          <span className="sr-only">{message.author ?? t.you}: </span>
          <p dir={textDirection(message.content)} className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
      </li>
    );
  }
  return (
    <li className="flex gap-3">
      <ChatAvatar />
      <div dir={textDirection(message.content)} className="min-w-0 flex-1 break-words pt-1 text-slate-700">
        <span className="sr-only">{t.assistant}: </span>
        <ChatMarkdown text={message.content} />
      </div>
    </li>
  );
}

export function ChatAvatar() {
  return <LogoMark className="size-8 shrink-0" />;
}
