"use client";

import { useEffect, useRef, useState } from "react";
import { Line, Paper, Stamp, StatusChip } from "./mockup";

// The hero's illustration: a couple's documents as a deck of papers, each
// coming to the front in turn with its check's result. Issues show only as a
// chip and a marked line for each; what they mean is shown under Features.

type DeckDocument = {
  name: string;
  /** How many issues its check found: 0 for a document that passed. */
  issues: number;
  /** The chip's text: "Checked", "Found 2 issues". */
  result: string;
};

/** The paper's text lines, by width, and which of them the issues mark, in order. */
const lines = ["w-full", "w-11/12", "w-full", "w-2/3"];
const marked = [1, 3];

/** How long each document stays at the front, in ms. */
const STEP = 3200;

// Where each card sits, by how far it is behind the front one. The last slot
// is the card that just left the front: it lifts away outward, away from the
// text, then comes back in at the back on the next step.
const front = "z-30";
const behind = [
  "z-20 translate-x-2 translate-y-1 rotate-[4deg] scale-[0.98] rtl:-translate-x-2 rtl:-rotate-[4deg]",
  "z-10 -translate-x-2 translate-y-2 -rotate-[6deg] scale-[0.96] rtl:translate-x-2 rtl:rotate-[6deg]",
];
const leaving = "z-40 translate-x-1/4 -translate-y-6 rotate-[10deg] opacity-0 rtl:-translate-x-1/4 rtl:-rotate-[10deg]";
const hidden = "z-0 scale-90 opacity-0";

function slot(position: number, count: number) {
  if (position === 0) return front;
  if (position === count - 1) return leaving;
  return behind[position - 1] ?? hidden;
}

export function DocumentDeck({
  label,
  documents,
  progress,
  ratio,
}: {
  label: string;
  documents: DeckDocument[];
  progress: string;
  ratio: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const count = documents.length;

  // Runs only while it's on screen and the tab is in view, and never for
  // people who asked for less motion: they see the first document, still.
  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let onScreen = false;
    let timer: number | undefined;
    const update = () => {
      const run = onScreen && document.visibilityState === "visible";
      if (run && timer === undefined) timer = window.setInterval(() => setActive((a) => (a + 1) % count), STEP);
      if (!run && timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [count]);

  return (
    // On a phone, side padding keeps the chips that stick out past the deck clear of the screen's edges.
    <figure
      ref={ref}
      aria-label={label}
      className="relative mx-auto w-full max-w-[360px] px-5 py-8 sm:max-w-[380px] sm:px-0"
    >
      <div className="relative">
        {/* Every card in one grid cell: the deck is as tall as a card, and each moves by transform alone. */}
        <div aria-hidden="true" className="grid">
          {documents.map((doc, i) => {
            const position = (i - active + count) % count;
            const isFront = position === 0;
            const flagged = marked.slice(0, doc.issues);
            return (
              <div
                key={doc.name}
                className={`relative [grid-area:1/1] transition-[translate,rotate,scale,opacity] duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${slot(position, count)}`}
              >
                <Paper title={doc.name}>
                  <div className="mt-6 space-y-2.5">
                    {/* Each issue marks a line, as the check does. */}
                    {lines.map((width, line) =>
                      flagged.includes(line) ? (
                        <div key={line} className="-mx-2 rounded-lg bg-crimson-100 px-2 py-2 ring-1 ring-crimson-600/30">
                          <Line tone="alert" className={width} />
                        </div>
                      ) : (
                        <Line key={line} className={width} />
                      ),
                    )}
                  </div>
                  <div className="mt-8 flex items-end justify-between">
                    <div className="w-24 space-y-1.5">
                      <Line className="w-full" />
                      <Line className="w-3/5" />
                    </div>
                    <Stamp />
                  </div>
                </Paper>
                {/* The result pops in once the card has arrived at the front. */}
                <span
                  className={`absolute -end-3 -top-4 transition-[opacity,scale] duration-300 sm:-end-8 ${
                    isFront ? "scale-100 opacity-100 delay-500" : "scale-90 opacity-0"
                  }`}
                >
                  <StatusChip tone={doc.issues > 0 ? "fix" : "ok"}>{doc.result}</StatusChip>
                </span>
              </div>
            );
          })}
        </div>

        <div
          className="animate-rise absolute -start-3 -bottom-8 z-50 w-60 rounded-2xl bg-white p-4 shadow-float ring-1 ring-line-200/70 sm:-start-10"
          style={{ animationDelay: "0.5s" }}
        >
          <p className="text-sm font-semibold text-navy-900">{progress}</p>
          <div aria-hidden="true" className="mt-2.5 h-1.5 rounded-full bg-line-200">
            <div className="h-full rounded-full bg-teal-600" style={{ width: `${ratio * 100}%` }} />
          </div>
        </div>
      </div>
    </figure>
  );
}
