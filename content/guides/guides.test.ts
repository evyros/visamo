import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { guideSlugs, guideSources, guideTexts, type GuideBlock, type GuideSlug } from ".";
import { guidesEn } from "./en";
import { guidesHe } from "./he";

// ── The guides' lock ─────────────────────────────────────────────────────────
// A guide restates facts from lib/knowledge, in English and in Hebrew. The
// lock holds a fingerprint of each guide's sources and of both its texts, as
// they were when someone last checked the three agree. A change to any of
// them fails here until the others are checked against it, and
// `npm run guides:lock` records the new state.

const LOCK = fileURLToPath(new URL("./guides.lock.json", import.meta.url));
const KNOWLEDGE = fileURLToPath(new URL("../../lib/knowledge/", import.meta.url));

type Entry = { sources: string; en: string; he: string };

const fingerprint = (value: unknown) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");

const current = Object.fromEntries(
  guideSlugs.map((slug) => [
    slug,
    {
      sources: fingerprint(guideSources[slug].map((file) => readFileSync(KNOWLEDGE + file, "utf8")).join("\n")),
      en: fingerprint(guidesEn.docs[slug]),
      he: fingerprint(guidesHe.docs[slug]),
    },
  ]),
) as Record<GuideSlug, Entry>;

const recorded: Record<GuideSlug, Entry> | null = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : null;

describe("the guides' lock", () => {
  if (process.env.UPDATE_GUIDES_LOCK) {
    it("records the guides in guides.lock.json", () => {
      writeFileSync(LOCK, JSON.stringify(current, null, 2) + "\n");
    });
    return;
  }

  for (const slug of guideSlugs) {
    it(`${slug} matches guides.lock.json`, () => {
      const before = recorded?.[slug];
      expect(before, "No entry in guides.lock.json: run npm run guides:lock").toBeTruthy();
      const now = current[slug];
      const changed = (["sources", "en", "he"] as const).filter((part) => now[part] !== before![part]);
      const then = "then run npm run guides:lock";
      const message = changed.includes("sources")
        ? `A source of ${slug} changed (${guideSources[slug].join(", ")}): check the guide in both languages, ${then}`
        : changed.length === 2
          ? `${slug} changed in both languages: check they still agree, ${then}`
          : changed[0] === "en"
            ? `The English ${slug} changed and the Hebrew didn't: update the Hebrew to match, ${then}`
            : `The Hebrew ${slug} changed and the English didn't: update the English to match, ${then}`;
      expect(changed, message).toEqual([]);
    });
  }
});

// ── Both languages have the same shape ───────────────────────────────────────

const shape = (block: GuideBlock) =>
  typeof block === "string"
    ? "p"
    : "list" in block
      ? `list:${block.list.length}`
      : "steps" in block
        ? `steps:${block.steps.length}`
        : "table" in block
          ? `table:${block.table.head.length}x${block.table.rows.length}`
          : "note";

const texts = (slug: GuideSlug, docs: typeof guidesEn.docs) => guideTexts(docs[slug]);

describe("the guides", () => {
  for (const slug of guideSlugs) {
    const en = guidesEn.docs[slug];
    const he = guidesHe.docs[slug];

    it(`${slug} has the same sections, blocks and questions in both languages`, () => {
      expect(he.sections.map((s) => s.id)).toEqual(en.sections.map((s) => s.id));
      expect(he.sections.map((s) => s.body.map(shape))).toEqual(en.sections.map((s) => s.body.map(shape)));
      expect(he.faq.length).toBe(en.faq.length);
      expect(he.facts.length).toBe(en.facts.length);
      expect(he.related).toEqual(en.related);
      expect(he.updated).toBe(en.updated);
    });

    it(`${slug} links only to guides that exist, and not to itself`, () => {
      for (const docs of [guidesEn.docs, guidesHe.docs]) {
        const links = texts(slug, docs).flatMap((text) => [...text.matchAll(/\]\(guide:([^)]+)\)/g)].map((m) => m[1]));
        for (const link of [...links, ...docs[slug].related]) {
          expect(guideSlugs, `${slug} links to ${link}`).toContain(link);
          expect(link).not.toBe(slug);
        }
      }
    });

    it(`${slug} says ויזה in Hebrew, not אשרה`, () => {
      const hebrew = [he.metaTitle, he.description, he.title, ...he.facts, ...texts(slug, guidesHe.docs)];
      // The noun with its prefixes (אשרה, האשרה, לאשרת…), not the verb (מאשרת, "approves").
      const visa = /(^|[^\u0590-\u05FF])[ובלכש]?ה?אשר(ה|ת|ות)(?![\u0590-\u05FF])/;
      for (const text of hebrew) expect(text).not.toMatch(visa);
    });
  }
});
