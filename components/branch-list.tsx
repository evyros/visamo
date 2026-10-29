"use client";

import { useDeferredValue, useState, type ReactNode } from "react";
import type { BranchLoad } from "@/lib/branch-load";
import { Icon } from "./icons";

/** A branch as the list filters it: its card is rendered on the server. */
export type BranchListItem = { id: string; level: BranchLoad; search: string; card: ReactNode };

/** For matching: lower case, with the spaces, dashes and quotes that people type differently left out. */
const normalize = (text: string) => text.toLowerCase().replace(/[\s\-–/'"״׳.,()]+/g, "");

const levels: BranchLoad[] = ["lessBusy", "typical", "busier", "unknown"];

/** Every branch's card, with a search and a filter by how busy. Every card is in the page's HTML. */
export function BranchList({
  items,
  labels,
}: {
  items: BranchListItem[];
  labels: {
    search: { label: string; placeholder: string; empty: string; clear: string };
    all: string;
    levels: Record<BranchLoad, string>;
  };
}) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<BranchLoad | null>(null);
  const deferred = useDeferredValue(query);
  const needle = normalize(deferred);
  const shown = items.filter((item) => (!level || item.level === level) && (!needle || item.search.includes(needle)));
  const count = (l: BranchLoad | null) => items.filter((item) => !l || item.level === l).length;

  const chip = (value: BranchLoad | null, text: string) => {
    const active = level === value;
    return (
      <button
        key={value ?? "all"}
        type="button"
        aria-pressed={active}
        onClick={() => setLevel(value)}
        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${
          active ? "border-navy-900 bg-navy-900 text-white" : "border-line-200 bg-white text-navy-900 hover:border-teal-600"
        }`}
      >
        {text}
        <span className={`tabular-nums ${active ? "text-white/70" : "text-slate-500"}`}>{count(value)}</span>
      </button>
    );
  };

  return (
    <div>
      <div className="-mx-4 bg-sand-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:sticky md:top-[60px] md:z-10 lg:top-[72px] lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:max-w-sm md:flex-1">
            <label htmlFor="branch-search" className="sr-only">
              {labels.search.label}
            </label>
            <Icon name="search" className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
            <input
              id="branch-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.search.placeholder}
              autoComplete="off"
              className="h-11 w-full rounded-xl border border-line-200 bg-white ps-12 pe-20 text-[16px] text-navy-900 placeholder:text-slate-500 focus:border-teal-600 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute end-2 top-1/2 h-8 -translate-y-1/2 rounded-lg px-3 text-sm font-semibold text-teal-700 hover:bg-teal-100"
              >
                {labels.search.clear}
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {chip(null, labels.all)}
            {levels.map((l) => chip(l, labels.levels[l]))}
          </div>
        </div>
      </div>

      {shown.length ? (
        <ul className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => (
            <li key={item.id} id={item.id} className="scroll-mt-40">
              {item.card}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-center text-slate-500">{labels.search.empty.replace("{query}", query)}</p>
      )}
    </div>
  );
}
