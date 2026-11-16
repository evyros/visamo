"use client";

import { useEffect, useId, useRef, useState, type ToggleEvent } from "react";
import { Icon } from "@/components/icons";
import { newTab } from "@/lib/site";

/** The popover's width, and the room it keeps from the window's edges. */
const WIDTH = 320;
const GUTTER = 16;
const GAP = 6;

/**
 * What Visamo checks, by a document's check: an ⓘ that opens a short list, the
 * same for every document (app.documentsPage.check.covered.list), and in its
 * footer the couple's procedure and the sources page. It opens as a popover, above the page, so
 * the card can't clip it: under the button, or above it near the bottom of the
 * window, its start lined up with the button's. It follows the button as the
 * page scrolls or the window resizes (a phone's toolbar does both), so it can
 * be scrolled to when it's taller than the room left.
 */
export function CheckCoverage({
  t,
  procedure,
  sourcesUrl,
}: {
  t: { title: string; list: readonly string[]; sources: string };
  procedure: string;
  sourcesUrl: string;
}) {
  const id = useId();
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const stopListening = useRef<(() => void) | null>(null);
  // Under the button or above it: chosen when it opens, kept while it follows the button.
  const below = useRef(true);

  // A result can go while it's open (new files): its listeners go too.
  useEffect(() => () => stopListening.current?.(), []);

  // Under the button when it fits, or above it; its start at the button's, kept inside the window.
  function place(choose = false) {
    const button = buttonRef.current;
    const popover = popoverRef.current;
    if (!button || !popover) return;
    const box = button.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    const width = Math.min(WIDTH, viewport - 2 * GUTTER);
    const rtl = getComputedStyle(button).direction === "rtl";
    const start = rtl ? box.right - width : box.left;
    const left = Math.min(Math.max(start, GUTTER), viewport - GUTTER - width);
    if (choose) {
      const height = popover.offsetHeight;
      below.current = window.innerHeight - box.bottom - GAP >= height || box.top < height + GAP;
    }
    // `right` too: the browser's popover style sets it, and in right-to-left it would win over `left`.
    Object.assign(popover.style, {
      width: `${width}px`,
      left: `${left}px`,
      right: "auto",
      top: below.current ? `${box.bottom + GAP}px` : "auto",
      bottom: below.current ? "auto" : `${window.innerHeight - box.top + GAP}px`,
    });
  }

  function onToggle(event: ToggleEvent<HTMLDivElement>) {
    stopListening.current?.();
    stopListening.current = null;
    setOpen(event.newState === "open");
    if (event.newState !== "open") {
      // Off-screen again, so it never opens where the button was before the page moved.
      Object.assign(event.currentTarget.style, { top: "-9999px", bottom: "auto", left: "-9999px", right: "auto" });
      return;
    }
    // Placed once it's shown, when its height is known; then it follows the button, once a frame.
    place(true);
    let frame = 0;
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => place());
    };
    window.addEventListener("scroll", follow, { capture: true, passive: true });
    window.addEventListener("resize", follow);
    stopListening.current = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", follow, { capture: true });
      window.removeEventListener("resize", follow);
    };
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={id}
        aria-label={t.title}
        aria-expanded={open}
        className={`inline-flex size-6 items-center justify-center rounded-full text-slate-500 hover:bg-navy-900/5 hover:text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ${
          open ? "bg-navy-900/5 text-navy-900" : ""
        }`}
      >
        <Icon name="info" className="size-4" />
      </button>
      <div
        ref={popoverRef}
        id={id}
        popover="auto"
        role="dialog"
        aria-labelledby={titleId}
        onToggle={onToggle}
        // Off-screen until placed, so it never shows at the browser's default spot.
        style={{ top: -9999, left: -9999, right: "auto", width: WIDTH }}
        className="fixed m-0 overflow-hidden rounded-[10px] border border-line-200 bg-white p-0 text-start shadow-soft"
      >
        <div className="p-4">
          <p id={titleId} className="text-[15px] font-semibold text-navy-900">
            {t.title}
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {t.list.map((text) => (
              <li key={text} className="flex items-start gap-2 text-[15px] leading-6 text-slate-700">
                {/* Centered on the first line: (24px line − 16px icon) / 2. */}
                <Icon name="check" className="mt-1 size-4 text-teal-600" strokeWidth={2.4} />
                {text}
              </li>
            ))}
          </ul>
        </div>
        {/* Its footer: what the knowledge is built on, apart from the list. */}
        <div className="border-t border-line-200 bg-sand-50 px-4 py-3">
          <p className="flex items-start gap-2 text-sm leading-5 text-slate-500">
            {/* Centered on the first line: (20px line − 16px icon) / 2. */}
            <Icon name="shield" className="mt-0.5 size-4" />
            {procedure}
          </p>
          <a
            href={sourcesUrl}
            {...newTab}
            className="ms-6 mt-2 inline-flex items-center gap-1 text-[15px] font-semibold text-teal-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
          >
            {t.sources}
            <Icon name="arrow" className="size-3.5" />
          </a>
        </div>
      </div>
    </>
  );
}
