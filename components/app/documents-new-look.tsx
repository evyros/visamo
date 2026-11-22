"use client";

import { useEffect, useId, useRef } from "react";
import type { Messages } from "@/i18n/messages";
import { format } from "@/i18n/messages";
import { Icon, type IconName } from "@/components/icons";

// Once per device, for couples who used the documents page before it was
// grouped by type: a short note that it changed, and why. Only shown on
// arriving without a link to a place on the page, so it never covers what a
// link opened; remembered as shown the moment it opens.

const SEEN_KEY = "visamo.documentsNewLookSeen";

type Labels = Messages["app"]["documentsPage"]["newLook"];

export function DocumentsNewLook({ t, personLabel }: { t: Labels; personLabel: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (window.location.hash) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage blocked: it couldn't be remembered, so it would show on every visit. Skip it.
      return;
    }
    dialog.current?.showModal();
    // Ready for Enter, rather than on the close button the dialog would pick first.
    ok.current?.focus();
  }, []);

  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClick={(event) => event.target === event.currentTarget && close()}
      className="m-auto w-[min(92vw,420px)] rounded-card bg-white p-0 shadow-float backdrop:bg-navy-900/50"
    >
      <div className="relative px-6 pt-5 pb-6 text-center">
        <button
          type="button"
          aria-label={t.close}
          onClick={close}
          className="absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5 focus-visible:outline-2 focus-visible:outline-teal-600"
        >
          <Icon name="x" className="size-5" />
        </button>
        <FileThroughTheLens className="mx-auto mt-3 h-auto w-full max-w-[300px]" />
        <h2 id={titleId} className="mt-3 font-display text-xl font-semibold text-navy-900 sm:text-2xl">
          {t.title}
        </h2>
        <p className="mt-2 text-[15px] leading-6 text-slate-700">{t.body}</p>
        <p className="mt-2 text-[15px] leading-6 text-slate-700">{format(t.hint, { person: personLabel })}</p>
        <button
          ref={ok}
          type="button"
          onClick={close}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-navy-900 px-4 py-2.5 text-[15px] font-semibold text-white shadow-soft hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
        >
          {t.ok}
        </button>
      </div>
    </dialog>
  );
}

/** One divider in the folder: its body, and a tab that rises from its top edge, as one outline. */
function dividerPath(x: number, y: number, w: number, h: number, tabX: number, tabW: number, tabH: number) {
  const r = 6; // the card's corners
  const t = 5; // the tab's corners
  return [
    `M${x} ${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    `H${tabX}`,
    `V${y - tabH + t}`,
    `A${t} ${t} 0 0 1 ${tabX + t} ${y - tabH}`,
    `H${tabX + tabW - t}`,
    `A${t} ${t} 0 0 1 ${tabX + tabW} ${y - tabH + t}`,
    `V${y}`,
    `H${x + w - r}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h}`,
    `H${x}`,
    "Z",
  ].join(" ");
}

/** A four-pointed sparkle, centered on 0,0. */
const SPARKLE = "M0 -1C.18 -.18 .18 -.18 1 0C.18 .18 .18 .18 0 1C-.18 .18 -.18 .18 -1 0C-.18 -.18 -.18 -.18 0 -1Z";

/** The dividers, back to front: each type of document gets its own, the way the page now groups them. */
const DIVIDERS: { icon: IconName; lit?: boolean }[] = [
  { icon: "idCard" },
  { icon: "heart" },
  { icon: "certificate" },
  { icon: "home", lit: true },
];

/**
 * The file as Misrad Hapnim sees it: a folder with a divider per type of
 * document, each tab marked with its group's icon, and a magnifying glass on
 * the front one. On opening, the dividers rise into the folder one by one, the
 * sparkles twinkle and the glass floats; none of it moves with reduced motion.
 * Decorative: the text says it all.
 */
function FileThroughTheLens({ className }: { className?: string }) {
  // Every divider ends on the same line, hidden behind the folder's front (120 to 165).
  const card = { x: 98, w: 124, bottom: 152, step: 11, top: 72 };
  const tab = { w: 28, h: 18, start: 104, step: 29 };
  return (
    <svg viewBox="0 0 320 180" className={className} aria-hidden="true" focusable="false">
      <style>{`
        .nl-divider { animation: nl-rise 650ms cubic-bezier(.2,.8,.2,1) both; }
        .nl-lens { transform-box: fill-box; animation: nl-float 3.4s ease-in-out 1s infinite; }
        .nl-spark { transform-box: fill-box; transform-origin: center; animation: nl-twinkle 2.6s ease-in-out infinite; }
        @keyframes nl-rise { from { transform: translateY(16px); opacity: 0; } }
        @keyframes nl-float { 50% { transform: translate(-2px, -3px); } }
        @keyframes nl-twinkle { 50% { transform: scale(.55); opacity: .45; } }
        @media (prefers-reduced-motion: reduce) {
          .nl-divider, .nl-lens, .nl-spark { animation: none; }
        }
      `}</style>

      {/* The ground: a warm backdrop, and the folder's shadow */}
      <ellipse cx="160" cy="104" rx="112" ry="70" className="fill-sand-50" />
      <ellipse cx="160" cy="168" rx="80" ry="5" className="fill-navy-900" opacity=".08" />

      {/* The folder's back, with its own tab */}
      <path
        d="M84 68V58a10 10 0 0 1 10-10h34a8 8 0 0 1 6.4 3.2L139 58h87a10 10 0 0 1 10 10v82a10 10 0 0 1-10 10H94a10 10 0 0 1-10-10Z"
        className="fill-navy-800"
      />

      {/* The dividers, one per type, each a little lower and further along than the one behind it */}
      {DIVIDERS.map((d, i) => {
        const y = card.top + i * card.step;
        const tabX = tab.start + i * tab.step;
        return (
          <g key={d.icon} className="nl-divider" style={{ animationDelay: `${180 + i * 110}ms` }}>
            <path
              d={dividerPath(card.x, y, card.w, card.bottom - y, tabX, tab.w, tab.h)}
              className={d.lit ? "fill-teal-100 stroke-teal-600" : "fill-white stroke-line-200"}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            {/* A line of "text" in the strip that shows above the next divider */}
            <path
              d={`M${card.x + 10} ${y + 6}h${i === DIVIDERS.length - 1 ? 46 : 30}`}
              className={d.lit ? "stroke-teal-600" : "stroke-line-200"}
              strokeWidth="2"
              strokeLinecap="round"
              opacity={d.lit ? 0.5 : 1}
            />
            <Icon
              name={d.icon}
              x={tabX + 7}
              y={y - tab.h + 2.5}
              width={14}
              height={14}
              className={d.lit ? "text-teal-700" : "text-slate-500"}
            />
          </g>
        );
      })}

      {/* The folder's front, holding the dividers, with a label */}
      <path d="M76 120h168l-6 38a8 8 0 0 1-8 7H90a8 8 0 0 1-8-7Z" className="fill-navy-900" />
      <rect x="134" y="134" width="52" height="16" rx="4" className="fill-white" opacity=".12" />
      <path d="M142 142h36" className="stroke-white" strokeWidth="2" strokeLinecap="round" opacity=".55" />

      {/* Misrad Hapnim's eye: a magnifying glass over the front divider's tab */}
      <g className="nl-lens">
        <path d="M218.5 79.5 236 62" className="stroke-navy-900" strokeWidth="6" strokeLinecap="round" />
        <circle cx="205" cy="93" r="19" className="fill-white stroke-navy-900" fillOpacity=".3" strokeWidth="3.5" />
        <path d="M195 86a12 12 0 0 1 8-5" className="stroke-white" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Sparkles: something new. Placed by their group: the twinkle animates the path's own transform. */}
      {[
        { at: "translate(64 66) scale(7)", fill: "fill-amber-500", delay: 0 },
        { at: "translate(256 104) scale(5)", fill: "fill-amber-500", delay: 900 },
        { at: "translate(92 32) scale(4)", fill: "fill-teal-600", delay: 1600 },
      ].map((s) => (
        <g key={s.at} transform={s.at}>
          <path d={SPARKLE} className={`nl-spark ${s.fill}`} style={{ animationDelay: `${s.delay}ms` }} />
        </g>
      ))}
      <circle cx="262" cy="52" r="2.5" className="fill-teal-600" opacity=".45" />
      <circle cx="56" cy="116" r="2" className="fill-navy-900" opacity=".2" />
    </svg>
  );
}
