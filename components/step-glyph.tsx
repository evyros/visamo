import type { ReactNode } from "react";

// The glyphs of a document's steps, drawn as a route: on the documents page's
// cards, and in the home page's illustration of them. Same 24px grid as the
// site's icons, a touch heavier, so they hold up small inside a circle.

const glyphs = {
  // A map pin: where to get it.
  where: (
    <>
      <path d="M12 21s-6.5-5.4-6.5-11a6.5 6.5 0 0 1 13 0c0 5.6-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  // A page with ticked lines: what it must include.
  include: (
    <>
      <path d="M17.5 21h-11a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5Z" />
      <path d="m8 8.5 1.2 1.2L11.5 7.5M13.5 8.5H16M8 14l1.2 1.2 2.3-2.2M13.5 14H16" />
    </>
  ),
  // A seal with ribbons: the apostille or legalization.
  apostille: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <circle cx="12" cy="9" r="2" />
      <path d="m8.6 13.3-1.6 7.2 5-2.6 5 2.6-1.6-7.2" />
    </>
  ),
  // A paper plane: sending it to Israel.
  send: <path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z" />,
  // A letter becoming another: the translation.
  translation: (
    <>
      <path d="M3.5 5.5h8M7.5 3.5v2M5 5.5c.9 3 2.9 5.4 5.8 6.6M10 5.5c-.9 3.6-3.1 6.2-6.5 7.5" />
      <path d="m12.5 20.5 4.25-9.5 4.25 9.5M14 17h5.5" />
    </>
  ),
  // A pen: signing it.
  sign: <path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L15.5 4.5Z" />,
  // A path that forks: the alternative.
  alternative: (
    <>
      <path d="M6 3.5V10a5 5 0 0 0 5 5h7.5" />
      <path d="M6 10v10.5" />
      <path d="m15.5 12 3 3-3 3" />
    </>
  ),
  // A sheet of paper, for a closed document.
  document: (
    <>
      <path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5L14 3Z" />
      <path d="M14 3v4.5h4.5M9 12.5h6M9 16h4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type StepGlyphName = keyof typeof glyphs;

export function isStepGlyphName(value: string): value is StepGlyphName {
  return value in glyphs;
}

/** Glyphs that point along the reading direction, mirrored in right-to-left. */
const directional: ReadonlySet<StepGlyphName> = new Set(["alternative"]);

export function StepGlyph({ name, className = "size-[18px]" }: { name: StepGlyphName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${directional.has(name) ? "rtl:-scale-x-100" : ""} ${className}`}
    >
      {glyphs[name]}
    </svg>
  );
}
