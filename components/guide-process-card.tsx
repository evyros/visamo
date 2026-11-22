import { processPath } from "@/content/process";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/lib/site";
import { Icon } from "./icons";
import { ButtonLink } from "./ui";

// A guide's way into the interactive guide (/guide/partner-visa-process): its
// three questions, and a drawing of the couple's road forking into routes, one
// of them theirs, ending in the visa. The drawing has no words, and mirrors in
// RTL like the guides' other drawings.

export type ProcessCardTexts = { title: string; text: string; questions: string[]; button: string };

export function GuideProcessCard({ texts, locale }: { texts: ProcessCardTexts; locale: Locale }) {
  return (
    <div className="relative my-8 overflow-hidden rounded-2xl border border-teal-600/20 bg-linear-to-br from-teal-100/80 via-white to-white p-5 shadow-soft sm:p-7">
      <div aria-hidden="true" className="texture-dots pointer-events-none absolute inset-0" />
      <div className="relative grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,250px)] sm:gap-6">
        <ForkDrawing className="mx-auto w-full max-w-[260px] sm:order-last sm:max-w-none" />

        <div>
          <h3 className="font-display text-[22px] leading-tight font-semibold text-balance text-navy-900 sm:text-2xl">
            {texts.title}
          </h3>
          <p className="mt-2 text-[15.5px] leading-7 text-slate-700">{texts.text}</p>

          <ol className="mt-4 space-y-2">
            {texts.questions.map((question, i) => (
              <li key={question} className="flex items-center gap-2.5 text-[15px] leading-6 font-medium text-navy-900">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-teal-700 tabular-nums ring-1 ring-teal-600/25">
                  {(i + 1).toLocaleString(locale)}
                </span>
                {question}
              </li>
            ))}
          </ol>

          <ButtonLink href={localePath(locale, processPath)} size="sm" className="mt-5 w-full sm:w-auto">
            {texts.button}
            <Icon name="arrow" className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/**
 * The couple (a pin with a heart) sets off; at a signpost the road forks in
 * three. Theirs, solid teal, climbs to a passport with the visa's sticker; the
 * other two fade off, dotted.
 */
function ForkDrawing({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 240 176"
      aria-hidden="true"
      className={`flip-rtl pointer-events-none shrink-0 select-none ${className}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* A soft light behind the passport. */}
      <circle cx="192" cy="50" r="40" className="fill-white" opacity="0.85" />
      <circle cx="192" cy="50" r="40" className="stroke-teal-600" strokeOpacity="0.12" strokeWidth="1.2" />

      {/* The routes that aren't theirs, dotted, each ending in an empty stop. */}
      <g className="stroke-slate-300" strokeWidth="2.4" strokeDasharray="0.1 6">
        <path d="M112 118c30 0 50-12 88-12" />
        <path d="M112 118c26 0 46 34 84 34" />
      </g>
      <circle cx="206" cy="106" r="4.5" className="fill-white stroke-slate-300" strokeWidth="2" />
      <circle cx="202" cy="152" r="4.5" className="fill-white stroke-slate-300" strokeWidth="2" />

      {/* Their road: from the pin to the fork, and on up to the passport. */}
      <path d="M48 156c30 0 36-38 64-38" className="stroke-teal-600" strokeWidth="3.2" />
      <path d="M112 118c28 0 30-62 60-64" className="stroke-teal-600" strokeWidth="3.2" />

      {/* The signpost at the fork. */}
      <rect x="94.8" y="76" width="2.6" height="38" rx="1.3" className="fill-navy-800" />
      <path d="M87 78h19l5 5.5-5 5.5H87a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" className="fill-amber-500" />
      <rect x="89.5" y="82.4" width="12" height="2.2" rx="1.1" className="fill-white" opacity="0.8" />
      <path d="M105 93H86l-5 5 5 5h19a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2Z" className="fill-amber-100 stroke-amber-500" strokeWidth="1.3" />
      <rect x="90" y="97" width="11" height="2" rx="1" className="fill-amber-500" opacity="0.55" />

      {/* The fork itself. */}
      <circle cx="112" cy="118" r="6.5" className="fill-white stroke-teal-600" strokeWidth="3" />
      <circle cx="112" cy="118" r="2.4" className="fill-teal-600" />

      {/* The couple: a pin with a heart, and its shadow. */}
      <ellipse cx="38" cy="160" rx="11" ry="2.8" className="fill-navy-900" opacity="0.12" />
      <path d="M38 159c-1.3-1.7-14-15.6-14-25.6a14 14 0 0 1 28 0c0 10-12.7 23.9-14 25.6Z" className="fill-navy-900" />
      <path
        d="M22 35.5c-.6-.4-11-6.6-11-14.2A5.9 5.9 0 0 1 22 18.4a5.9 5.9 0 0 1 11 2.9c0 7.6-10.4 13.8-11 14.2Z"
        transform="translate(28.3 122.1) scale(0.44)"
        className="fill-amber-500"
      />

      {/* The passport, where their road ends. */}
      <rect x="172" y="22" width="40" height="56" rx="5" className="fill-navy-900" />
      <rect x="176.5" y="22" width="2" height="56" className="fill-navy-800" />
      <g className="stroke-amber-500" strokeWidth="1.6">
        <circle cx="194" cy="42" r="8.5" />
        <ellipse cx="194" cy="42" rx="3.6" ry="8.5" />
        <path d="M185.5 42h17" />
      </g>
      <rect x="185" y="58" width="18" height="2.2" rx="1.1" className="fill-amber-500" opacity="0.7" />
      <rect x="188" y="63.5" width="12" height="2.2" rx="1.1" className="fill-amber-500" opacity="0.45" />

      {/* The visa's sticker on it, a little askew, with a check. */}
      <g transform="rotate(-8 214 70)">
        <rect x="198" y="58" width="32" height="24" rx="3.5" className="fill-white stroke-teal-600" strokeWidth="1.6" />
        <path d="M198 64.5v-3a3.5 3.5 0 0 1 3.5-3.5h25a3.5 3.5 0 0 1 3.5 3.5v3Z" className="fill-teal-600" />
        <path d="m206.5 72.5 3.4 3.4 7-7" className="stroke-teal-600" strokeWidth="2.4" />
        <rect x="220" y="70" width="6" height="2" rx="1" className="fill-slate-300" />
        <rect x="220" y="74.5" width="4" height="2" rx="1" className="fill-slate-300" />
      </g>

      {/* Sparkles. */}
      <path d="m226 14 1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6Z" className="fill-amber-500" />
      <path d="m162 26 1.1 3 3 1.1-3 1.1-1.1 3-1.1-3-3-1.1 3-1.1Z" className="fill-amber-500" opacity="0.7" />
    </svg>
  );
}
