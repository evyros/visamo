import type en from "./messages/en.json";
import type { Locale } from "./config";

// English is the source of truth for keys. Every other locale is checked
// against this type at build time, so a missing key fails `next build`.
export type Messages = typeof en;

const dictionaries: Record<Locale, () => Promise<Messages>> = {
  en: () => import("./messages/en.json").then((m) => m.default),
  he: () => import("./messages/he.json").then((m) => m.default satisfies Messages),
};

/**
 * Messages for an explicit locale. The website reads its locale from the URL
 * (i18n/dictionaries.ts); the app and emails pass theirs in.
 */
export function loadMessages(locale: Locale): Promise<Messages> {
  return dictionaries[locale]();
}

/** Replaces `{name}` placeholders in a message. */
export function format(message: string, values: Record<string, string | number>) {
  return message.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
