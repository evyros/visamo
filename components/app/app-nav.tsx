"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

export type NavItem = { href: string; label: string; icon: IconName };

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
            className={`inline-flex items-center gap-2 border-b-2 px-3 pt-0.5 text-[15px] font-semibold transition-colors ${
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
            className={`flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold ${
              active ? "text-teal-700" : "text-slate-500"
            }`}
          >
            <Icon name={item.icon} className="size-6" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** A section's pages, in its sidebar. */
export function SidebarNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
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
