import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";
import { loadMessages, type Messages } from "./messages";

export { format, type Messages } from "./messages";

/** The current locale, read from the root `[lang]` segment. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!isLocale(locale)) notFound();
  return locale;
}

export async function getDictionary(): Promise<Messages> {
  return loadMessages(await getLocale());
}
