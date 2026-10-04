"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { LinkPendingHighlight } from "./link-pending";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** In a sidebar: also active on the pages under it. Tabs always are. */
  includeSubpages?: boolean;
  /** An outside page (the website's contact page): opens in a new tab. */
  newTab?: boolean;
};

/** A section tab is active on its own page and every page under it. */
function inSection(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The main sections, in the top bar from `sm` up. */
export function SectionTabs({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="hidden gap-1 self-stretch sm:flex">
      {items.map((item) => {
        const active = inSection(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 border-b-3 px-3 pt-[3px] text-[15px] font-semibold transition-colors ${
              active ? "border-teal-600 text-navy-900" : "border-transparent text-slate-500 hover:text-navy-900"
            }`}
          >
            <Icon name={item.icon} className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The main sections as a bottom tab bar, below `sm`. */
export function BottomTabs({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className="flex border-t border-line-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      {items.map((item) => {
        const active = inSection(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            // The active tab: a bar on its top edge and a pill behind its icon.
            className={`relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold ${
              active
                ? "text-teal-700 before:absolute before:inset-x-6 before:top-0 before:h-[3px] before:rounded-b-full before:bg-teal-600"
                : "text-slate-500"
            }`}
          >
            <span
              className={`inline-flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                active ? "bg-teal-100" : ""
              }`}
            >
              <Icon name={item.icon} className="size-6" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Whether a section's page is the one showing (see `includeSubpages`). */
function isCurrentPage(pathname: string, item: NavItem) {
  return item.includeSubpages ? inSection(pathname, item.href) : pathname === item.href;
}

/** A section's pages, in its sidebar. */
export function SidebarNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isCurrentPage(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${
                  active ? "bg-teal-100 text-teal-700" : "text-slate-700 hover:bg-sand-50 hover:text-navy-900"
                }`}
              >
                <Icon name={item.icon} className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * A section's pages as a row of pills above the page, below `lg` (where the
 * sidebar takes over). Text only, and it scrolls sideways if the labels don't fit.
 */
export function SectionPills({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={label}
      className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-line-200 bg-white px-3 [scrollbar-width:none] lg:hidden"
    >
      {items.map((item) => {
        const active = isCurrentPage(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-[15px] font-medium whitespace-nowrap transition-colors ${
              active ? "bg-teal-100 text-teal-700" : "text-slate-600 hover:bg-sand-50 hover:text-navy-900"
            }`}
          >
            {item.label}
            <LinkPendingHighlight />
          </Link>
        );
      })}
    </nav>
  );
}
