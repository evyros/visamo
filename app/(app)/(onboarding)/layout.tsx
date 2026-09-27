import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";

// Onboarding: signed in, but no case yet. The page checks both.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col items-center px-4 py-8 focus:outline-none sm:py-12">
        <div className="w-full max-w-[560px]">{children}</div>
      </main>
    </>
  );
}
