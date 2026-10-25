import type { Metadata } from "next";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import type { Messages } from "@/i18n/messages";
import { findSharedChat } from "@/lib/chat/shares";
import { localePath, site } from "@/lib/site";
import { ChatMessage } from "@/components/app/chat-messages";
import { Icon } from "@/components/icons";
import { buttonClass } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/shared/[token]">): Promise<Metadata> {
  const { token } = await params;
  const [shared, t] = await Promise.all([findSharedChat(token), getAppDictionary()]);
  return { title: shared?.title ?? t.app.shared.untitled };
}

// A chat shared by its couple (lib/chat/shares.ts), read-only and as it is
// now, for anyone with the link. Every question looks the same: no one's name
// is shown. Below it, a way into Visamo, then the note that it isn't legal
// advice. A link that expired, or whose chat was deleted, shows the same as
// one that never existed.
export default async function SharedChatPage({ params }: PageProps<"/shared/[token]">) {
  const { token } = await params;
  const [shared, dictionary, locale] = await Promise.all([findSharedChat(token), getAppDictionary(), getAppLocale()]);
  const t = dictionary.app.shared;
  const cta = <JoinCard t={t.cta} />;

  if (!shared) {
    return (
      <div className="flex flex-col items-center gap-10 pt-8 text-center sm:pt-16">
        <div>
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <Icon name="chat" className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-navy-900">{t.unavailable.title}</h1>
          <p className="mt-2 text-slate-600">{t.unavailable.body}</p>
        </div>
        {cta}
      </div>
    );
  }

  const c = dictionary.app.chat;
  const [before, after] = c.disclaimer.split("{terms}");
  const termsUrl = new URL(localePath(locale, "/legal/terms"), site.url).toString();

  return (
    <>
      <div className="border-b border-line-200 pb-5">
        <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">
          <bdi>{shared.title ?? t.untitled}</bdi>
        </h1>
      </div>
      <ol className="flex flex-col gap-6 py-6">
        {shared.messages.map((message) => (
          <ChatMessage key={message.id} message={{ ...message, author: null }} t={{ you: t.question, assistant: c.assistant }} />
        ))}
      </ol>
      {cta}
      <p className="mt-8 text-center text-xs text-slate-500">
        {before}
        <a href={termsUrl} target="_blank" rel="noopener" className="font-medium text-teal-700 underline underline-offset-2">
          {c.terms}
          <span className="sr-only"> {c.newWindow}</span>
        </a>
        {after}
      </p>
    </>
  );
}

/** Into Visamo: sign-up, which takes someone already signed in straight into the app. */
function JoinCard({ t }: { t: Messages["app"]["shared"]["cta"] }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-line-200 bg-linear-to-b from-white to-sand-50 px-6 pt-12 pb-8 text-center sm:py-10">
      <QuestionBubble />
      <AnswerBubble />
      <div className="relative">
        <h2 className="font-display text-lg font-semibold text-navy-900 sm:text-xl">{t.title}</h2>
        <p className="mt-1 text-slate-600">{t.body}</p>
        {/* A full page load, not a <Link>: the root layout (lang, dir) was
            rendered in the shared chat's language, and the app opens in the
            visitor's own. No ?lang= for the same reason. */}
        <a href={new URL("/signup", site.appUrl).toString()} className={`${buttonClass("primary", "sm")} mt-4`}>
          {t.start}
        </a>
      </div>
    </div>
  );
}

// The card's drawing: a question in one corner and its answer in the other,
// both pointing in toward the text, and kept off it. Decoration only, with the
// theme's colors; it mirrors in RTL (flip-rtl), so the question stays at the start.
const art = "pointer-events-none absolute h-auto select-none flip-rtl";

function QuestionBubble() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true" className={`${art} -start-4 -top-4 w-20 sm:-start-3 sm:-top-5 sm:w-32`}>
      <defs>
        <linearGradient id="join-question" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef6f4" />
          <stop offset="1" stopColor="#e3f0ed" />
        </linearGradient>
      </defs>
      <g transform="rotate(-8 56 48)">
        <path
          d="M32 18h48a18 18 0 0 1 18 18v16a18 18 0 0 1-18 18h-6l6 14-18-14H32a18 18 0 0 1-18-18V36a18 18 0 0 1 18-18Z"
          fill="url(#join-question)"
          stroke="#2f7f76"
          strokeOpacity="0.22"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Someone typing. */}
        <circle cx="42" cy="44" r="4.5" fill="#2f7f76" fillOpacity="0.7" />
        <circle cx="56" cy="44" r="4.5" fill="#2f7f76" fillOpacity="0.45" />
        <circle cx="70" cy="44" r="4.5" fill="#2f7f76" fillOpacity="0.25" />
      </g>
    </svg>
  );
}

function AnswerBubble() {
  return (
    <svg
      viewBox="0 0 128 104"
      aria-hidden="true"
      className={`${art} -end-4 -bottom-4 w-24 drop-shadow-[0_6px_14px_rgb(15_42_68_/_0.08)] sm:-end-3 sm:-bottom-5 sm:w-36`}
    >
      <g transform="rotate(6 74 57)">
        <path
          d="M48 30 40 16l22 14h38a18 18 0 0 1 18 18v18a18 18 0 0 1-18 18H48a18 18 0 0 1-18-18V48a18 18 0 0 1 18-18Z"
          fill="#fff"
          stroke="#e2e0da"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="46" y="46" width="56" height="5" rx="2.5" fill="#0f2a44" fillOpacity="0.16" />
        <rect x="46" y="58" width="38" height="5" rx="2.5" fill="#0f2a44" fillOpacity="0.1" />
      </g>
      {/* A sparkle: the answer's in. */}
      <path d="M18 23q0 7 7 7-7 0-7 7 0-7-7-7 7 0 7-7Z" fill="#c98a2b" />
      <circle cx="31" cy="15" r="1.8" fill="#c98a2b" fillOpacity="0.5" />
    </svg>
  );
}
