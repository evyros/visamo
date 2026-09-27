"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";

type NavLink = { href: string; label: string };

export function MobileNav({
  links,
  cta,
  login,
  whatsapp,
  labels,
  languageSwitch,
}: {
  links: NavLink[];
  cta: NavLink;
  login: NavLink;
  whatsapp: NavLink;
  labels: { open: string; close: string; nav: string };
  languageSwitch: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close the drawer after navigation (e.g. a language switch).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    // The drawer is portaled to the end of <body>. Making the page behind it
    // inert keeps keyboard and screen-reader users inside the open menu.
    const behind = document.querySelectorAll<HTMLElement>("#main, body > footer");
    behind.forEach((el) => (el.inert = true));
    navRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      behind.forEach((el) => (el.inert = false));
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? labels.close : labels.open}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-10 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5"
      >
        <Icon name={open ? "x" : "menu"} className="size-6" />
      </button>

      {/* Portaled: the header's backdrop-filter would otherwise trap `fixed`. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 top-[60px] z-40 bg-navy-900/30" onClick={close}>
            <nav
              ref={navRef}
              id="mobile-nav"
              aria-label={labels.nav}
              onClick={(e) => e.stopPropagation()}
              className="ms-auto flex h-full w-full max-w-sm flex-col gap-2 overflow-y-auto bg-white p-6 shadow-soft"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-lg font-medium text-navy-900 hover:bg-sand-50"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 px-3">{languageSwitch}</div>
              <Link
                href={cta.href}
                className="mt-2 inline-flex h-12 items-center justify-center rounded-[10px] bg-teal-600 font-semibold text-white"
              >
                {cta.label}
              </Link>
              <Link
                href={login.href}
                className="inline-flex h-12 items-center justify-center rounded-[10px] font-semibold text-navy-900"
              >
                {login.label}
              </Link>
              <a
                href={whatsapp.href}
                className="mt-auto inline-flex items-center gap-2 px-3 py-3 text-sm font-medium text-whatsapp"
              >
                <Icon name="whatsapp" className="size-5" />
                {whatsapp.label}
              </a>
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
