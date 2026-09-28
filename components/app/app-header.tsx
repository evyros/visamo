import Link from "next/link";
import { getAppDictionary } from "@/i18n/app-locale";
import type { Messages } from "@/i18n/messages";
import { requireUser } from "@/lib/session";
import { Logo } from "@/components/logo";
import { AccountMenu } from "./account-menu";
import { AppLanguageSwitch } from "./app-language-switch";
import { SectionTabs, type NavItem } from "./app-nav";

/** The sections people work in: tabs in the top bar, a bottom tab bar on phones. */
export function mainSections(t: Messages): NavItem[] {
  return [
    { href: "/file", label: t.app.shell.file, icon: "folder" },
    { href: "/chat", label: t.app.shell.chat, icon: "chat" },
  ];
}

/**
 * The full-width top bar for signed-in app pages. Onboarding passes
 * `sections={false}`: before there's a file, there's nothing to navigate to.
 */
export async function AppHeader({ sections = true }: { sections?: boolean }) {
  const user = await requireUser();
  const t = await getAppDictionary();
  const menuLinks: NavItem[] = sections
    ? [
        { href: "/settings", label: t.app.shell.settings, icon: "gear" },
        { href: "/support", label: t.app.shell.support, icon: "help" },
      ]
    : [];

  return (
    <header className="shrink-0 border-b border-line-200 bg-white">
      <div className="flex h-16 items-center gap-6 px-4 sm:px-6 lg:gap-0 lg:ps-0">
        {/* From `lg` up the logo spans the sidebar's width (w-64 in
            section-shell.tsx), so the tabs start where the sidebar ends. */}
        <Link href="/" className="flex shrink-0 items-center self-stretch lg:w-64 lg:ps-7" aria-label="Visamo">
          <Logo />
        </Link>
        {sections && <SectionTabs items={mainSections(t)} label={t.app.shell.sections} />}
        <div className="ms-auto flex items-center gap-3">
          <div className="hidden sm:block">
            <AppLanguageSwitch variant="menu" />
          </div>
          <AccountMenu
            name={user.name}
            email={user.email}
            links={menuLinks}
            languageSwitch={<AppLanguageSwitch />}
            labels={{ menu: t.app.shell.accountMenu, signOut: t.app.shell.signOut }}
          />
        </div>
      </div>
    </header>
  );
}
