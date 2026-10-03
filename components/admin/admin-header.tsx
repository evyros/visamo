import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { SectionTabs, type NavItem } from "@/components/app/app-nav";
import { Logo } from "@/components/logo";

/** The admin panel's main screens: tabs in the top bar, a bottom tab bar on phones. */
export const adminSections: NavItem[] = [
  { href: "/users", label: "Users", icon: "people" },
  { href: "/dismissals", label: "Dismissed", icon: "alertCircle" },
];

/** The admin panel's top bar, laid out like the app's (components/app/app-header.tsx). */
export function AdminHeader({ admin }: { admin: string }) {
  return (
    <header className="shrink-0 border-b border-line-200 bg-white">
      <div className="flex h-16 items-center gap-6 px-4 sm:px-6 lg:gap-0 lg:ps-0">
        {/* From `lg` up the logo spans the sidebar's width (w-64 in
            section-shell.tsx), so the tabs start where the sidebar ends. */}
        <Link href="/" className="flex shrink-0 items-center gap-2 self-stretch lg:w-64 lg:ps-7" aria-label="Visamo admin">
          <Logo />
          <span className="rounded-md bg-navy-900 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
            Admin
          </span>
        </Link>
        <SectionTabs items={adminSections} label="Sections" />
        <form action={signOut} className="ms-auto flex items-center gap-4 text-sm text-slate-500">
          <span className="hidden sm:inline">{admin}</span>
          <button type="submit" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
