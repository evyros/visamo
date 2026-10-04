import type { ReactNode } from "react";

// Placeholders the section pages show while they render (their loading.tsx):
// the page's width and cards in gray, with no text, so they need no data and
// Next.js can prefetch them. The sidebar and top bar stay as they are.

/** A gray bar standing in for a line of text, a number or a button. */
export function Bone({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-line-200/70 ${className}`} />;
}

/** The page: same widths and padding as the real ones, with a title bar. */
export function SkeletonPage({
  width,
  back = false,
  intro = false,
  children,
}: {
  /** The real page's max width. */
  width: "720" | "840" | "960";
  /** A "back to the file" link above the title (activity, details). */
  back?: boolean;
  /** An intro line under the title. */
  intro?: boolean;
  children: ReactNode;
}) {
  const max = { "720": "max-w-[720px]", "840": "max-w-[840px]", "960": "max-w-[960px]" }[width];
  return (
    <div aria-busy="true" className={`mx-auto w-full ${max} px-4 py-8 motion-safe:animate-pulse sm:px-6 lg:px-8 lg:py-10`}>
      {back && <Bone className="mb-4 h-5 w-28" />}
      <Bone className="h-8 w-48 sm:h-9" />
      {intro && <Bone className="mt-4 h-5 w-full max-w-md" />}
      {children}
    </div>
  );
}

/** A card with a title bar and some lines. */
export function SkeletonCard({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`rounded-card border border-line-200 bg-white p-5 sm:p-6 ${className}`}>
      <Bone className="h-6 w-40" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <Bone key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

/** Settings pages: a column of cards. */
export function SettingsSkeleton({ cards }: { cards: number[] }) {
  return (
    <SkeletonPage width="720" intro>
      <div className="mt-8 space-y-6">
        {cards.map((lines, i) => (
          <SkeletonCard key={i} lines={lines} />
        ))}
      </div>
    </SkeletonPage>
  );
}
