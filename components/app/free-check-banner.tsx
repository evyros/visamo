"use client";

import Link from "next/link";
import { useState } from "react";
import { DISMISS_MAX_AGE, FREE_CHECK_DISMISSED_COOKIE } from "@/lib/device-flags";
import { Icon } from "@/components/icons";

/**
 * Tells a couple without Full file check that their free check is still there,
 * and where to start: the uploaded documents most likely to need fixing, each
 * linking to its card. Shown in the invite banner's place, when that one
 * isn't. Dismissing it is remembered on this device (a cookie the overview
 * reads), not on the account.
 */
export function FreeCheckBanner({
  title,
  body,
  startWith,
  documents,
  dismiss,
}: {
  title: string;
  body: string;
  /** The line above the recommended documents. */
  startWith: string;
  /** The recommended documents; none before anything's uploaded, and then the list isn't shown. */
  documents: { title: string; href: string }[];
  dismiss: string;
}) {
  const [shown, setShown] = useState(true);
  if (!shown) return null;

  function onDismiss() {
    document.cookie = `${FREE_CHECK_DISMISSED_COOKIE}=1; path=/; max-age=${DISMISS_MAX_AGE}; samesite=lax`;
    setShown(false);
  }

  return (
    // On a phone the drawing and the title share the first row, and the rest takes the whole
    // width below; from `sm` up, the drawing sits beside it all. Clear of the close button.
    <section className="relative mt-6 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 rounded-card border border-blue-200 bg-blue-50 p-4 sm:items-start sm:gap-x-4 sm:gap-y-1 sm:p-5 sm:pe-14">
      <GiftDocument className="size-14 sm:row-span-2 sm:size-16" />
      <h2 className="pe-8 font-semibold text-navy-900 sm:pe-0">{title}</h2>
      <div className="col-span-2 sm:col-span-1 sm:col-start-2">
        <p className="text-[15px] text-slate-700">{body}</p>
        {documents.length > 0 && (
          <>
            <p className="mt-3 text-[15px] font-semibold text-navy-900">{startWith}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {documents.map((d) => (
                <li key={d.href}>
                  <Link
                    href={d.href}
                    className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-blue-300 bg-white px-4 py-2 text-start text-[15px] font-semibold text-navy-800 transition-colors hover:border-navy-800 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
                  >
                    <Icon name="file" className="size-4 shrink-0" />
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <button
        type="button"
        aria-label={dismiss}
        onClick={onDismiss}
        className="absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5 sm:end-4 sm:top-4"
      >
        <Icon name="x" className="size-5" />
      </button>
    </section>
  );
}

/**
 * A document with a gift in front of it: a box and its lid, a ribbon, a bow,
 * and two sparkles. One outlined style, like the icons: navy strokes on flat
 * fills. A coral box with a navy ribbon and bow, the sparkles coral too.
 * Each part of the box is filled, ribboned, then outlined, so the ribbon
 * stops at the outline. Decorative.
 */
function GiftDocument({ className }: { className?: string }) {
  const outline = { className: "fill-none stroke-navy-900", strokeWidth: 2, strokeLinejoin: "round" as const };
  return (
    // Shifted 2 units so the drawing, sparkles included, sits centered.
    <svg viewBox="2 0 64 64" aria-hidden="true" focusable="false" className={className}>
      {/* The document, its corner folded, a heading and two lines of text. */}
      <path d="M10 5h22l8 8v34a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Z" {...outline} className="fill-white stroke-navy-900" />
      <path d="M32 5v5a3 3 0 0 0 3 3h5" {...outline} className="fill-teal-100 stroke-navy-900" />
      <path d="M12 18h12" className="stroke-teal-600" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 24h21M12 30h13" className="stroke-slate-300" strokeWidth="2.5" strokeLinecap="round" />
      {/* The box, the lid's shadow across its top. */}
      <rect x="29" y="40" width="24" height="18" rx="2.5" className="fill-coral-400" />
      <rect x="39" y="40" width="4" height="18" className="fill-navy-900" />
      <rect x="29" y="40" width="24" height="3.5" className="fill-navy-900/15" />
      <rect x="29" y="40" width="24" height="18" rx="2.5" {...outline} />
      {/* The lid. */}
      <rect x="26.5" y="34" width="29" height="7" rx="2" className="fill-coral-400" />
      <rect x="39" y="34" width="4" height="7" className="fill-navy-900" />
      <rect x="26.5" y="34" width="29" height="7" rx="2" {...outline} />
      {/* The bow: two loops and the knot. */}
      <path
        d="M41 34c-3.5-7-12-6.5-9.2-1.8 1.2 1.9 5 2.1 9.2 1.8Zm0 0c3.5-7 12-6.5 9.2-1.8-1.2 1.9-5 2.1-9.2 1.8Z"
        {...outline}
        className="fill-navy-900 stroke-navy-900"
      />
      <rect x="39" y="31.5" width="4" height="3.5" rx="1.25" {...outline} className="fill-navy-900 stroke-navy-900" />
      {/* Sparkles. */}
      <path d="M51 6Q51 12 57 12Q51 12 51 18Q51 12 45 12Q51 12 51 6Z" className="fill-coral-400" />
      <path d="M58.5 19Q58.5 22 61.5 22Q58.5 22 58.5 25Q58.5 22 55.5 22Q58.5 22 58.5 19Z" className="fill-coral-400" />
    </svg>
  );
}
