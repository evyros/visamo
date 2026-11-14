import type { ReactNode } from "react";
import type { Messages } from "@/i18n/dictionaries";
import { Container, SectionTitle } from "../ui";

// Three problems and Visamo's answer, titles only. Every picture is a piece of
// paper in trouble (a pile with a question mark, a rejected document beside a
// calendar of crossed-off days, a long bill), drawn in one style: navy outlines,
// light paper and a single red badge. Visamo's answer is the same paper, fixed.
const problemArt = [<UnsureArt key="unsure" />, <DelayArt key="delay" />, <CostArt key="cost" />];

export function Problem({ t }: { t: Messages }) {
  const p = t.home.problem;
  return (
    <section id="why" aria-labelledby="why-title" className="py-16 sm:py-24">
      <Container>
        <SectionTitle id="why-title">{p.title}</SectionTitle>

        <ul aria-label={p.problemsLabel} className="mt-10 grid gap-3 sm:grid-cols-3 sm:gap-6">
          {p.problems.map((problem, i) => (
            <li
              key={problem}
              className="flex items-center gap-4 rounded-2xl border border-line-200 bg-white p-4 sm:block sm:p-6"
            >
              <div className="flex h-20 w-28 shrink-0 justify-center sm:h-36 sm:w-auto">{problemArt[i]}</div>
              <h3 className="text-lg font-semibold leading-snug text-balance text-navy-900 sm:mt-5 sm:text-center">{problem}</h3>
            </li>
          ))}
        </ul>

        <div
          role="group"
          aria-labelledby="why-with why-with-title"
          className="relative mt-6 overflow-hidden rounded-3xl bg-teal-700 p-6 text-white shadow-soft sm:p-10 md:pe-60 lg:pe-72">
          <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-12">
            <div>
              <p id="why-with" className="text-sm font-semibold uppercase tracking-wide text-sage-200">
                {p.solution.label}
              </p>
              <h3 id="why-with-title" className="mt-3 font-display text-3xl font-semibold leading-tight text-balance sm:text-4xl">
                {p.solution.title}
              </h3>
            </div>
            {/* Each tick is exactly one line high, so it sits level with the first line when the text wraps. */}
            <ul className="space-y-3">
              {p.solution.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-base leading-6 font-medium sm:text-lg sm:leading-7">
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-sage-200 sm:size-7">
                    {/* Drawn here, not the Icon set's tick: as bold as the ticks in the drawing. */}
                    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="size-3.5 sm:size-4">
                      <path
                        d="m3.5 8.3 3 3 6-6.3"
                        fill="none"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="stroke-teal-700"
                      />
                    </svg>
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          {/* The fixed document, tilted and cut off by the panel's edge. */}
          <div className="pointer-events-none absolute -bottom-20 end-8 hidden w-44 rotate-6 md:block lg:end-12 lg:w-48">
            <FixedArt />
          </div>
          {/* Phones have no room beside the text: a faint check mark, cut off by the corner, instead. */}
          <svg
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
            className="pointer-events-none absolute -end-12 -bottom-12 size-48 text-white/10 md:hidden"
          >
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="7" />
            <path
              d="m30 51 13 13 27-28"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Illustrations: decorative, the titles carry the meaning ---------- */

const ink = "stroke-navy-900";
const line = 2.5;

/**
 * Each problem's canvas is cropped to its drawing (all 140 high, so they share one
 * scale) and sized by its height, so it centers on the drawing itself.
 */
function Art({ viewBox, className = "h-full w-auto max-w-full", children }: { viewBox: string; className?: string; children: ReactNode }) {
  return (
    <svg viewBox={viewBox} aria-hidden="true" focusable="false" className={className}>
      {children}
    </svg>
  );
}

type PaperProps = { x: number; y: number; w?: number; h?: number; rotate?: number; back?: boolean; children?: ReactNode };

/** A sheet of paper: white with a title bar and text lines, or a plain sheet behind others. */
function Paper({ x, y, w = 70, h = 92, rotate = 0, back = false, children }: PaperProps) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})`}>
      <rect width={w} height={h} rx="8" strokeWidth={line} className={`${back ? "fill-sand-50" : "fill-white"} ${ink}`} />
      {!back && (children ?? <TextLines w={w} />)}
    </g>
  );
}

function TextLines({ w, rows = 4 }: { w: number; rows?: number }) {
  return (
    <>
      <rect x="12" y="14" width={w * 0.42} height="6" rx="3" className="fill-navy-900" />
      {Array.from({ length: rows }, (_, i) => (
        <rect key={i} x="12" y={30 + i * 12} width={w - 24 - (i % 2) * 12} height="5" rx="2.5" className="fill-slate-300" />
      ))}
    </>
  );
}

/** A red mark on a corner: the one place each problem uses red. */
function Badge({ cx, cy, children }: { cx: number; cy: number; children: ReactNode }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="18" className="fill-terracotta-600" />
      <g fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-white">
        {children}
      </g>
    </g>
  );
}

/** Which documents? A pile of papers and a question mark. */
function UnsureArt() {
  return (
    <Art viewBox="36 0 126 140">
      <Paper x={50} y={26} rotate={-12} back />
      <Paper x={82} y={22} rotate={9} back />
      <Paper x={64} y={30} />
      <Badge cx={140} cy={32}>
        <path d="M133.5 27a6.5 6.5 0 1 1 9.1 5.9c-1.7.8-2.6 2.1-2.6 3.9v1" />
        <circle cx="140" cy="44" r="0.6" />
      </Badge>
    </Art>
  );
}

/** A mistake costs months: a rejected document in front of a calendar of crossed-off days. */
function DelayArt() {
  const cols = [104, 121, 138, 155];
  const rows = [56, 72, 88];
  return (
    <Art viewBox="16 0 166 140">
      <g>
        <rect x="108" y="16" width="5" height="14" rx="2.5" className="fill-navy-900" />
        <rect x="159" y="16" width="5" height="14" rx="2.5" className="fill-navy-900" />
        <rect x="92" y="22" width="86" height="92" rx="8" strokeWidth={line} className={`fill-white ${ink}`} />
        <path d="M100 22h70a8 8 0 0 1 8 8v14H92V30a8 8 0 0 1 8-8Z" className="fill-navy-900" />
        {rows.flatMap((y, r) =>
          cols.map((x, c) => {
            const passed = r * cols.length + c < 10;
            return (
              <g key={`${x}-${y}`}>
                <rect x={x} y={y} width="13" height="11" rx="2.5" className="fill-sand-50" />
                {passed && (
                  <path d={`m${x + 3} ${y + 8} 7-5`} strokeWidth="2" strokeLinecap="round" className="stroke-slate-500" />
                )}
              </g>
            );
          }),
        )}
      </g>
      <Paper x={24} y={36} rotate={-6} />
      <Badge cx={90} cy={40}>
        <path d="m83 33 14 14m0-14-14 14" />
      </Badge>
    </Art>
  );
}

/** Thousands, or more: a long bill with another behind it, and a shekel sign. */
function CostArt() {
  const receipt = (w: number, h: number, teeth: number) => {
    const s = w / teeth;
    const zigzag = Array.from({ length: teeth }, () => `l${-s / 2} -6 l${-s / 2} 6`).join(" ");
    return `M0 8a8 8 0 0 1 8-8h${w - 16}a8 8 0 0 1 8 8V${h} ${zigzag}Z`;
  };
  return (
    <Art viewBox="54 0 122 140">
      <g transform="translate(100 14) rotate(9 32 52)">
        <path d={receipt(64, 104, 6)} strokeWidth={line} strokeLinejoin="round" className={`fill-sand-50 ${ink}`} />
      </g>
      <g transform="translate(58 8)">
        <path d={receipt(78, 124, 7)} strokeWidth={line} strokeLinejoin="round" className={`fill-white ${ink}`} />
        <rect x="12" y="13" width="32" height="6" rx="3" className="fill-navy-900" />
        {[30, 42, 54, 66].map((y) => (
          <g key={y}>
            <rect x="12" y={y} width="30" height="5" rx="2.5" className="fill-slate-300" />
            <rect x="52" y={y} width="14" height="5" rx="2.5" className="fill-slate-300" />
          </g>
        ))}
        <path d="M12 80h54" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" className="stroke-slate-300" />
        <rect x="12" y="92" width="22" height="6" rx="3" className="fill-navy-900" />
        <rect x="44" y="92" width="22" height="6" rx="3" className="fill-navy-900" />
      </g>
      <circle cx="136" cy="30" r="18" className="fill-terracotta-600" />
      <text x="136" y="37" textAnchor="middle" fontSize="21" fontWeight="700" className="fill-white">
        ₪
      </text>
    </Art>
  );
}

/** Visamo's answer: the same paper, every line checked. */
function FixedArt() {
  return (
    <Art viewBox="0 0 160 210" className="h-auto w-full">
      <rect x="16" y="22" width="120" height="180" rx="12" strokeWidth={line} className={`fill-white ${ink}`} />
      <rect x="32" y="40" width="54" height="8" rx="4" className="fill-navy-900" />
      {[64, 90, 116, 142].map((y) => (
        <g key={y}>
          <circle cx="40" cy={y + 3} r="8" className="fill-teal-100" />
          <path
            d={`m36.2 ${y + 3.2} 2.6 2.6 5-5.2`}
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-teal-700"
          />
          <rect x="56" y={y} width="62" height="6" rx="3" className="fill-slate-300" />
        </g>
      ))}
      <circle cx="132" cy="26" r="22" className="fill-sage-200" />
      <path
        d="m122 26.5 7 7 13.5-14"
        fill="none"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-teal-700"
      />
    </Art>
  );
}
