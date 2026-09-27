import type { ReactNode } from "react";
import { OnboardingProvider } from "@/components/app/onboarding-state";

// Holds the answers while the steps change the URL (see onboarding-state.tsx).
export default function OnboardingStepsLayout({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}
