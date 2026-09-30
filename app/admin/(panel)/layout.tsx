import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin";
import { BottomTabs } from "@/components/app/app-nav";
import { AdminHeader, adminSections } from "@/components/admin/admin-header";

// Every admin page but the login. The shell fills the window like the app's
// (app/(app)/(main)/layout.tsx): the top bar has the main screens, and a
// screen with pages under it brings its own sidebar (see users/[id]).
// Each page checks the session too: a layout doesn't run on every navigation.
export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex h-dvh flex-col">
      <AdminHeader admin={admin} />
      {children}
      <BottomTabs items={adminSections} label="Sections" />
    </div>
  );
}
