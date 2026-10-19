import type { ReactNode } from "react";
import { Icon } from "../icons";

// The home page's illustrations. They show the idea, not the app's exact
// screens: documents are drawn as paper, their text as grey lines, and what
// Visamo adds floats over them in white chips and notes.

/** A white card for an app screen in brief (the stage tracker). */
export function MockupCard({
  label,
  title,
  subtitle,
  children,
}: {
  /** What the illustration is an example of, for screen readers. */
  label: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <figure
      aria-label={label}
      className="relative mx-auto w-full max-w-[460px] rounded-2xl bg-white p-5 shadow-float ring-1 ring-line-200 sm:p-6"
    >
      <p className="font-semibold text-navy-900">{title}</p>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      {children}
    </figure>
  );
}

/** A document drawn as a sheet of paper: an emblem, its name, and lines for its text. */
export function Paper({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={`relative rounded-2xl bg-white p-6 shadow-float ring-1 ring-line-200 sm:p-7 ${className}`}>
      <div className="flex flex-col items-center">
        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full ring-1 ring-line-200">
          <span className="size-5 rounded-full bg-sand-50 ring-1 ring-line-200" />
        </span>
        <p className="mt-3 text-center font-display text-lg font-semibold text-navy-900 sm:text-xl">{title}</p>
        <Line className="mt-2 w-2/5" />
      </div>
      {children}
    </div>
  );
}

/** A line of the document's text, as a grey bar. The width comes in `className`. */
export function Line({ className = "", tone = "plain" }: { className?: string; tone?: "plain" | "alert" }) {
  const color = tone === "alert" ? "bg-crimson-600/25" : "bg-line-200";
  return <span aria-hidden="true" className={`block h-2 rounded-full ${color} ${className}`} />;
}

/** An official stamp, as a dashed ring. */
export function Stamp() {
  return (
    <span
      aria-hidden="true"
      className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-slate-300"
    >
      <span className="size-8 rounded-full bg-sand-50" />
    </span>
  );
}

/**
 * A small white chip floating over the paper: a teal check for what Visamo
 * confirmed, a crimson mark for what needs fixing.
 */
export function StatusChip({
  children,
  tone = "ok",
  size = "md",
}: {
  children: ReactNode;
  tone?: "ok" | "fix";
  size?: "sm" | "md";
}) {
  const sm = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-white font-semibold whitespace-nowrap text-navy-900 shadow-float ring-1 ring-line-200/70 ${
        sm ? "py-1 ps-1 pe-3 text-xs" : "py-1.5 ps-1.5 pe-4 text-sm"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full text-white ${sm ? "size-5" : "size-7"} ${
          tone === "ok" ? "bg-teal-600" : "bg-crimson-600"
        }`}
      >
        {tone === "ok" ? (
          <Icon name="check" className={sm ? "size-3" : "size-4"} strokeWidth={2.8} />
        ) : (
          <FixMark className={sm ? "size-3" : "size-4"} />
        )}
      </span>
      {children}
    </span>
  );
}

/** An exclamation mark, for what needs fixing. */
export function FixMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round">
      <path d="M12 6.5v7M12 17.5h.01" />
    </svg>
  );
}
