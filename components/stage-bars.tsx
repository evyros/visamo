"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./icons";

// The branches page's "How long each stage takes" (components/branch-stats.tsx
// prepares it). Each stage is drawn on a month track: a capsule over the middle
// half of couples, and a pin at the typical wait. Pointing at a stage, tapping
// it, or tabbing to it opens its numbers above the pin.
// Positions arrive as percentages of the width, already mirrored for RTL, so
// the drawing needs no direction of its own.

export type StageRow = {
  id: string;
  title: string;
  detail: string;
  /** "about 2 months". */
  value: string;
  /** "4 weeks to 3 months". */
  range: string;
  /** "21 waits reported". */
  count: string;
  /** Where the middle half starts and ends, and the typical wait, as percentages of the width. */
  from: number;
  to: number;
  median: number;
};

const C = {
  navy: "#0f2a44",
  teal: "#2f7f76",
  teal700: "#25665f",
  tealLight: "#6cb5aa",
  track: "#ece8df",
};

export function StageBars({
  rows,
  ticks,
  rtl,
  labels,
}: {
  rows: StageRow[];
  /** The month marks: where each is, and its label (empty when it isn't labelled). */
  ticks: { at: number; label: string }[];
  rtl: boolean;
  labels: { info: string; typical: string; usual: string; axis: string };
}) {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  // An open stage closes on Escape, or a tap anywhere else.
  useEffect(() => {
    if (!active) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setActive(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [active]);

  // The capsules grow in once, from where they start, unless the reader asked for less motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.current?.querySelectorAll<SVGRectElement>("[data-grow]").forEach((el, i) => {
      el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration: 700,
        delay: 120 + i * 90,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      });
    });
  }, []);

  return (
    <div ref={root}>
      <ol className="space-y-6">
        {rows.map((row) => {
          const open = active === row.id;
          const tip = `stage-info-${row.id}`;
          const at = row.title.lastIndexOf(" ");
          return (
            <li key={row.id}>
              <div className="flex items-start justify-between gap-4">
                {/* The info button sits in the heading, with the name's last word, so the two wrap together. */}
                <div className="group relative min-w-0">
                  <h3 className="font-semibold text-navy-900">
                    {row.title.slice(0, at + 1)}
                    <span className="whitespace-nowrap">
                      {row.title.slice(at + 1)}
                      <button
                        type="button"
                        aria-label={labels.info}
                        aria-describedby={tip}
                        className="-my-1 ms-0.5 inline-flex size-7 items-center justify-center rounded-full align-middle font-normal text-slate-500 transition-colors hover:bg-sand-50 hover:text-teal-700"
                      >
                        <Icon name="info" className="size-[18px]" />
                      </button>
                    </span>
                  </h3>
                  <span
                    id={tip}
                    role="tooltip"
                    className="pointer-events-none invisible absolute start-0 top-full z-30 mt-1.5 w-max max-w-72 rounded-lg bg-navy-900 px-3 py-2 text-sm leading-6 text-white opacity-0 shadow-soft transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
                  >
                    {row.detail}
                  </span>
                </div>
                <p className="shrink-0 font-display text-base leading-7 font-semibold text-navy-900 sm:text-lg">{row.value}</p>
              </div>

              <div
                role="button"
                tabIndex={0}
                aria-expanded={open}
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(row.id)}
                onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
                // A tap opens or closes it; a mouse already opened it on the way in.
                onClick={(e) => (e.nativeEvent as PointerEvent).pointerType !== "mouse" && setActive((a) => (a === row.id ? null : row.id))}
                // Only from the keyboard: a tap focuses it too, and its click would close it again.
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && setActive(row.id)}
                onBlur={() => setActive(null)}
                className="relative mt-1.5 cursor-pointer rounded-full py-1.5 outline-offset-2 [-webkit-tap-highlight-color:transparent]"
              >
                {/* The stage's numbers as text, in the page's HTML: the row's name for screen readers, and what
                    search engines and AI crawlers read, as the tooltip is drawn only when it opens. */}
                <span className="sr-only">{`${row.title}. ${labels.typical}: ${row.value}. ${labels.usual}: ${row.range}. ${row.count}.`}</span>
                <Track row={row} ticks={ticks} rtl={rtl} open={open} />
                {open && <Tip row={row} rtl={rtl} labels={labels} />}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="relative mt-2 h-4 text-xs text-slate-500 tabular-nums" aria-hidden="true">
        {ticks
          .filter((tick) => tick.label)
          .map((tick) => (
            <span key={tick.at} className="absolute -translate-x-1/2" style={{ left: `${tick.at}%` }}>
              {tick.label}
            </span>
          ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
        <span>{labels.axis}</span>
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 34 18" className="h-[18px] w-[34px]" aria-hidden="true">
            <defs>
              <linearGradient id="stage-key" x1={rtl ? "1" : "0"} x2={rtl ? "0" : "1"}>
                <stop offset="0" stopColor={C.tealLight} />
                <stop offset="1" stopColor={C.teal} />
              </linearGradient>
            </defs>
            <rect x="1" y="4" width="32" height="10" rx="5" fill="url(#stage-key)" />
          </svg>
          {labels.usual}
        </span>
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 18 18" className="size-[18px]" aria-hidden="true">
            <circle cx="9" cy="9" r="6" fill="#fff" stroke={C.teal700} strokeWidth="3" />
          </svg>
          {labels.typical}
        </span>
      </div>
    </div>
  );
}

/** One stage's drawing: the month track, the middle half, and the typical wait's pin. */
function Track({ row, ticks, rtl, open }: { row: StageRow; ticks: { at: number }[]; rtl: boolean; open: boolean }) {
  const gradient = `stage-fill-${row.id}`;
  const shadow = `stage-shadow-${row.id}`;
  const left = Math.min(row.from, row.to);
  const width = Math.abs(row.to - row.from);
  return (
    <svg width="100%" height="24" className="block overflow-visible" aria-hidden="true">
      <defs>
        {/* Lighter where the middle half starts, deeper where it ends: the eye reads the length. */}
        <linearGradient id={gradient} x1={rtl ? "1" : "0"} x2={rtl ? "0" : "1"}>
          <stop offset="0" stopColor={C.tealLight} />
          <stop offset="1" stopColor={C.teal} />
        </linearGradient>
        <filter id={shadow} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor={C.navy} floodOpacity="0.25" />
        </filter>
      </defs>
      <rect x="0" y="7" width="100%" height="10" rx="5" fill={C.track} />
      {/* A white mark at every month, so the track reads as months without a grid. */}
      {ticks.slice(1, -1).map((tick) => (
        <line key={tick.at} x1={`${tick.at}%`} x2={`${tick.at}%`} y1="7" y2="17" stroke="#fff" strokeWidth="2" />
      ))}
      <rect
        data-grow
        x={`${left}%`}
        y="7"
        width={`${width}%`}
        height="10"
        rx="5"
        fill={`url(#${gradient})`}
        style={{ transformBox: "fill-box", transformOrigin: rtl ? "right" : "left" }}
      />
      <circle
        cx={`${row.median}%`}
        cy="12"
        r={open ? 9 : 7}
        fill="#fff"
        stroke={C.teal700}
        strokeWidth="3"
        filter={`url(#${shadow})`}
        style={{ transition: "r 160ms ease-out" }}
      />
    </svg>
  );
}

/**
 * The open stage's numbers, above its pin. It covers the stage's own name, so it repeats it. The box is centred on
 * the pin and slid back inside the chart near its ends; the arrow stays on the pin. The track's label already reads
 * all of this out, so it's hidden from screen readers.
 */
function Tip({ row, rtl, labels }: { row: StageRow; rtl: boolean; labels: { typical: string; usual: string } }) {
  const box = useRef<HTMLDivElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);

  // Placed before it's painted, by `translate`: the rise animation owns `transform`.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el?.parentElement || !arrow.current) return;
    const width = el.parentElement.clientWidth;
    const pin = (row.median / 100) * width;
    const left = Math.min(Math.max(pin - el.offsetWidth / 2, -12), width - el.offsetWidth + 12);
    el.style.translate = `${left}px 0`;
    arrow.current.style.left = `${pin - left}px`;
  }, [row.median]);

  return (
    <div
      ref={box}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 w-max max-w-[min(20rem,calc(100%+1.5rem))] rounded-xl bg-navy-900 px-3.5 pt-2.5 pb-3 text-[13px] leading-5 text-white shadow-[0_12px_32px_-8px_rgb(15_42_68/0.45)] animate-rise"
      // Inline: globals.css's .animate-rise sits outside the utilities layer, so a class can't shorten it.
      style={{ animationDuration: "180ms" }}
    >
      <p className="font-semibold">{row.title}</p>
      <dl className="mt-2 grid grid-cols-[auto_auto] items-center gap-x-4 gap-y-1 border-t border-white/15 pt-2">
        <dt className="flex items-center gap-2 text-white/70">
          <svg viewBox="0 0 14 14" className="size-3.5 shrink-0">
            <circle cx="7" cy="7" r="4.5" fill="#fff" stroke={C.tealLight} strokeWidth="2.5" />
          </svg>
          {labels.typical}
        </dt>
        <dd className="text-end font-semibold whitespace-nowrap">{row.value}</dd>
        <dt className="flex items-center gap-2 text-white/70">
          <svg viewBox="0 0 14 14" className="size-3.5 shrink-0">
            <defs>
              <linearGradient id={`stage-tip-${row.id}`} x1={rtl ? "1" : "0"} x2={rtl ? "0" : "1"}>
                <stop offset="0" stopColor={C.tealLight} />
                <stop offset="1" stopColor="#4fa093" />
              </linearGradient>
            </defs>
            <rect x="0" y="4" width="14" height="6" rx="3" fill={`url(#stage-tip-${row.id})`} />
          </svg>
          {labels.usual}
        </dt>
        <dd className="text-end font-semibold whitespace-nowrap">{row.range}</dd>
      </dl>
      <p className="mt-1.5 text-xs text-white/55">{row.count}</p>
      <span ref={arrow} className="absolute top-full -translate-x-1/2 border-[7px] border-transparent border-t-navy-900" />
    </div>
  );
}
