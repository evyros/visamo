"use client";

import { useEffect, useRef } from "react";
import { FullStory as FS, init, isInitialized } from "@fullstory/browser";

// FullStory session recording, on the website and the app (not the admin
// panel). It never runs under `next dev`, and only runs where
// NEXT_PUBLIC_FULLSTORY_ORG_ID is set. Its cookie covers every subdomain, so a
// visit that moves from visamo.co.il to app.visamo.co.il stays one session.
//
// The app passes the signed-in user, and FullStory files the session under
// their account with their email and name. The website is static and passes
// no one; the shared cookie still ties its pages to the account once the
// visitor has signed in to the app.

const ORG_ID = process.env.NEXT_PUBLIC_FULLSTORY_ORG_ID ?? "";
const ENABLED = process.env.NODE_ENV === "production" && ORG_ID !== "";

export type FullStoryUser = { id: string; email: string; name: string };

export function FullStory({ user }: { user?: FullStoryUser | null }) {
  const identified = useRef(false);

  useEffect(() => {
    if (ENABLED && !isInitialized()) init({ orgId: ORG_ID });
  }, []);

  const id = user?.id;
  const email = user?.email;
  const name = user?.name;
  useEffect(() => {
    if (!ENABLED) return;
    if (id) {
      FS("setIdentity", { uid: id, properties: { email, displayName: name || email } });
      identified.current = true;
    } else if (identified.current) {
      // Signed out: the rest of the visit is no longer theirs.
      FS("setIdentity", { anonymous: true });
      identified.current = false;
    }
  }, [id, email, name]);

  return null;
}
