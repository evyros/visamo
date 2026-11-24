import type { ReactNode } from "react";

// Pieces of the billing page (settings/billing): the file's balances side by
// side in one card, and the purchases as a list. The page works out every
// text; these only lay it out.

/** A section's title, above its card rather than inside it. */
export function BillingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-navy-900">{title}</h2>
      {children}
    </section>
  );
}

/**
 * The balances: tiles side by side with a hairline between them (stacked on a
 * phone), and a footnote strip along the card's foot.
 */
export function BalanceCard({ footnote, children }: { footnote: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-line-200 bg-white shadow-soft">
      <div className="grid *:border-line-200 max-sm:*:not-first:border-t sm:grid-cols-2 sm:*:not-first:border-s">
        {children}
      </div>
      <div className="flex items-start gap-2.5 border-t border-line-200 bg-sand-50/70 px-5 py-3.5 text-sm leading-relaxed text-slate-500 sm:px-6">
        {footnote}
      </div>
    </div>
  );
}

/**
 * One balance: its illustration and label, what the file has, and at the
 * foot what adds to it. `offer` washes the tile in teal: what's there to buy.
 */
export function BalanceTile({
  glyph,
  label,
  offer = false,
  action,
  children,
}: {
  glyph: ReactNode;
  label: string;
  offer?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col p-5 sm:p-6 ${offer ? "bg-linear-to-b from-teal-100/70 to-white" : ""}`}>
      <div className="flex items-center gap-3">
        {glyph}
        <p className="text-[15px] font-medium text-slate-700">{label}</p>
      </div>
      <div className="mt-4 mb-6">{children}</div>
      {action && <div className="mt-auto">{action}</div>}
    </div>
  );
}

/** A count, large: the tile's headline. */
export function BalanceNumber({ children }: { children: ReactNode }) {
  return (
    <p className="font-display text-[2.75rem] leading-none font-semibold tracking-tight text-navy-900 tabular-nums">
      {children}
    </p>
  );
}

/** A thin bar of what's left of what was granted, under a count that's running low. */
export function BalanceMeter({ left, granted }: { left: number; granted: number }) {
  const share = granted > 0 ? Math.max(0, Math.min(1, left / granted)) : 0;
  return (
    <div aria-hidden className="mt-4 h-1.5 overflow-hidden rounded-full bg-line-200">
      <div className="h-full rounded-full bg-amber-500" style={{ width: `${share * 100}%` }} />
    </div>
  );
}

const compactButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[15px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";

/** The tile's purchase, when it's the one to buy. */
export const tilePrimaryButton = `${compactButton} bg-teal-600 text-white shadow-sm hover:bg-teal-700 focus-visible:outline-teal-600`;

/** The tile's purchase, as a quieter outline. */
export const tileSecondaryButton = `${compactButton} border-[1.5px] border-navy-900 text-navy-900 hover:bg-navy-900/5 focus-visible:outline-navy-900`;

/** A link at a tile's foot, with an arrow that stays on its last line when it wraps. */
export const tileLink = "group text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline";

/** The purchases: one row each, with the amounts lined up in a column. */
export function PurchaseList({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 divide-y divide-line-200 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
      {children}
    </ul>
  );
}

/**
 * A purchase: what it was and its details, the amount, and the invoice, which
 * goes under the details on a phone. A refunded one fades.
 */
export function PurchaseRow({
  glyph,
  title,
  details,
  amount,
  invoice,
  faded = false,
}: {
  glyph: ReactNode;
  title: ReactNode;
  details: string;
  amount: ReactNode;
  invoice: ReactNode;
  faded?: boolean;
}) {
  return (
    <li className="col-span-full grid grid-cols-subgrid items-center gap-y-3 px-5 py-4 sm:px-6">
      <div className={`self-start sm:self-center ${faded ? "opacity-50 grayscale" : ""}`}>{glyph}</div>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-navy-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{details}</p>
      </div>
      <div className="self-start text-end sm:self-center">{amount}</div>
      {invoice && (
        <div className="max-sm:col-span-2 max-sm:col-start-2 sm:justify-self-end">{invoice}</div>
      )}
    </li>
  );
}

/** "Refunded" or "Cancelled", after a purchase's name. */
export function PurchaseBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-sand-50 px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-line-200">
      {children}
    </span>
  );
}

export const invoiceButton =
  "inline-flex h-8 items-center gap-1.5 rounded-full border border-line-200 px-3 text-sm font-semibold text-teal-700 transition-colors hover:border-teal-600/40 hover:bg-teal-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";

/** No purchases yet: an empty receipt over the line that says so. */
export function PurchasesEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <ReceiptGlyph className="size-14" />
      <p className="mt-3 text-[15px] text-slate-500">{children}</p>
    </div>
  );
}

// Spot illustrations: line drawings on a soft tile, a size up from the icons
// (components/icons.tsx) and in the same hand: round caps and joins, navy
// lines, a teal accent. Drawn on a 48px grid.

function Spot({ className, children }: { className: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <rect width="48" height="48" rx="14" className="fill-teal-100" />
      {children}
    </svg>
  );
}

/** Two speech bubbles, the front one typing: chat messages, and the message pack. */
export function MessagesGlyph({ className = "size-11" }: { className?: string }) {
  return (
    <Spot className={className}>
      <path
        d="M25.5 10h8a4.5 4.5 0 0 1 4.5 4.5v4a4.5 4.5 0 0 1-1.5 3.4V26l-3.8-3h-7.2a4.5 4.5 0 0 1-4.5-4.5v-4a4.5 4.5 0 0 1 4.5-4.5Z"
        className="fill-teal-600"
      />
      <path
        d="M15 17h11a5 5 0 0 1 5 5v5a5 5 0 0 1-5 5h-8l-4.5 4v-4.4A5 5 0 0 1 10 27v-5a5 5 0 0 1 5-5Z"
        strokeWidth={1.75}
        className="fill-white stroke-navy-900"
      />
      <circle cx="15.5" cy="24.5" r="1.4" className="fill-navy-900" />
      <circle cx="20.5" cy="24.5" r="1.4" className="fill-navy-900" />
      <circle cx="25.5" cy="24.5" r="1.4" className="fill-navy-900" />
    </Spot>
  );
}

/**
 * A page sealed with the logo's V: document checks, and Full file check.
 * `open` leaves the seal outlined: there to get, not had.
 */
export function FileCheckGlyph({ open = false, className = "size-11" }: { open?: boolean; className?: string }) {
  return (
    <Spot className={className}>
      <path
        d="M15 9h12l7 7v19a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2Z"
        strokeWidth={1.75}
        className="fill-white stroke-navy-900"
      />
      <path d="M27 9v5a2 2 0 0 0 2 2h5" strokeWidth={1.75} className="stroke-navy-900" />
      <path d="M18 19.5h6M18 24h9M18 28.5h5" strokeWidth={1.75} className="stroke-slate-300" />
      <circle cx="33.5" cy="33.5" r="8" strokeWidth={3} className={open ? "fill-teal-100 stroke-teal-100" : "fill-teal-600 stroke-teal-100"} />
      {open && <circle cx="33.5" cy="33.5" r="6.5" strokeWidth={1.5} strokeDasharray="2.2 2.4" className="fill-white stroke-teal-600" />}
      <path d="m30.3 31.2 3.2 5.1 3.2-5.1" strokeWidth={2} className={open ? "stroke-teal-600" : "stroke-white"} />
    </Spot>
  );
}

/** A blank receipt with a torn edge: no purchases yet. */
function ReceiptGlyph({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <circle cx="24" cy="24" r="22" className="fill-sand-50" />
      <path
        d="M16 8h16a2 2 0 0 1 2 2v29l-3.33-2-3.33 2-3.34-2-3.33 2-3.34-2L14 39V10a2 2 0 0 1 2-2Z"
        strokeWidth={1.5}
        className="fill-white stroke-navy-900"
      />
      <path d="M18.5 14.5h11M18.5 19h7" strokeWidth={1.5} className="stroke-slate-300" />
      <path d="M18.5 29h4" strokeWidth={1.5} className="stroke-slate-300" />
      <path d="M26 29h3.5" strokeWidth={2} className="stroke-teal-600" />
      <path d="M18.5 24.5h11" strokeWidth={1.5} strokeDasharray="1 2.5" className="stroke-slate-300" />
    </svg>
  );
}
