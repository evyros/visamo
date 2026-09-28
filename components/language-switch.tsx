"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

type Option = { code: string; nativeName: string; shortName: string; dir: "ltr" | "rtl" };

const ONE_YEAR = 60 * 60 * 24 * 365;

function goToLocale(cookieName: string, url: string, code: string) {
  document.cookie = `${cookieName}=${code}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  // A full load: the root layout (lang, dir, fonts) changes, and a client-side
  // push would restore a scroll position from the other language's page.
  window.location.assign(url);
}

// Built from the locale registry: a segmented pill for two languages, a globe
// dropdown for three or more. `variant="menu"` always uses the dropdown, with
// the short name on the button (the app's top bar). Each language is shown in
// its own name.
// On the website the language is the first URL segment. The app has no
// language in its URLs, so it passes `saveLocale` and the page reloads in place.
export function LanguageSwitch({
  current,
  options,
  label,
  cookieName,
  saveLocale,
  variant = "auto",
}: {
  current: string;
  options: Option[];
  label: string;
  cookieName: string;
  saveLocale?: (code: string) => Promise<void>;
  variant?: "auto" | "menu";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuRef.current?.querySelector("button")?.focus();
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function switchTo(code: string) {
    setOpen(false);
    if (code === current) return;
    if (saveLocale) {
      await saveLocale(code);
      window.location.reload();
      return;
    }
    const segments = pathname.split("/");
    segments[1] = code;
    // Same page, from the top. A #section left in the URL by an earlier click
    // is dropped on purpose, so the switch never jumps into the page.
    goToLocale(cookieName, segments.join("/") + window.location.search, code);
  }

  if (variant === "auto" && options.length <= 2) {
    return (
      <div
        role="group"
        aria-label={label}
        className="inline-flex rounded-full border border-line-200 bg-white p-0.5 text-sm"
      >
        {options.map((option) => {
          const active = option.code === current;
          return (
            <button
              key={option.code}
              type="button"
              lang={option.code}
              dir={option.dir}
              aria-pressed={active}
              onClick={() => switchTo(option.code)}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                active ? "bg-navy-900 text-white" : "text-slate-700 hover:text-navy-900"
              }`}
            >
              {option.nativeName}
            </button>
          );
        })}
      </div>
    );
  }

  const active = options.find((o) => o.code === current);
  const compact = variant === "menu";
  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label={`${label}: ${active?.nativeName}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-full text-sm font-medium text-navy-900 ${
          compact ? "h-10 px-2.5 hover:bg-navy-900/5" : "h-9 border border-line-200 bg-white px-3"
        }`}
      >
        <Icon name="globe" className="size-5" />
        <span lang={active?.code}>{compact ? active?.shortName : active?.nativeName}</span>
        {compact && <Icon name="chevronDown" className="size-4" />}
      </button>
      {open && (
        <ul className="absolute end-0 top-11 z-50 min-w-40 rounded-xl border border-line-200 bg-white p-1 shadow-soft">
          {options.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                lang={option.code}
                dir={option.dir}
                aria-current={option.code === current ? "true" : undefined}
                onClick={() => switchTo(option.code)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm hover:bg-sand-50"
              >
                {option.nativeName}
                {option.code === current && <Icon name="check" className="size-4 text-teal-700" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
