"use server";

import { recordLetterEvent, visitFrom } from "@/lib/letters/events";
import { findLetterRequest } from "@/lib/letters/requests";

// The friend's page reports that it was opened, for the stats
// (components/letters/letter-writer.tsx), once per friend's browser.
// Downloads and sends are recorded by their own routes.

export async function trackLetterOpened(id: string, visitor: string, via: string) {
  const visit = visitFrom(visitor, via);
  if (!visit || !(await findLetterRequest(id))) return;
  await recordLetterEvent(id, { type: "page.opened", data: {} }, visit);
}
