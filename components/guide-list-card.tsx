import type { Locale } from "@/i18n/config";
import { signupUrl } from "@/lib/site";
import { GuideText } from "./guide";
import { Icon } from "./icons";
import { ButtonLink } from "./ui";

// A guide's way into the app, where the guide runs out and the couple's own
// case begins: a title, a line, a few short points if given, a sign-up button,
// and a drawing of their own documents list, each row marked with what that
// document needs. Built like
// the card into the process guide (guide-process-card). The drawing has no
// words, and mirrors in RTL like the guides' other drawings.

export type ListCardTexts = { title: string; text: string; points?: string[]; button: string };

export function GuideListCard({ texts, locale }: { texts: ListCardTexts; locale: Locale }) {
  return (
    <div className="relative my-8 overflow-hidden rounded-2xl border border-teal-600/20 bg-linear-to-br from-teal-100/80 via-white to-white p-5 shadow-soft sm:p-7">
      <div aria-hidden="true" className="texture-dots pointer-events-none absolute inset-0" />
      <div className="relative grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,230px)] sm:gap-6">
        <ListDrawing className="mx-auto w-full max-w-[250px] sm:order-last sm:max-w-none" />

        <div>
          <h3 className="font-display text-[22px] leading-tight font-semibold text-balance text-navy-900 sm:text-2xl">
            {texts.title}
          </h3>
          <p className="mt-2 text-[15.5px] leading-7 text-slate-700">
            <GuideText text={texts.text} locale={locale} />
          </p>

          {texts.points && (
            <ul className="mt-4 space-y-2">
              {texts.points.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-[15px] leading-6 font-medium text-navy-900">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="pointer-events-none size-6 shrink-0 select-none">
                    <circle cx="12" cy="12" r="11" className="fill-white stroke-teal-600/25" strokeWidth="1" />
                    <path d="m7.6 12.3 3 3 5.8-6.2" fill="none" className="stroke-teal-600" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          )}
          <ButtonLink href={signupUrl(locale)} size="sm" className="mt-5 w-full sm:w-auto">
            {texts.button}
            <Icon name="arrow" className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/** The rows of the list: what each document needs, from most to nothing. */
const rows: { y: number; seal: boolean; translation: boolean; faded?: boolean }[] = [
  { y: 62, seal: true, translation: true },
  { y: 92, seal: true, translation: false },
  { y: 122, seal: false, translation: false },
  { y: 152, seal: true, translation: true, faded: true },
];

/**
 * The couple's own documents list, on a card: a header with their heart, then
 * a row per document. On each row, what it needs: an apostille's seal, a
 * translation's two sheets, or a check where it needs nothing. The last row
 * fades out, as the list goes on.
 */
function ListDrawing({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      aria-hidden="true"
      className={`flip-rtl pointer-events-none shrink-0 select-none ${className}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        {/* The list runs on past the card's edge. */}
        <linearGradient id="list-card-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.72" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="list-card-mask">
          <rect x="0" y="0" width="240" height="180" fill="url(#list-card-fade)" />
        </mask>
      </defs>

      {/* A soft light behind the card. */}
      <circle cx="128" cy="86" r="78" className="fill-white" opacity="0.7" />

      <g mask="url(#list-card-mask)">
        {/* The card, lifted a little off the page. */}
        <rect x="42" y="18" width="164" height="172" rx="14" className="fill-navy-900" opacity="0.06" transform="translate(3 5)" />
        <rect x="42" y="18" width="164" height="172" rx="14" className="fill-white stroke-teal-600" strokeOpacity="0.18" strokeWidth="1.2" />

        {/* Its header: the couple's heart, and their names. */}
        <path d="M42 32a14 14 0 0 1 14-14h136a14 14 0 0 1 14 14v8H42Z" className="fill-navy-900" />
        <circle cx="62" cy="31" r="8" className="fill-white" opacity="0.14" />
        <path
          d="M22 35.5c-.6-.4-11-6.6-11-14.2A5.9 5.9 0 0 1 22 18.4a5.9 5.9 0 0 1 11 2.9c0 7.6-10.4 13.8-11 14.2Z"
          transform="translate(52.3 20.5) scale(0.44)"
          className="fill-amber-500"
        />
        <rect x="76" y="26.5" width="46" height="3.4" rx="1.7" className="fill-white" opacity="0.85" />
        <rect x="76" y="33" width="28" height="2.6" rx="1.3" className="fill-white" opacity="0.4" />

        {rows.map((row, i) => (
          <g key={row.y} opacity={row.faded ? 0.55 : 1}>
            {i > 0 && <path d={`M56 ${row.y - 15}h136`} className="stroke-line-200" strokeWidth="1.2" />}

            {/* The document. */}
            <rect x="56" y={row.y - 10} width="16" height="20" rx="2.5" className="fill-white stroke-slate-300" strokeWidth="1.3" />
            <rect x="59.5" y={row.y - 6} width="9" height="2" rx="1" className="fill-navy-900" />
            <rect x="59.5" y={row.y - 1.5} width="7" height="1.6" rx="0.8" className="fill-slate-300" />
            <rect x="59.5" y={row.y + 2.5} width="8" height="1.6" rx="0.8" className="fill-slate-300" />

            {/* Its name. */}
            <rect x="80" y={row.y - 5} width={[44, 36, 40, 32][i]} height="3.6" rx="1.8" className="fill-navy-900" opacity="0.85" />
            <rect x="80" y={row.y + 2} width={[30, 38, 26, 34][i]} height="2.8" rx="1.4" className="fill-slate-300" />

            {/* What it needs. */}
            {row.seal && <Seal x={row.translation ? 160 : 182} y={row.y} />}
            {row.translation && <Translation x={182} y={row.y} />}
            {!row.seal && !row.translation && (
              <>
                <circle cx="182" cy={row.y} r="9" className="fill-teal-100" />
                {/* Flipped back in RTL, so the check never reads backwards. */}
                <path
                  d={`m177.4 ${row.y + 0.2} 3 3 6.4-6.8`}
                  className="flip-rtl origin-center stroke-teal-600 [transform-box:fill-box]"
                  strokeWidth="2.2"
                />
              </>
            )}
          </g>
        ))}
      </g>

      {/* Sparkles. */}
      <path d="m222 22 1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6Z" className="fill-amber-500" />
      <path d="m28 70 1.1 3 3 1.1-3 1.1-1.1 3-1.1-3-3-1.1 3-1.1Z" className="fill-amber-500" opacity="0.7" />
      <circle cx="218" cy="56" r="2" className="fill-teal-600" opacity="0.5" />
    </svg>
  );
}

/** An apostille's seal: a gold disc with a dotted ring and a star, on two ribbons. */
function Seal({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-4.5 4-7 12l3.2-1.3L-1.8 13l1-7Z" className="fill-teal-600" />
      <path d="M4.5 4 7 12l-3.2-1.3L1.8 13l-1-7Z" className="fill-teal-700" />
      <circle r="8" className="fill-amber-500" />
      <circle r="5.6" className="stroke-white" strokeWidth="0.9" strokeDasharray="1 1.3" />
      <path
        d="M0-3.4.95-1.1 3.4-.95 1.5.65 2.1 3.05 0 1.75-2.1 3.05-1.5.65-3.4-.95-.95-1.1Z"
        className="fill-white"
      />
    </g>
  );
}

/** A translation: the original, dark, and its translation in front of it. */
function Translation({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-9" y="-10" width="12" height="15" rx="2" className="fill-navy-900" />
      <rect x="-6.5" y="-6.5" width="7" height="1.5" rx="0.75" className="fill-white" opacity="0.5" />
      <rect x="-6.5" y="-3.5" width="5" height="1.5" rx="0.75" className="fill-white" opacity="0.5" />
      <rect x="-3" y="-5" width="12" height="15" rx="2" className="fill-white stroke-teal-600" strokeWidth="1.3" />
      <rect x="-0.5" y="-1.5" width="7" height="1.6" rx="0.8" className="fill-teal-600" />
      <rect x="-0.5" y="1.8" width="5" height="1.5" rx="0.75" className="fill-slate-300" />
      <rect x="-0.5" y="4.9" width="6" height="1.5" rx="0.75" className="fill-slate-300" />
    </g>
  );
}
