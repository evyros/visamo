"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { format, type Messages } from "@/i18n/messages";
import { Icon } from "@/components/icons";
import { LogoMark } from "@/components/logo";
import { messagesLeftText, useChatBalance } from "./chat-balance";
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
  // Shared with the sidebar: a message sent comes off both at once.
  const { messagesLeft, setMessagesLeft } = useChatBalance();
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
  // The box shows the count only once it runs low; it's always in the section menu.
  const lowOnMessages = messagesLeft < LOW_MESSAGES;
  const disclaimerHidden = useDisclaimerHidden();
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
    // 24px from the top, the list's top padding (pt-6): the first question is
    // already there, so it doesn't move, before or after the answer.
    const top = () =>
      question.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 24;
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
    setMessagesLeft((left) => left - 1);
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
      // Not spent after all, unless the balance had run out.
      setMessagesLeft((left) => (code === "noMessages" ? 0 : left + 1));
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

      {/* No top padding here: it would add to the full height (flex-1) and
          always leave a little to scroll. The list and the greeting bring their own. */}
      <div className="mx-auto flex w-full max-w-[768px] flex-1 flex-col px-4 sm:px-6">
        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center pt-16 pb-10 text-center">
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
          <ol ref={listRef} className="flex flex-col gap-6 pt-6 pb-6" aria-live="polite" aria-busy={streaming}>
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

          {lowOnMessages && !outOfMessages && (
            <p className="mb-2 ps-1 text-xs text-slate-500 sm:hidden">{messagesLeftText(messagesLeft, t)}</p>
          )}

          {outOfMessages ? (
            <div className="rounded-2xl border border-line-200 bg-white px-4 py-4 text-[15px] shadow-soft">
              <p className="text-navy-900">{t.noMessages}</p>
              <BuyLink className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-teal-600 px-4 text-[15px] font-semibold text-white transition-colors hover:bg-teal-700">
                {t.buyMore}
              </BuyLink>
            </div>
          ) : (
            // On a phone the send button sits beside the text, to keep the box one line high.
            <form
              onSubmit={onSubmit}
              className="flex items-end rounded-2xl border border-line-200 bg-white shadow-soft focus-within:border-teal-600 sm:block"
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
                className="block max-h-48 min-h-14 w-full min-w-0 flex-1 resize-none bg-transparent px-4 py-4 text-base text-navy-900 [field-sizing:content] placeholder:text-slate-500 focus:outline-none sm:pb-1"
              />
              <div className="flex shrink-0 items-center justify-between gap-3 pe-2.5 pb-2.5 sm:px-3 sm:pb-3">
                {lowOnMessages && <p className="hidden ps-1 text-xs text-slate-500 sm:block">{messagesLeftText(messagesLeft, t)}</p>}
                <div className="ms-auto flex items-center gap-3">
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

          {/* Only a phone can hide it: there it costs room, a desktop keeps it. */}
          <div className={`mt-2 items-start justify-center gap-1 ${disclaimerHidden ? "hidden sm:flex" : "flex"}`}>
            <p className="text-center text-xs text-slate-500">
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
            <button
              type="button"
              onClick={hideDisclaimer}
              aria-label={t.hideDisclaimer}
              className="-mt-[3px] inline-flex size-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-line-200 hover:text-navy-900 sm:hidden"
            >
              <Icon name="x" className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const LOW_MESSAGES = 5;

// On a phone the note under the box can be hidden, and stays hidden on this
// device. It renders hidden on the server, so a returning reader never sees it flash.
const DISCLAIMER_KEY = "visamo.chatDisclaimerHidden";
const disclaimerListeners = new Set<() => void>();
let disclaimerHiddenNow = false;

function useDisclaimerHidden() {
  return useSyncExternalStore(
    (listener) => {
      disclaimerListeners.add(listener);
      return () => disclaimerListeners.delete(listener);
    },
    () => {
      if (disclaimerHiddenNow) return true;
      try {
        return localStorage.getItem(DISCLAIMER_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => true,
  );
}

function hideDisclaimer() {
  disclaimerHiddenNow = true;
  try {
    localStorage.setItem(DISCLAIMER_KEY, "1");
  } catch {
    // Storage can be blocked; then it's hidden until the page reloads.
  }
  for (const listener of disclaimerListeners) listener();
}

// Smooth scrolling, unless the user asked for less motion.
function motion(): ScrollBehavior {
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function Avatar() {
  return <LogoMark className="size-8 shrink-0" />;
}
