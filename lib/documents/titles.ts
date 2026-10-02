import type { Locale } from "@/i18n/config";
import { regionName } from "@/i18n/format";
import { format, type Messages } from "@/i18n/messages";
import { DOCUMENT_ALIASES, documents, type Owner } from "./catalog";

// A document's title from its list key alone, for keys saved elsewhere: on a
// file whose document left the list, or in an event.

type Texts = Messages["app"]["documents"];

/** The partners' names, to say whose a document is with its short title. */
export type PartnerNames = { israeli: string; foreign: string };

/**
 * The title for a key (`id` or `id:country`), following renames; null for an
 * id the catalog no longer has. The full title, or, with the partners' names,
 * the short title, with the partner's name for one partner's own document:
 * "Salary slips (John)" (see i18n/CLAUDE.md).
 */
export function documentTitle(key: string, texts: Texts, locale: Locale, names?: PartnerNames): string | null {
  const [saved, country] = key.split(":");
  const id = DOCUMENT_ALIASES[saved] ?? saved;
  const text = (texts.items as Record<string, { title: string; shortTitle: string } | undefined>)[id];
  if (!text) return null;
  const where = { country: country ? regionName(country, locale) : "" };
  if (!names) return format(text.title, where);
  const short = format(text.shortTitle, where);
  const owner = documentOwner(key);
  return owner === "israeli" || owner === "foreign" ? format(texts.whose, { document: short, name: names[owner] }) : short;
}

/** Whose the document for a key is, following renames; null for an id the catalog no longer has. */
export function documentOwner(key: string): Owner | null {
  const [saved] = key.split(":");
  const id = DOCUMENT_ALIASES[saved] ?? saved;
  return documents.find((d) => d.id === id)?.owner ?? null;
}
