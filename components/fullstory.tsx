"use client";

import { useEffect } from "react";
import { init, isInitialized } from "@fullstory/browser";

// FullStory session recording, on the website and the app (not the admin
// panel). It never runs under `next dev`, and only runs where
// NEXT_PUBLIC_FULLSTORY_ORG_ID is set. Its cookie covers every subdomain, so a
// visit that moves from visamo.co.il to app.visamo.co.il stays one session.

const ORG_ID = process.env.NEXT_PUBLIC_FULLSTORY_ORG_ID ?? "";
const ENABLED = process.env.NODE_ENV === "production" && ORG_ID !== "";

export function FullStory() {
  useEffect(() => {
    if (ENABLED && !isInitialized()) init({ orgId: ORG_ID });
  }, []);

  return null;
}
