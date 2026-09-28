import type { ReactNode } from "react";
import { getAppDictionary } from "@/i18n/app-locale";
import { requireCase } from "@/lib/session";
import { AppHeader, mainSections } from "@/components/app/app-header";
import { BottomTabs } from "@/components/app/app-nav";

// Every page in here needs a signed-in user who has finished sign-up and
// onboarding (so has a case). The shell fills the window: the top bar and the
// phone tab bar stay put, and each section's layout (file/, chat/, settings/,
// support/) brings its own sidebar and scrolling page.
export default async function MainLayout({ children }: { children: ReactNode }) {
  await requireCase();
  const t = await getAppDictionary();

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      {children}
      <BottomTabs items={mainSections(t)} label={t.app.shell.sections} />
    </div>
  );
}
