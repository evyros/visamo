import type { ReactNode } from "react";

// The sources page's glyphs (app/[lang]/sources): its five sources and the two
// things built on them. One 32px grid, a fine line, a touch of the theme's
// tint. Each is symmetric enough to read the same in both directions. Drawn
// once and used twice: in the hero's drawing (as a <g>) and beside each
// source (as an <svg>).

const paper = "#fff";
const tint = "#e3f0ed"; // teal-100

const glyphs = {
  // Two rings: the founder's own marriage.
  firsthand: (
    <>
      <circle cx="12.5" cy="19" r="7" />
      <circle cx="19.5" cy="19" r="7" />
      <path d="M19.5 7.5 22 10l-2.5 2.5L17 10Z" fill={tint} />
      <path d="m24.5 7 1.5-1.5" />
    </>
  ),
  // Two speech bubbles: couples telling how it went.
  couples: (
    <>
      <path d="M16 14h9a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-.5v3.5L21 24h-5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Z" fill={tint} />
      <path d="M7 6h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-6l-4 3.5V17a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z" fill={paper} />
      <g fill="currentColor" stroke="none">
        <circle cx="8.5" cy="11.5" r="1" />
        <circle cx="12" cy="11.5" r="1" />
        <circle cx="15.5" cy="11.5" r="1" />
      </g>
    </>
  ),
  // A couple's folder, with someone beside it: going through the process with them.
  program: (
    <>
      <path
        d="M4.5 9.5A2.5 2.5 0 0 1 7 7h5l2.5 3H24a2.5 2.5 0 0 1 2.5 2.5v10A2.5 2.5 0 0 1 24 25H7a2.5 2.5 0 0 1-2.5-2.5Z"
        fill={paper}
      />
      <path d="M8.5 15h8M8.5 19h5" />
      <circle cx="23" cy="22.5" r="5.5" fill={tint} />
      <circle cx="23" cy="21" r="1.6" />
      <path d="M20.2 25.8a2.9 2.9 0 0 1 5.6 0" />
    </>
  ),
  // The scales: the lawyers.
  lawyers: (
    <>
      <circle cx="16" cy="6.5" r="1.5" />
      <path d="M16 8v17.5M11 25.5h10M6.5 10.5h19" />
      <path d="M6.5 10.5 3.5 18M6.5 10.5l3 7.5M25.5 10.5l-3 7.5M25.5 10.5l3 7.5" />
      <path d="M3 18h7a3.5 3.5 0 0 1-7 0ZM22 18h7a3.5 3.5 0 0 1-7 0Z" fill={tint} />
    </>
  ),
  // A sealed page: the Authority's procedures.
  procedures: (
    <>
      <path d="M9 4.5h9.5l6 6V26a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 26V6A1.5 1.5 0 0 1 9 4.5Z" fill={paper} />
      <path d="M18.5 4.5v6h6M11 14.5h9M11 18.5h5" />
      <circle cx="21" cy="23" r="4.5" fill={tint} />
      <circle cx="21" cy="23" r="1.6" />
    </>
  ),
  // A database's stacked disks: the government's registries and lists.
  databases: (
    <>
      <path d="M6.5 8.5v15c0 2 4.3 3.75 9.5 3.75s9.5-1.75 9.5-3.75v-15" fill={paper} />
      <path d="M6.5 13.5c0 2 4.3 3.75 9.5 3.75s9.5-1.75 9.5-3.75M6.5 18.5c0 2 4.3 3.75 9.5 3.75s9.5-1.75 9.5-3.75" />
      <ellipse cx="16" cy="8.5" rx="9.5" ry="3.75" fill={tint} />
    </>
  ),
  // A globe: what's shared online.
  online: (
    <>
      <circle cx="16" cy="16" r="10.5" fill={tint} />
      <ellipse cx="16" cy="16" rx="4.5" ry="10.5" />
      <path d="M5.5 16h21M7 10.5h18M7 21.5h18" />
    </>
  ),
  // The chat's bubble.
  chat: (
    <>
      <path
        d="M16 6.5c6.1 0 11 4 11 9s-4.9 9-11 9a12.6 12.6 0 0 1-4-.6L6 26l1.7-5C6 19.4 5 17.5 5 15.5c0-5 4.9-9 11-9Z"
        fill={paper}
      />
      <g fill="currentColor" stroke="none">
        <circle cx="11.5" cy="15.5" r="1.2" />
        <circle cx="16" cy="15.5" r="1.2" />
        <circle cx="20.5" cy="15.5" r="1.2" />
      </g>
    </>
  ),
  // A page with a tick: the document check.
  check: (
    <>
      <path d="M9 4.5h9.5l6 6V26a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 26V6A1.5 1.5 0 0 1 9 4.5Z" fill={paper} />
      <path d="M18.5 4.5v6h6" />
      <path d="m11.5 18 3 3 6-6.5" strokeWidth={2.2} />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type SourceGlyphName = keyof typeof glyphs;

/** The sources, in the page's order (`sources.list.items` in the messages). */
export const sourceGlyphs = [
  "firsthand",
  "procedures",
  "lawyers",
  "couples",
  "program",
  "databases",
  "online",
] as const satisfies readonly SourceGlyphName[];

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A glyph inside another drawing, its 32px grid centered on (x, y), drawn `scale` times as big. */
export function SourceGlyphGroup({
  name,
  x,
  y,
  scale = 1,
  className,
}: {
  name: SourceGlyphName;
  x: number;
  y: number;
  scale?: number;
  className?: string;
}) {
  return (
    <g
      transform={`translate(${x - 16 * scale} ${y - 16 * scale}) scale(${scale})`}
      className={className}
      {...stroke}
      strokeWidth={stroke.strokeWidth / Math.sqrt(scale)}
    >
      {glyphs[name]}
    </g>
  );
}

export function SourceGlyph({ name, className = "size-8" }: { name: SourceGlyphName; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={`shrink-0 ${className}`} {...stroke}>
      {glyphs[name]}
    </svg>
  );
}
