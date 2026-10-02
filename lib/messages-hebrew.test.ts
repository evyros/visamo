import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import he from "@/i18n/messages/he.json";

// The messages conventions for documents (i18n/CLAUDE.md): a full title, and
// a short one for the documents page that never says whose it is.

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("the documents' messages", () => {
  for (const [locale, messages] of [
    ["en", en],
    ["he", he],
  ] as const) {
    it(`${locale}: give every document a short title, with the full title's placeholders`, () => {
      for (const [id, item] of Object.entries(messages.app.documents.items)) {
        expect(item.shortTitle, id).not.toBe("");
        expect(placeholders(item.shortTitle), id).toEqual(placeholders(item.title));
      }
    });
  }

  it("never say whose a document is in its short title: the page groups them by person", () => {
    for (const [id, item] of Object.entries(en.app.documents.items)) {
      expect(item.shortTitle, id).not.toMatch(/\bpartners?\b/i);
    }
    for (const [id, item] of Object.entries(he.app.documents.items)) {
      expect(item.shortTitle, id).not.toMatch(/בן\/בת|בן הזוג|בת הזוג|בני הזוג/);
    }
  });

  it("write what a document has to show impersonally, without gendered slashes in Hebrew", () => {
    for (const [point, text] of Object.entries(he.app.documents.points)) {
      expect(text, point).not.toMatch(/[א-ת]\/[א-ת]/);
    }
  });
});
