import type { ReactNode } from "react";
import { getAppDictionary } from "@/i18n/app-locale";
import { SidebarNav } from "@/components/app/app-nav";
import { SectionShell } from "@/components/app/section-shell";

export default async function FileLayout({ children }: { children: ReactNode }) {
  const t = await getAppDictionary();
  return (
    <SectionShell
      title={t.app.file.nav}
      labels={{ open: t.app.shell.sectionMenu, close: t.app.shell.closeSectionMenu }}
      sidebar={
        <SidebarNav
          label={t.app.file.nav}
          items={[
            { href: "/file", label: t.app.file.overview, icon: "compass" },
            { href: "/file/documents", label: t.app.file.documents, icon: "file" },
          ]}
        />
      }
    >
      {children}
    </SectionShell>
  );
}
