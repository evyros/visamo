import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { SHARED_CHAT_HEADER } from "@/lib/app-paths";
import { findSharedChat } from "@/lib/chat/shares";
import { getSession } from "@/lib/session";
import { LOCALE_COOKIE, defaultLocale, type Locale } from "./config";
import { asLiveLocale, matchAcceptLanguage } from "./negotiate";
import { loadMessages } from "./messages";

// The app has no language in its URLs. Precedence: this device's cookie (set
// by ?lang= from the website or by the language switch), then the language
// saved on the user, then Accept-Language, then English. A shared chat's page
// (app/(app)/shared/[token]) is in the language it was shared in, whatever
// the visitor's: proxy.ts says which link it is.
export const getAppLocale = cache(async (): Promise<Locale> => {
  const sharedToken = (await headers()).get(SHARED_CHAT_HEADER);
  const shared = sharedToken ? await findSharedChat(sharedToken) : null;
  const sharedIn = asLiveLocale(shared?.locale);
  if (sharedIn) return sharedIn;
  const saved = asLiveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  if (saved) return saved;
  const session = await getSession();
  return (
    asLiveLocale(session?.user.locale) ??
    matchAcceptLanguage((await headers()).get("accept-language")) ??
    defaultLocale
  );
});

export async function getAppDictionary() {
  return loadMessages(await getAppLocale());
}
