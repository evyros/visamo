"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";

// The survey's "how long after you filed" (components/branch-survey.tsx), a
// slider over lib/branch-report-options.ts's waitSteps. It's drawn here, over
// a visually hidden native range that keeps the keyboard and screen readers.
// The drawing takes the pointer itself: iOS Safari's own range moves only when
// a drag starts on its thumb, while this one takes a tap or a slide anywhere
// along it. A finger that sets off to scroll the page changes nothing. It
// starts with no value, so an untouched slider can't pass for an answer.

/** The thumb's width in px: its centre runs from half of it to the width less half of it. */
const THUMB = 28;

/** Where a stop sits along the track, as CSS: the thumb's start edge for `fraction` of the way. */
const at = (fraction: number) => `calc((100% - ${THUMB}px) * ${fraction})`;

export function WaitSlider({
  id,
  label,
  value,
  steps,
  choose,
  rtl,
  disabled,
  error,
  onChange,
}: {
  id: string;
  label: string;
  /** The stop chosen, or null before it's moved. */
  value: number | null;
  /** Each stop in words: "Under a week", "2 weeks"… */
  steps: string[];
  /** Shown until it's moved. */
  choose: string;
  rtl: boolean;
  disabled: boolean;
  error?: string;
  onChange: (step: number) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  /** A finger on the track: where it went down, and whether it has turned into a slide. */
  const touch = useRef<{ x: number; y: number; sliding: boolean } | null>(null);
  const last = steps.length - 1;
  const fraction = value === null ? 0 : value / last;

  const pick = (clientX: number) => {
    const box = track.current!.getBoundingClientRect();
    const along = Math.min(1, Math.max(0, (clientX - box.left - THUMB / 2) / (box.width - THUMB)));
    onChange(Math.round((rtl ? 1 - along : along) * last));
  };

  function down(e: PointerEvent<HTMLDivElement>) {
    if (disabled || e.button > 0) return;
    input.current?.focus({ preventScroll: true });
    e.currentTarget.setPointerCapture(e.pointerId);
    // A mouse or a pen sets it at once. A finger waits: a tap, a slide sideways, or the start of a scroll.
    if (e.pointerType === "touch") touch.current = { x: e.clientX, y: e.clientY, sliding: false };
    else pick(e.clientX);
  }

  function move(e: PointerEvent<HTMLDivElement>) {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const t = touch.current;
    if (t && !t.sliding) {
      const dx = Math.abs(e.clientX - t.x);
      if (dx < 6 || dx < Math.abs(e.clientY - t.y)) return;
      t.sliding = true;
    }
    pick(e.clientX);
  }

  function up(e: PointerEvent<HTMLDivElement>) {
    const t = touch.current;
    // A tap: lifted about where it went down. A finger that wandered off without sliding was scrolling.
    if (t && !t.sliding && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 10) pick(e.clientX);
    touch.current = null;
  }

  // Untouched, the native range sits on the first stop; the first key lands on a stop rather than past it.
  function key(e: KeyboardEvent<HTMLInputElement>) {
    if (value !== null || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(e.key)) return;
    e.preventDefault();
    onChange(e.key === "End" ? last : 0);
  }

  return (
    <div className={disabled ? "opacity-50" : ""}>
      <label htmlFor={id} className="block text-sm font-semibold text-navy-900">
        {label}
      </label>
      {/* The stop chosen, on a line of its own and of fixed height, so its changing length never moves the slider. */}
      <p aria-hidden="true" className="mt-0.5 flex h-8 items-center whitespace-nowrap">
        {disabled ? null : value === null ? (
          <span className="text-sm text-slate-500">{choose}</span>
        ) : (
          <span className="font-display text-xl leading-none font-semibold text-navy-900">{steps[value]}</span>
        )}
      </p>

      <div
        ref={track}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => (touch.current = null)}
        className={`relative mt-1 h-11 touch-pan-y select-none [-webkit-tap-highlight-color:transparent] ${
          disabled ? "pointer-events-none" : "cursor-pointer"
        }`}
      >
        <input
          ref={input}
          id={id}
          type="range"
          min={0}
          max={last}
          step={1}
          value={value ?? 0}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onKeyDown={key}
          aria-valuetext={value === null ? choose : steps[value]}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="peer sr-only"
        />
        <span className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#ece8df]" />
        {/* A dot at every stop, so the steps can be felt along the way. */}
        {steps.map((_, i) => (
          <span
            key={i}
            className="absolute top-1/2 size-1 -translate-y-1/2 rounded-full bg-white"
            style={{ insetInlineStart: `calc(${at(i / last)} + ${THUMB / 2 - 2}px)` }}
          />
        ))}
        {value !== null && (
          <span
            className="absolute start-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-teal-600"
            style={{ width: `calc(${at(fraction)} + ${THUMB / 2}px)` }}
          />
        )}
        <span
          className={`absolute top-1/2 size-7 -translate-y-1/2 rounded-full border-[3px] bg-white shadow-soft transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-600 ${
            error ? "border-terracotta-600" : value === null ? "border-slate-300" : "border-teal-700"
          }`}
          style={{ insetInlineStart: at(fraction) }}
        />
      </div>

      <div aria-hidden="true" className="flex justify-between text-xs text-slate-500">
        <span>{steps[0]}</span>
        <span>{steps[last]}</span>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-terracotta-600">
          {error}
        </p>
      )}
    </div>
  );
}
