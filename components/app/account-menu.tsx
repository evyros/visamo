"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import type { NavItem } from "./app-nav";
import { SignOutButton } from "./sign-out-button";

const itemStyles =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-[15px] font-medium text-navy-900 hover:bg-sand-50";

// The avatar at the end of the top bar. It holds the pages people rarely
// visit (settings, support), the language switch on small screens, and log out.
export function AccountMenu({
  name,
  email,
  links,
  languageSwitch,
  labels,
}: {
  name: string;
  email: string;
  links: NavItem[];
  languageSwitch: ReactNode;
  labels: { menu: string; signOut: string };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={toggleRef}
        type="button"
        aria-label={labels.menu}
        aria-expanded={open}
        aria-controls="account-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-full bg-navy-900 text-white hover:bg-navy-800"
      >
        <Icon name="user" className="size-5" />
      </button>
      {open && (
        <div
          id="account-menu"
          className="absolute end-0 top-12 z-50 w-72 rounded-xl border border-line-200 bg-white p-2 shadow-soft"
        >
          <div className="border-b border-line-200 px-3 pt-1 pb-3">
            {name && <p className="truncate font-semibold text-navy-900">{name}</p>}
            <p dir="ltr" className="truncate text-start text-sm text-slate-500">
              {email}
            </p>
          </div>
          {links.length > 0 && (
            <ul className="border-b border-line-200 py-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={itemStyles}>
                    <Icon name={link.icon} className="size-5 text-slate-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {/* The top bar shows the language switch from `sm` up. */}
          <div className="border-b border-line-200 px-3 py-3 sm:hidden">{languageSwitch}</div>
          <div className="pt-2">
            <SignOutButton className={itemStyles}>
              <Icon name="logout" className="size-5 text-slate-500" />
              {labels.signOut}
            </SignOutButton>
          </div>
        </div>
      )}
    </div>
  );
}
