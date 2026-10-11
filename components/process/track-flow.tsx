"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { GuideText } from "../guide";
import { Icon } from "../icons";

// The visas, from the first one to permanent status, as a flow. Each visa is a
// point on the line, and its length is the stretch to the next one; the line
// runs from teal into the navy destination, with a chevron pointing on
// (mirrored in RTL by Icon). A stage opens a short list of what it gives.

export function TrackFlow({
  title,
  stages,
  locale,
}: {
  title: string;
  stages: { name: string; length: string; details: string[] }[];
  locale: Locale;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const panel = useId();
  const last = stages.length - 1;

  return (
    <div className="mt-8">
      <p className="text-sm font-semibold text-navy-900">{title}</p>
      <ol className="mt-4 grid grid-cols-3">
        {stages.map((stage, i) => {
          const current = open === i;
          return (
            <li key={i} className="min-w-0">
              <button
                type="button"
                aria-expanded={current}
                aria-controls={panel}
                onClick={() => setOpen(current ? null : i)}
                className="group block w-full rounded-lg pe-3 text-start sm:pe-4"
              >
                <span aria-hidden="true" className="flex h-7 items-center">
                  {i === last ? (
                    <span
                      className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white shadow-soft transition-shadow ${
                        current ? "ring-4 ring-navy-900/15" : ""
                      }`}
                    >
                      <Icon name="check" className="size-4" strokeWidth={2.6} />
                    </span>
                  ) : (
                    <>
                      <span
                        className={`size-4 shrink-0 rounded-full border-[3px] border-teal-600 transition-colors ${
                          current ? "bg-teal-600 ring-4 ring-teal-600/15" : "bg-white group-hover:bg-teal-100"
                        }`}
                      />
                      <span
                        className={`ms-1.5 h-[3px] flex-1 rounded-full ${
                          i === 0 ? "bg-teal-600" : "bg-linear-to-r from-teal-600 to-navy-900 rtl:bg-linear-to-l"
                        }`}
                      />
                      <Icon name="chevron" className={`-ms-2 size-5 ${i === 0 ? "text-teal-600" : "text-navy-900"}`} strokeWidth={2.6} />
                    </>
                  )}
                </span>
                <span
                  className={`mt-3 flex items-center gap-1 text-xs font-semibold sm:text-sm ${
                    current ? "text-teal-700" : "text-slate-500 group-hover:text-teal-700"
                  }`}
                >
                  {stage.name}
                  <Icon name="chevronDown" className={`size-3.5 transition-transform ${current ? "rotate-180" : ""}`} strokeWidth={2.2} />
                </span>
                <span className="mt-0.5 block text-sm leading-snug font-semibold text-balance text-navy-900 sm:text-[16px]">
                  {stage.length}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div
        id={panel}
        role="region"
        aria-label={open === null ? undefined : stages[open].name}
        hidden={open === null}
        className="relative mt-4 rounded-2xl border border-line-200 bg-sand-50 p-4 sm:p-5"
      >
        {open !== null && (
          <>
            {/* A caret under the open stage's point. Physical borders: the rotated square looks the same in RTL. */}
            <span
              aria-hidden="true"
              className="absolute -top-[7px] size-3 rotate-45 border-t border-l border-line-200 bg-sand-50"
              style={{ insetInlineStart: `calc(${open} * 33.333% + ${open === last ? 8 : 2}px)` }}
            />
            <ul key={open} className="animate-rise space-y-2 text-[15px] leading-6">
              {stages[open].details.map((detail, j) => (
                <li key={j} className="flex gap-2.5">
                  <Icon name="check" className="mt-1 size-4 shrink-0 text-teal-600" strokeWidth={2.6} />
                  <span>
                    <GuideText text={detail} locale={locale} />
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
