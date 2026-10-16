"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Icon } from "./icons";

/** A term as the page shows it, in the reader's language: its name, and its name in the other language. */
export type GlossaryEntry = {
  id: string;
  name: string;
  other: { text: string; lang: string };
  /** How it's said, in Latin letters: only for readers who don't read Hebrew. */
  said?: string;
  meaning: string;
  guide?: { href: string; label: string };
};

export type GlossarySection = {
  id: string;
  title: string;
  note?: { title: string; body: string };
  entries: GlossaryEntry[];
};

/** For matching: lower case, with the spaces, dashes and slashes that people type differently left out. */
const normalize = (text: string) => text.toLowerCase().replace(/[\s\-/'"״׳.,()]+/g, "");

const searchable = (entry: GlossaryEntry) =>
  normalize([entry.name, entry.other.text, entry.said, entry.meaning].filter(Boolean).join(" "));

/** The glossary's terms by group, with a search that narrows them as you type. Every term is in the page's HTML. */
export function GlossaryList({
  sections,
  labels,
}: {
  sections: GlossarySection[];
  labels: { label: string; placeholder: string; empty: string; clear: string };
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const needle = normalize(deferred);
  const shown = needle
    ? sections
        .map((section) => ({ ...section, entries: section.entries.filter((entry) => searchable(entry).includes(needle)) }))
        .filter((section) => section.entries.length > 0)
    : sections;

  return (
    <div>
      <div className="sticky top-[60px] z-10 -mx-4 bg-sand-50/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-[72px] lg:-mx-8 lg:px-8">
        <label htmlFor="glossary-search" className="sr-only">
          {labels.label}
        </label>
        <div className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-slate-500"
          />
          <input
            id="glossary-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.placeholder}
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-line-200 bg-white ps-12 pe-24 text-[16px] text-navy-900 placeholder:text-slate-500 focus:border-teal-600 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute end-2 top-1/2 h-9 -translate-y-1/2 rounded-lg px-3 text-sm font-semibold text-teal-700 hover:bg-teal-100"
            >
              {labels.clear}
            </button>
          )}
        </div>
        {!needle && (
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm [scrollbar-width:none]">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="shrink-0 rounded-full border border-line-200 bg-white px-3 py-1 font-medium text-slate-700 hover:border-teal-600 hover:text-teal-700"
              >
                {section.title}
              </a>
            ))}
          </nav>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {needle && shown.length === 0 ? labels.empty.replace("{query}", deferred) : ""}
      </div>
      {needle && shown.length === 0 && (
        <p className="mt-10 text-center text-slate-500">{labels.empty.replace("{query}", deferred)}</p>
      )}

      <div className="mt-6 space-y-12">
        {shown.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-40">
            <h2 className="font-display text-2xl leading-tight font-semibold text-navy-900 sm:text-[28px]">
              {section.title}
            </h2>
            <dl className="mt-4 overflow-hidden rounded-2xl border border-line-200 bg-white">
              {section.entries.map((entry) => (
                <div
                  key={entry.id}
                  id={entry.id}
                  className="scroll-mt-40 border-b border-line-200 px-5 py-4 last:border-b-0 target:bg-teal-100/60 sm:grid sm:grid-cols-2 sm:gap-x-6"
                >
                  <dt className="font-semibold text-navy-900">{entry.name}</dt>
                  <dd className="mt-1 sm:col-start-2 sm:row-span-3 sm:row-start-1 sm:mt-0">
                    {/* Isolated, so a Hebrew name on an English page keeps to the column's start, like the line under it. */}
                    <span className="block text-[17px] text-navy-900">
                      <bdi lang={entry.other.lang}>{entry.other.text}</bdi>
                    </span>
                    {entry.said && <span className="block text-[15px] text-slate-500 italic">{entry.said}</span>}
                  </dd>
                  <dd className="mt-1 text-[15px] leading-6 text-slate-700">{entry.meaning}</dd>
                  {entry.guide && (
                    <dd className="mt-1.5">
                      <Link
                        href={entry.guide.href}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"
                      >
                        {entry.guide.label}
                        <Icon name="arrow" className="size-3.5" />
                      </Link>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
            {section.note && (
              <div className="mt-5 rounded-xl border-s-4 border-teal-600 bg-teal-100/60 px-5 py-4 text-[16px] leading-7">
                <p className="font-semibold text-navy-900">{section.note.title}</p>
                <p className="mt-1">{section.note.body}</p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
