import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/lib/fonts";
import { site } from "@/lib/site";
import "../globals.css";

// Root layout for the admin panel (admin.visamo.co.il, see proxy.ts). English
// only, and nothing here is indexed.

export const metadata: Metadata = {
  metadataBase: new URL(site.adminUrl),
  title: { default: "Visamo admin", template: "%s | Visamo admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-script="latin" className={fontVariables}>
      <body className="flex min-h-screen flex-col bg-sand-50 text-[17px] leading-relaxed">{children}</body>
    </html>
  );
}
