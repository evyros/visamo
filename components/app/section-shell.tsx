"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { SectionPills, SidebarNav, type NavItem } from "./app-nav";

// A section's sidebar and its page. The sidebar sits on the start edge from
// `lg` up. Below that, a section that's just pages (`pages`) shows them as
// pills above the page; any other sidebar (`sidebar`) becomes a drawer, opened
// from a bar above the page. The page scrolls on its own, so the sidebar and
// top bar stay put.
export function SectionShell({
  pages,
  sidebar: drawerSidebar,
  title,
  labels,
  children,
}: {
  /** The section's pages: a sidebar from `lg` up, pills below. */
  pages?: { label: string; items: NavItem[] };
  /** Anything else in the sidebar: a drawer below `lg`. */
  sidebar?: ReactNode;
  /** With `sidebar`: shown in the bar that opens the drawer. */
  title?: string;
  /** With `sidebar`: the drawer buttons' names. */
  labels?: { open: string; close: string };
  children: ReactNode;
}) {
  const sidebar = pages ? <SidebarNav label={pages.label} items={pages.items} /> : drawerSidebar;
  const drawer = !pages && drawerSidebar != null;
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  // Close the drawer after navigating from it.
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
    const page = document.getElementById("main");
    if (page) page.inert = true;
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    // Past `lg` the sidebar is no longer a drawer.
    const wide = window.matchMedia("(min-width: 64rem)");
    const onResize = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onResize);
    return () => {
      if (page) page.inert = false;
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <div className="flex min-h-0 flex-1">
      {pages && (
        // w-64 matches the logo area in app-header.tsx.
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-e border-line-200 bg-white p-4 lg:flex">
          {sidebar}
        </aside>
      )}
      {drawer && (
        <>
          {open && <div className="fixed inset-0 z-40 bg-navy-900/30 lg:hidden" onClick={close} />}
          {/* w-64 matches the logo area in app-header.tsx. */}
          <aside
            ref={drawerRef}
            id="section-sidebar"
            className={`flex w-64 shrink-0 flex-col overflow-y-auto border-e border-line-200 bg-white p-4 max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:z-50 max-lg:w-72 max-lg:max-w-[85vw] max-lg:shadow-soft max-lg:transition-[translate,visibility] ${
              open ? "" : "max-lg:invisible max-lg:-translate-x-full max-lg:rtl:translate-x-full"
            }`}
          >
            <div className="mb-2 flex justify-end lg:hidden">
              <button
                type="button"
                aria-label={labels?.close}
                onClick={close}
                className="inline-flex size-10 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5"
              >
                <Icon name="x" className="size-6" />
              </button>
            </div>
            {sidebar}
          </aside>
        </>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {pages && <SectionPills label={pages.label} items={pages.items} />}
        {drawer && (
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line-200 bg-white px-2 lg:hidden">
            <button
              ref={toggleRef}
              type="button"
              aria-label={labels?.open}
              aria-expanded={open}
              aria-controls="section-sidebar"
              onClick={() => setOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5"
            >
              <Icon name="menu" className="size-6" />
            </button>
            <span className="font-semibold text-navy-900">{title}</span>
          </div>
        )}
        {/* relative: absolutely positioned content (like sr-only inputs) stays
            inside this scrolling area instead of stretching the window. */}
        <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
