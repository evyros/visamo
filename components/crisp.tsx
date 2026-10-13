"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { locales, type Locale } from "@/i18n/config";

// Crisp live chat, on a few website pages only (not the app or the admin
// panel). It runs only where NEXT_PUBLIC_CRISP_WEBSITE_ID is set. The script
// loads the first time a visitor opens one of PAGES; after that the chat box
// is shown on those pages and hidden on the rest as they move around the site.
// It speaks the page's language, and in a right-to-left language it sits on
// the left so it mirrors the layout.

const WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ?? "";

/** Paths after the language segment: "" is the home page. */
const PAGES = new Set(["", "/pricing", "/about", "/how-we-built", "/contact"]);

declare global {
  interface Window {
    $crisp?: unknown[][];
    CRISP_WEBSITE_ID?: string;
    CRISP_RUNTIME_CONFIG?: { locale: string };
  }
}

export function Crisp({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!WEBSITE_ID) return;
    const page = pathname.replace(/^\/[^/]+/, "").replace(/\/$/, "");
    const shown = PAGES.has(page);

    if (!window.$crisp) {
      if (!shown) return;
      window.$crisp = [];
      window.CRISP_WEBSITE_ID = WEBSITE_ID;
      window.CRISP_RUNTIME_CONFIG = { locale };
      if (locales[locale].dir === "rtl") window.$crisp.push(["config", "position:reverse", true]);
      const script = document.createElement("script");
      script.src = "https://client.crisp.chat/l.js";
      script.async = true;
      document.head.appendChild(script);
      return;
    }

    window.$crisp.push(["do", shown ? "chat:show" : "chat:hide"]);
  }, [pathname, locale]);

  return null;
}
