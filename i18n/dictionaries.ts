import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import type en from "./messages/en.json";
import { isLocale, type Locale } from "./config";

// English is the source of truth for keys. Every other locale is checked
// against this type at build time, so a missing key fails `next build`.
export type Messages = typeof en;

const dictionaries: Record<Locale, () => Promise<Messages>> = {
  en: () => import("./messages/en.json").then((m) => m.default),
  he: () => import("./messages/he.json").then((m) => m.default satisfies Messages),
};

/** The current locale, read from the root `[lang]` segment. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!isLocale(locale)) notFound();
  return locale;
}

export async function getDictionary(): Promise<Messages> {
  return dictionaries[await getLocale()]();
}

/** Replaces `{name}` placeholders in a message. */
export function format(message: string, values: Record<string, string | number>) {
  return message.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
