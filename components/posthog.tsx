"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import type { FullStoryUser } from "@/components/fullstory";

// PostHog analytics and session recording, running next to FullStory
// (components/fullstory.tsx) while we compare the two. Same rules: the website
// and the app, not the admin panel; never under `next dev`; only where
// NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is set. Its cookie covers every subdomain,
// so a visit from visamo.co.il into app.visamo.co.il stays one session.
//
// Requests go to /ingest on our own host, and next.config.ts forwards them to
// PostHog, so ad blockers drop fewer of them than FullStory's. Keep that in
// mind when comparing session counts between the two.
//
// The app passes the signed-in user, and PostHog files the session under their
// account with their email and name.
//
// It never records a recommendation letter page (app/[lang]/letter/[token]),
// for the same reason as FullStory: recording stops there, no event from the
// page is sent, and recording starts again after.

const TOKEN = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ?? "";
const ENABLED = process.env.NODE_ENV === "production" && TOKEN !== "";

/** Website pages PostHog must not see, after the language segment. */
const privatePage = (pathname: string) => /^\/[^/]+\/letter\//.test(pathname);

const SECRET_AUTOCOMPLETE = new Set(["current-password", "new-password", "one-time-code"]);

// Recordings show what people type, except in sensitive fields: passwords
// (also while "show password" makes them plain text), login codes, email
// addresses, phone numbers, hidden fields, and anything inside the `ph-mask`
// class, like ID numbers and links that carry a token. A new field with
// sensitive data needs one of those types or the class.
function maskInput(text: string, element?: HTMLElement) {
  const sensitive =
    !element ||
    !!element.closest(".ph-mask") ||
    ["password", "email", "tel", "hidden"].includes(element.getAttribute("type") ?? "") ||
    SECRET_AUTOCOMPLETE.has(element.getAttribute("autocomplete") ?? "");
  return sensitive ? "*".repeat(text.length) : text;
}

export function PostHog({ user }: { user?: FullStoryUser | null }) {
  const identified = useRef(false);
  const pathname = usePathname();
  const hidden = privatePage(pathname);

  useEffect(() => {
    if (!ENABLED) return;
    if (!posthog.__loaded) {
      if (hidden) return;
      posthog.init(TOKEN, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2026-08-30",
        person_profiles: "identified_only",
        // Every field goes through maskInput, which decides what to hide.
        session_recording: { maskAllInputs: true, maskInputFn: maskInput },
        // The page view as the visitor arrives on a letter page fires before
        // this component sees the new path, so drop it here too.
        before_send: (event) => (privatePage(window.location.pathname) ? null : event),
      });
      return;
    }
    if (hidden) posthog.stopSessionRecording();
    else posthog.startSessionRecording();
  }, [hidden]);

  const id = user?.id;
  const email = user?.email;
  const name = user?.name;
  useEffect(() => {
    if (!ENABLED || !posthog.__loaded) return;
    if (id) {
      posthog.identify(id, { email, name: name || email });
      identified.current = true;
    } else if (identified.current) {
      // Signed out: the rest of the visit is no longer theirs.
      posthog.reset();
      identified.current = false;
    }
  }, [id, email, name]);

  return null;
}
