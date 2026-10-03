import type { ReactNode } from "react";
import { SectionShell } from "@/components/app/section-shell";

// Buying is a single page, so it has no sidebar.
export default function BuyLayout({ children }: { children: ReactNode }) {
  return <SectionShell>{children}</SectionShell>;
}
