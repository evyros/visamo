import type { ReactNode } from "react";
import type { CreditTotals } from "@/lib/credits";

// Building blocks shared by the admin pages. The panel is in English, and
// times are Israel's: the server runs in UTC.

const dateTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jerusalem",
});

/** e.g. "30 Sept 2026, 01:15", in Israel time. */
export const formatDateTime = (date: Date) => dateTime.format(date);

/** What a case has bought (lib/products.ts), by the names on the pricing page. */
export function purchasesLabel(access: { paid: boolean | null; fileCheck: boolean | null }) {
  return access.fileCheck ? "Full file check" : access.paid ? "Message pack" : "Free";
}

const numbers = new Intl.NumberFormat("en-US");

/** A count with thousands separators, e.g. "6,416". */
export const formatNumber = (value: number) => numbers.format(value);

/** US dollars: cents from a cent up, and four places below it, so a single call doesn't read as $0.00. */
export function formatUsd(usd: number) {
  if (usd === 0) return "$0";
  return `$${usd.toFixed(usd >= 0.01 ? 2 : 4)}`;
}

/** A case's model cost, and how many runs or answers it leaves out for having no reported cost. */
export function CostFigure({ cost }: { cost: { usd: number; unknown: number } }) {
  return (
    <div className="tabular-nums">
      <div className="font-semibold text-navy-900">{formatUsd(cost.usd)}</div>
      {cost.unknown > 0 && <div className="text-[13px] text-amber-500">+{cost.unknown} unpriced</div>}
    </div>
  );
}

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

/** At this share of what was granted, the balance is running low (the app's checks notice). */
const LOW_SHARE = 0.8;

export const isLow = (totals: CreditTotals) => totals.granted > 0 && totals.used >= totals.granted * LOW_SHARE;

/**
 * A balance: what's left, and under it what was used of what was granted.
 * Amber when it's running low, and flagged when the balance and the ledger
 * disagree, which only a bug (or a hand edit) can cause.
 */
export function BalanceFigure({ left, totals }: { left: number; totals: CreditTotals }) {
  const drift = totals.granted - totals.used !== left;
  return (
    <div className="tabular-nums">
      <div className={`font-semibold ${isLow(totals) ? "text-amber-500" : "text-navy-900"}`}>{left} left</div>
      <div className="text-[13px] text-slate-500">
        {totals.used} used of {totals.granted}
      </div>
      {drift && <div className="text-[13px] font-semibold text-terracotta-600">Ledger says {totals.granted - totals.used}</div>}
    </div>
  );
}
