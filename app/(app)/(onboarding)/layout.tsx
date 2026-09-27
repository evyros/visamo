import type { ReactNode } from "react";
import { AppHeader } from "@/components/app/app-header";

// Onboarding: signed in, but no case yet. The page checks both.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col items-center px-4 py-8 focus:outline-none sm:py-12">
        <div className="w-full max-w-[560px] rounded-2xl border border-line-200 bg-white p-6 shadow-soft sm:p-10">
          {children}
        </div>
      </main>
    </>
  );
}
