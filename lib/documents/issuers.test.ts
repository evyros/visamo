import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import en from "../../i18n/messages/en.json";
import he from "../../i18n/messages/he.json";
import { APOSTILLE } from "./countries";
import { ISSUERS, issuedDocuments } from "./issuers";

const guide = (id: string) =>
  readFileSync(fileURLToPath(new URL(`../knowledge/documents/${id}.md`, import.meta.url)), "utf8");

type Texts = { office?: string; details?: string; apostilleBy?: string; apostilleDetails?: string };
const textsOf = (messages: typeof en, id: string) =>
  (messages.app.documentsPage.issuers as Record<string, Record<string, Texts>>)[id];

describe("the countries' issuers", () => {
  for (const id of issuedDocuments) {
    const entries = Object.entries(ISSUERS[id]);

    it(`${id}: restates a section of the document's guide for each country`, () => {
      const headings = [...guide(id).matchAll(/^### (.+)$/gm)].map((m) => m[1]);
      for (const [country, entry] of entries) expect(headings, country).toContain(entry!.heading);
    });

    for (const [locale, messages] of [
      ["en", en],
      ["he", he],
    ] as const) {
      it(`${locale}: ${id} has texts for each country, and for no other`, () => {
        const texts = textsOf(messages, id);
        expect(Object.keys(texts).sort()).toEqual(entries.map(([country]) => country).sort());
        for (const [country, entry] of entries) {
          const t = texts[country];
          expect(t.details, country).toBeTruthy();
          // An affidavit in place of the document has no office (a document may lack one too: the
          // guide doesn't always say, and the line then names the country).
          if (entry!.kind === "affidavit") expect(t.office, country).toBeUndefined();
          // Only a country in the Apostille Convention has an apostille authority.
          if (t.apostilleBy || t.apostilleDetails) expect(APOSTILLE.has(country), country).toBe(true);
        }
      });
    }

    it(`${id}: has the same texts in both languages`, () => {
      for (const [country] of entries) {
        expect(Object.keys(textsOf(he, id)[country]).sort(), country).toEqual(Object.keys(textsOf(en, id)[country]).sort());
      }
    });
  }
});
