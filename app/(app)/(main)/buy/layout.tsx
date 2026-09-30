import type { ReactNode } from "react";
import { getAppDictionary } from "@/i18n/app-locale";
import { SectionShell } from "@/components/app/section-shell";

// Buying is a single page, so it has no sidebar.
export default async function BuyLayout({ children }: { children: ReactNode }) {
  const t = await getAppDictionary();
  return (
    <SectionShell
      title={t.app.buy.title}
      labels={{ open: t.app.shell.sectionMenu, close: t.app.shell.closeSectionMenu }}
    >
      {children}
    </SectionShell>
  );
}
