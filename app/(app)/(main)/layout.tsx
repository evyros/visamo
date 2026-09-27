import type { ReactNode } from "react";
import { requireCase } from "@/lib/session";
import { AppHeader } from "@/components/app/app-header";

// Every page in here needs a signed-in user who has finished sign-up and
// onboarding (so has a case).
export default async function MainLayout({ children }: { children: ReactNode }) {
  await requireCase();

  return (
    <>
      <AppHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
    </>
  );
}
