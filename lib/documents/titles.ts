import type { Locale } from "@/i18n/config";
import { regionName } from "@/i18n/format";
import { format, type Messages } from "@/i18n/messages";
import { DOCUMENT_ALIASES } from "./catalog";

// A document's title from its list key alone, for keys saved elsewhere: on a
// file whose document left the list, or in an event.

type Items = Messages["app"]["documents"]["items"];

/** The title for a key (`id` or `id:country`), following renames; null for an id the catalog no longer has. */
export function documentTitle(key: string, items: Items, locale: Locale): string | null {
  const [saved, country] = key.split(":");
  const id = DOCUMENT_ALIASES[saved] ?? saved;
  const text = (items as Record<string, { title: string } | undefined>)[id];
  if (!text) return null;
  return format(text.title, { country: country ? regionName(country, locale) : "" });
}
