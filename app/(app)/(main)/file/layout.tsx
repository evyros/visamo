import type { ReactNode } from "react";
import { getAppDictionary } from "@/i18n/app-locale";
import { SectionShell } from "@/components/app/section-shell";

export default async function FileLayout({ children }: { children: ReactNode }) {
  const t = await getAppDictionary();
  return (
    <SectionShell
      pages={{
        label: t.app.file.nav,
        items: [
          { href: "/file", label: t.app.file.overview, icon: "compass" },
          { href: "/file/documents", label: t.app.file.documents, icon: "file" },
        ],
      }}
    >
      {children}
    </SectionShell>
  );
}
