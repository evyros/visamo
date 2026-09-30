import type { ReactNode } from "react";

// Building blocks shared by the admin pages. The panel is in English, and
// times are Israel's: the server runs in UTC.

const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

/** e.g. "30 Sept 2026, 01:15", in Israel time. */
export const formatDateTime = (date: Date) => dateTime.format(date);

/** A case's plan (lib/chat/plans.ts), by its tier's name on the pricing page. */
export const planLabel: Record<string, string> = { free: "Free", assistant: "Assistant", filePrep: "File Preparation" };

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const pillTones = {
  neutral: "bg-sand-50 text-slate-700 ring-1 ring-line-200",
  teal: "bg-teal-100 text-teal-700",
  amber: "bg-amber-100 text-amber-500",
  terracotta: "bg-terracotta-100 text-terracotta-600",
  /** Only for a check's "needs fixing", as in the app. */
  crimson: "bg-crimson-100 text-crimson-600",
  slate: "bg-slate-300/30 text-slate-500",
  navy: "bg-navy-900 text-white",
};

export type PillTone = keyof typeof pillTones;

export function Pill({ tone = "neutral", children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${pillTones[tone]}`}
    >
      {children}
    </span>
  );
}

/** A page's title and the line under it. */
export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{title}</h1>
      {children && <div className="mt-2 text-[15px] text-slate-500">{children}</div>}
    </div>
  );
}

/** A figure with its label, for a page's summary row. */
export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="rounded-card border border-line-200 bg-white px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-navy-900 tabular-nums">{value}</div>
      {note && <div className="mt-0.5 text-[13px] text-slate-500">{note}</div>}
    </div>
  );
}
