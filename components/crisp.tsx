"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ComponentProps, type MouseEvent } from "react";
import { locales, type Locale } from "@/i18n/config";
import { newTab } from "@/lib/site";

// Crisp live chat. It runs only where NEXT_PUBLIC_CRISP_WEBSITE_ID is set.
// It speaks the page's language, and in a right-to-left language it sits on
// the left so it mirrors the layout.
//
// On the website (Crisp): on a few pages only. The script loads the first
// time a visitor opens one of PAGES; after that the chat box is shown on
// those pages and hidden on the rest as they move around the site.
//
// In the app (CrispLink): no chat box on the page. A link opens the chat, with
// the signed-in user's details so support knows who's writing, and the box
// goes away again when they close it. The app is on its own subdomain, so its
// conversations are separate from the website's.

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

/** Adds the script, once. Commands pushed before it loads run when it does. */
function loadCrisp(locale: Locale): unknown[][] {
  if (window.$crisp) return window.$crisp;
  const crisp: unknown[][] = [];
  window.$crisp = crisp;
  window.CRISP_WEBSITE_ID = WEBSITE_ID;
  window.CRISP_RUNTIME_CONFIG = { locale };
  if (locales[locale].dir === "rtl") crisp.push(["config", "position:reverse", true]);
  const script = document.createElement("script");
  script.src = "https://client.crisp.chat/l.js";
  script.async = true;
  document.head.appendChild(script);
  return crisp;
}

export function Crisp({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!WEBSITE_ID) return;
    const page = pathname.replace(/^\/[^/]+/, "").replace(/\/$/, "");
    const shown = PAGES.has(page);

    if (!window.$crisp) {
      if (shown) loadCrisp(locale);
      return;
    }

    window.$crisp.push(["do", shown ? "chat:show" : "chat:hide"]);
  }, [pathname, locale]);

  return null;
}

/** Who's writing, as support sees them in Crisp. */
export type CrispUser = { id: string; email: string; name: string; caseId: string };

/**
 * A link to the contact page that opens the Crisp chat instead, with the
 * user's details. Without Crisp (no website id), or without a user (an admin
 * signed in as one), it stays a plain link to the contact page.
 */
export function CrispLink({
  href,
  locale,
  user,
  ...props
}: Omit<ComponentProps<"a">, "href"> & { href: string; locale: Locale; user: CrispUser | null }) {
  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (!WEBSITE_ID || !user) return;
    event.preventDefault();
    const fresh = !window.$crisp;
    const crisp = loadCrisp(locale);
    if (fresh) {
      // The app shows no chat box until it's opened.
      crisp.push(["do", "chat:hide"]);
      crisp.push(["on", "chat:closed", () => window.$crisp?.push(["do", "chat:hide"])]);
    }
    crisp.push(["set", "user:email", [user.email]]);
    crisp.push(["set", "user:nickname", [user.name]]);
    crisp.push(["set", "session:data", [[["user_id", user.id], ["case_id", user.caseId]]]]);
    crisp.push(["do", "chat:show"]);
    crisp.push(["do", "chat:open"]);
  }

  return <a href={href} {...newTab} {...props} onClick={open} />;
}
