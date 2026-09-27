// Wordmark placeholder until the brand logo exists. It never mirrors in RTL.
export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const text = tone === "dark" ? "text-navy-900" : "text-white";
  return (
    <span dir="ltr" className={`inline-flex items-center gap-2 ${text}`}>
      <LogoMark className="size-8" />
      {/* The wordmark keeps one typeface in every language. */}
      <span className="font-[family-name:var(--font-source-serif)] text-[22px] leading-none font-semibold tracking-tight">
        Visamo
      </span>
    </span>
  );
}

/** The "V" mark on its own, e.g. as the assistant's avatar. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-teal-600" />
      <path
        d="M9 10.5 16 22l7-11.5"
        fill="none"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
