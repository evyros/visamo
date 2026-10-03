"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { format, type Messages } from "@/i18n/messages";
import { Icon } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { ChatMarkdown, textDirection } from "./chat-markdown";
import { usePendingChat } from "./chat-pending";
import { BuyLink } from "./purchase";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** The other partner's name, for a message they wrote; null for the user's own. */
  author: string | null;
};
type ErrorKey = keyof Messages["app"]["chat"]["errors"];

// The conversation and the box to ask in, laid out like a chat app: messages
// scroll, the box stays at the bottom. The answer streams in from /api/chat
// as plain text. A new chat shows in the sidebar as soon as it's sent, titled
// with its first message. Once the answer is saved, the chat moves to its own
// URL and the sidebar is refreshed, which brings the real title.
export function ChatView({
  chatId,
  initialMessages,
  draft,
  suggestions,
  messagesLeft: initialMessagesLeft,
  maxLength,
  termsUrl,
  t,
}: {
  chatId: string | null;
  initialMessages: Message[];
  /** What the box starts with: a question begun from a document's card, or nothing. */
  draft: string;
  /** The questions a new chat suggests, picked from the case. */
  suggestions: string[];
  messagesLeft: number;
  maxLength: number;
  termsUrl: string;
  t: Messages["app"]["chat"];
}) {
  const router = useRouter();
  const { setPending } = usePendingChat();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState(draft);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [messagesLeft, setMessagesLeft] = useState(initialMessagesLeft);
  // A purchase refreshes the page with the new balance.
  const [lastInitial, setLastInitial] = useState(initialMessagesLeft);
  if (initialMessagesLeft !== lastInitial) {
    setLastInitial(initialMessagesLeft);
    setMessagesLeft(initialMessagesLeft);
  }
  const endRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // The question just sent: it scrolls to the top of the view and its answer
  // comes in below it, without moving the page under the reader. Room is made
  // under a short answer so the question can get there.
  const [pinned, setPinned] = useState<string | null>(null);
  // Whether the end of the conversation is in view; if not, a button scrolls to it.
  const [atEnd, setAtEnd] = useState(true);

  const outOfMessages = messagesLeft <= 0;
  // The character count only shows once the message is close to the limit.
  const nearLimit = input.length >= maxLength * 0.9;
  const waiting = streaming && messages.at(-1)?.role === "user";
  const empty = messages.length === 0;

  // Where the scroll stops with the last message just above the box to ask in,
  // leaving out the room made for a pinned question.
  function contentEnd(scroller: HTMLElement) {
    const spacerTop = spacerRef.current?.getBoundingClientRect().top ?? 0;
    const bottom = spacerTop - scroller.getBoundingClientRect().top + scroller.scrollTop;
    return bottom + (composerRef.current?.offsetHeight ?? 0) - scroller.clientHeight;
  }

  // Calls back when the view, the conversation or the box to ask in changes size.
  function observeSizes(scroller: HTMLElement, callback: () => void) {
    const observer = new ResizeObserver(callback);
    for (const element of [scroller, listRef.current, composerRef.current]) if (element) observer.observe(element);
    return () => observer.disconnect();
  }

  // Open a chat at its latest message, with the cursor after a draft, to go on writing.
  useLayoutEffect(() => {
    const scroller = endRef.current?.closest("main");
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
    const box = inputRef.current;
    box?.setSelectionRange(box.value.length, box.value.length);
  }, []);

  useEffect(() => {
    const scroller = endRef.current?.closest("main");
    if (!scroller) return;
    const onScroll = () => setAtEnd(contentEnd(scroller) - scroller.scrollTop < 8);
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const unobserve = observeSizes(scroller, onScroll);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      unobserve();
    };
  }, [empty]);

  useLayoutEffect(() => {
    const scroller = endRef.current?.closest("main");
    const spacer = spacerRef.current;
    const question = pinned && scroller?.querySelector(`[data-message-id="${pinned}"]`);
    if (!scroller || !spacer) return;
    if (!question) {
      spacer.style.height = "0px";
      return;
    }
    const top = () =>
      question.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 16;
    // Keep just enough room under the answer for the question to stay at the
    // top: it shrinks as the answer grows, so the page doesn't move.
    const fit = () => {
      spacer.style.height = `${Math.max(0, top() - contentEnd(scroller))}px`;
    };
    fit();
    scroller.scrollTo({ top: top(), behavior: motion() });
    return observeSizes(scroller, fit);
  }, [pinned]);

  function scrollToEnd() {
    const scroller = endRef.current?.closest("main");
    scroller?.scrollTo({ top: contentEnd(scroller), behavior: motion() });
  }

  async function ask(message: string) {
    const text = message.trim();
    if (!text || streaming || outOfMessages || text.length > maxLength) return;
    setError(null);
    setStreaming(true);
    const messageId = crypto.randomUUID();
    setMessages((list) => [...list, { id: messageId, role: "user", content: text, author: null }]);
    setPinned(messageId);
    setInput("");
    const isNew = !chatId;
    if (isNew) setPending({ id: null, title: text });

    let response: Response | null = null;
    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: text }),
      });
    } catch {
      // Offline, or the server couldn't be reached.
    }

    if (!response?.ok || !response.body) {
      const code = (await response?.json().catch(() => null))?.error as string | undefined;
      const key: ErrorKey =
        code === "tooLong" || code === "noMessages" || code === "failed" ? code : "generic";
      if (code === "noMessages") setMessagesLeft(0);
      // The message wasn't sent: take it back into the box, and out of the sidebar.
      if (isNew) setPending(null);
      setMessages((list) => list.filter((m) => m.id !== messageId));
      setPinned(null);
      setInput(text);
      setError(key);
      setStreaming(false);
      return;
    }

    const newChatId = response.headers.get("X-Chat-Id");
    if (isNew && newChatId) setPending({ id: newChatId, title: text });
    const left = Number(response.headers.get("X-Messages-Left"));
    if (Number.isFinite(left)) setMessagesLeft(left);

    const answerId = crypto.randomUUID();
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let answer = "";
    try {
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        answer += chunk.value;
        const content = answer;
        setMessages((list) =>
          list.at(-1)?.id === answerId
            ? [...list.slice(0, -1), { id: answerId, role: "assistant", content, author: null }]
            : [...list, { id: answerId, role: "assistant", content, author: null }],
        );
      }
    } catch {
      setError("cutOff");
    }
    setStreaming(false);

    // The chat and the answer are saved now: refresh the sidebar for the real
    // title, and give a new chat its own URL (which renders the same
    // messages), unless the user has gone to another page meanwhile.
    if (isNew && newChatId && window.location.pathname === "/chat") router.replace(`/chat/${newChatId}`);
    router.refresh();
    inputRef.current?.focus();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a line. Not while an IME is composing a character.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      ask(input);
    }
  }

  const [before, after] = t.disclaimer.split("{terms}");

  return (
    <div className="flex min-h-full flex-col">
      <h1 className="sr-only">{t.nav}</h1>

      <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col px-4 pt-6 sm:px-6">
        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <Icon name="chat" className="size-6" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{t.greeting}</h2>
            <p className="mt-2 max-w-md text-slate-500">{t.greetingIntro}</p>
            {!outOfMessages && (
              <ul className="mt-8 flex w-full max-w-xl flex-col gap-2">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => ask(suggestion)}
                      disabled={streaming}
                      className="w-full rounded-xl border border-line-200 bg-white px-4 py-3 text-start text-[15px] text-slate-700 transition-colors hover:border-teal-600 hover:text-navy-900"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <ol ref={listRef} className="flex flex-col gap-6 pb-6" aria-live="polite" aria-busy={streaming}>
            {messages.map((message) =>
              message.role === "user" ? (
                <li key={message.id} data-message-id={message.id} className="flex flex-col items-end">
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
              ) : (
                <li key={message.id} className="flex gap-3">
                  <Avatar />
                  <div
                    dir={textDirection(message.content)}
                    className="min-w-0 flex-1 break-words pt-1 text-slate-700"
                  >
                    <span className="sr-only">{t.assistant}: </span>
                    <ChatMarkdown text={message.content} />
                  </div>
                </li>
              ),
            )}
            {waiting && (
              <li className="flex gap-3">
                <Avatar />
                <span className="flex items-center gap-1 pt-1" role="status">
                  <span className="sr-only">{t.writing}</span>
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="size-2 animate-bounce rounded-full bg-slate-300"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
              </li>
            )}
          </ol>
        )}
        <div ref={spacerRef} aria-hidden="true" />
        <div ref={endRef} />
      </div>

      <div ref={composerRef} className="sticky bottom-0 bg-gradient-to-t from-sand-50 from-70% to-transparent pt-4">
        <div className="relative mx-auto w-full max-w-[768px] px-4 pb-3 sm:px-6">
          {!empty && !atEnd && (
            <button
              type="button"
              onClick={scrollToEnd}
              aria-label={t.scrollDown}
              className="absolute bottom-full left-1/2 mb-4 inline-flex size-9 -translate-x-1/2 items-center justify-center rounded-full border border-line-200 bg-white text-navy-900 shadow-soft transition-colors hover:bg-sand-50"
            >
              <Icon name="arrowDown" className="size-[18px]" />
            </button>
          )}
          {error && (
            <p role="alert" className="mb-2 rounded-lg bg-terracotta-100 px-3 py-2 text-[15px] text-terracotta-600">
              {t.errors[error]}
            </p>
          )}

          {outOfMessages ? (
            <div className="rounded-2xl border border-line-200 bg-white px-4 py-4 text-[15px] shadow-soft">
              <p className="text-navy-900">{t.noMessages}</p>
              <BuyLink className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-teal-600 px-4 text-[15px] font-semibold text-white transition-colors hover:bg-teal-700">
                {t.buyMore}
              </BuyLink>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-line-200 bg-white shadow-soft focus-within:border-teal-600"
            >
              <label htmlFor="chat-input" className="sr-only">
                {t.inputLabel}
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                // An empty box resolves "auto" to left-to-right, so the
                // placeholder takes the page's direction until something is typed.
                dir={input ? "auto" : undefined}
                rows={1}
                value={input}
                maxLength={maxLength}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t.placeholder}
                aria-describedby={nearLimit ? "chat-count" : undefined}
                autoFocus
                className="block max-h-48 min-h-14 w-full resize-none bg-transparent px-4 pt-4 pb-1 text-base text-navy-900 [field-sizing:content] placeholder:text-slate-500 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3 px-3 pb-3">
                <p className="ps-1 text-xs text-slate-500">
                  {messagesLeft === 1 ? t.messagesLeftOne : format(t.messagesLeft, { count: messagesLeft })}
                </p>
                <div className="flex items-center gap-3">
                  {nearLimit && (
                    <span
                      id="chat-count"
                      className={`text-xs tabular-nums ${input.length >= maxLength ? "text-terracotta-600" : "text-slate-500"}`}
                    >
                      {format(t.characters, { count: input.length, max: maxLength })}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={streaming || !input.trim()}
                    aria-label={t.send}
                    className="inline-flex size-9 items-center justify-center rounded-full bg-teal-600 text-white transition-colors hover:bg-teal-700 disabled:bg-slate-300"
                  >
                    <Icon name="send" className="size-[18px]" />
                  </button>
                </div>
              </div>
            </form>
          )}

          <p className="mt-2 text-center text-xs text-slate-500">
            {before}
            <a
              href={termsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-teal-700 underline underline-offset-2"
            >
              {t.terms}
              <span className="sr-only"> {t.newWindow}</span>
            </a>
            {after}
          </p>
        </div>
      </div>
    </div>
  );
}

// Smooth scrolling, unless the user asked for less motion.
function motion(): ScrollBehavior {
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function Avatar() {
  return <LogoMark className="size-8 shrink-0" />;
}
