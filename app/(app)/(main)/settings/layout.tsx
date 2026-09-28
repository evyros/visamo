import type { ReactNode } from "react";
import { getAppDictionary } from "@/i18n/app-locale";
import { SidebarNav } from "@/components/app/app-nav";
import { SectionShell } from "@/components/app/section-shell";

// Deleting the account lives at the bottom of Account, not in this menu.
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const t = await getAppDictionary();
  return (
    <SectionShell
      title={t.app.settings.nav}
      labels={{ open: t.app.shell.sectionMenu, close: t.app.shell.closeSectionMenu }}
      sidebar={
        <SidebarNav
          label={t.app.settings.nav}
          items={[
            { href: "/settings", label: t.app.settings.account, icon: "user" },
            { href: "/settings/partner", label: t.app.settings.partner, icon: "people" },
            { href: "/settings/billing", label: t.app.settings.billing, icon: "receipt" },
          ]}
        />
      }
    >
      {children}
    </SectionShell>
  );
}
