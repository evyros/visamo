import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { guideSlugs, type GuideBlock, type GuideSlug } from "@/content/guides";
import { guidesEn } from "@/content/guides/en";
import {
  allAnswers,
  answersOf,
  canonicalAnswers,
  processGuide,
  processSources,
  processSteps,
  relatedGuides,
  trackSlug,
  trackSlugs,
  type Answers,
} from ".";
import { processEn } from "./en";
import { processHe } from "./he";
import type { ProcessTexts } from "./types";

// ── The guide's lock ─────────────────────────────────────────────────────────
// Like content/guides: the lock holds a fingerprint of the guide's sources in
// lib/knowledge and of both its texts, every version of them, as they were
// when someone last checked the three agree. `npm run guides:lock` records
// the new state.

const LOCK = fileURLToPath(new URL("./process.lock.json", import.meta.url));
const KNOWLEDGE = fileURLToPath(new URL("../../lib/knowledge/", import.meta.url));

const fingerprint = (value: unknown) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");

/** Everything a language says: the fixed texts, and each version of the guide, with the functions run. */
const rendered = (texts: ProcessTexts, locale: "en" | "he") => ({
  fixed: texts,
  versions: allAnswers.map((a) => ({
    guide: processGuide(locale, a),
    track: { ...texts.track.lengths(a), details: texts.track.details(a) },
  })),
});

const current = {
  sources: fingerprint(processSources.map((file) => readFileSync(KNOWLEDGE + file, "utf8")).join("\n")),
  en: fingerprint(rendered(processEn, "en")),
  he: fingerprint(rendered(processHe, "he")),
};

type Entry = typeof current;
const recorded: Entry | null = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : null;

describe("the process guide's lock", () => {
  if (process.env.UPDATE_GUIDES_LOCK) {
    it("records the guide in process.lock.json", () => {
      writeFileSync(LOCK, JSON.stringify(current, null, 2) + "\n");
    });
    return;
  }

  it("matches process.lock.json", () => {
    expect(recorded, "No process.lock.json: run npm run guides:lock").toBeTruthy();
    const changed = (["sources", "en", "he"] as const).filter((part) => current[part] !== recorded![part]);
    const then = "then run npm run guides:lock";
    const message = changed.includes("sources")
      ? `A source of the process guide changed (${processSources.join(", ")}): check the guide in both languages, ${then}`
      : changed.length === 2
        ? `The process guide changed in both languages: check they still agree, ${then}`
        : changed[0] === "en"
          ? `The English process guide changed and the Hebrew didn't: update the Hebrew to match, ${then}`
          : `The Hebrew process guide changed and the English didn't: update the English to match, ${then}`;
    expect(changed, message).toEqual([]);
  });
});

// ── The versions ─────────────────────────────────────────────────────────────

const name = (a: Answers) => trackSlug(a);

describe("the versions", () => {
  it("has a page for every combination of answers, each with its own slug", () => {
    expect(trackSlugs).toHaveLength(12);
    expect(new Set(trackSlugs).size).toBe(12);
    for (const a of allAnswers) expect(answersOf(trackSlug(a))).toEqual(a);
    expect(answersOf("married")).toBeNull();
  });

  it("points each version to one that has lived together", () => {
    for (const a of allAnswers) expect(canonicalAnswers(a).livedTogether).toBe(true);
  });

  it("links every form in the document list to its PDF", () => {
    for (const a of allAnswers) {
      const forms = processGuide("en", a).documents.find((group) => group.id === "forms")!;
      for (const item of forms.items.filter((item) => item.id !== "relationshipLetter")) {
        expect(item.link?.url, `${name(a)}: ${item.id}`).toMatch(/^https:\/\/www\.gov\.il\/.+\.pdf$/);
        for (const texts of [processEn, processHe]) expect(texts.documents.items[item.id].form, item.id).toBeTruthy();
      }
    }
  });

  it("puts every step once, in the order the process goes", () => {
    const steps = (slug: string) => processSteps(answersOf(slug)!);
    expect(steps("married-both-in-israel")).toEqual(["prepare", "file", "wait", "appointment", "b1", "interview", "a5"]);
    expect(steps("common-law-partner-abroad")).toEqual([
      "prepare",
      "file",
      "wait",
      "appointment",
      "travel",
      "interview",
      "b1",
      "a5",
    ]);
    expect(steps("married-both-abroad-never-lived-together")).toEqual([
      "consulate",
      "prepare",
      "entryPermit",
      "travel",
      "file",
      "wait",
      "appointment",
      "b1",
      "interview",
      "a5",
    ]);
    for (const a of allAnswers) expect(new Set(processSteps(a)).size, name(a)).toBe(processSteps(a).length);
  });
});

// ── Both languages say the same ──────────────────────────────────────────────

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

const blockTexts = (block: GuideBlock): string[] =>
  typeof block === "string"
    ? [block]
    : "list" in block
      ? block.list
      : "steps" in block
        ? block.steps
        : "table" in block
          ? [...block.table.head, ...block.table.rows.flat()]
          : [block.note];

/** Every piece of text a version shows, for the link and wording checks. */
function allTexts(texts: ProcessTexts, locale: "en" | "he", a: Answers) {
  const guide = processGuide(locale, a);
  return [
    guide.title,
    guide.metaTitle,
    guide.description,
    guide.answer,
    ...guide.steps.flatMap((step) => [
      step.title,
      step.short,
      ...step.meta.map((m) => m.text),
      ...step.body.flatMap(blockTexts),
      ...step.bubbles.flatMap((b) => [b.title, b.text]),
      ...step.faq.flatMap((item) => [item.q, item.a]),
      ...(step.milestone ? [step.milestone.title, step.milestone.lead, ...step.milestone.items] : []),
      ...(step.checklist ? [step.checklist.title, ...step.checklist.items] : []),
    ]),
    ...Object.values(texts.track.details(a)).flat(),
    ...guide.documents.flatMap((group) => [group.title, ...group.items.flatMap((item) => [item.name, item.note])]),
    ...texts.documents.rules.items,
    ...texts.landing.faq.flatMap((item) => [item.q, item.a]),
  ];
}

describe("both languages", () => {
  for (const a of allAnswers) {
    it(`${name(a)} has the same steps, blocks, tips and questions in both languages`, () => {
      const en = processGuide("en", a);
      const he = processGuide("he", a);
      expect(he.steps.map((s) => s.id)).toEqual(en.steps.map((s) => s.id));
      for (const [i, step] of en.steps.entries()) {
        const other = he.steps[i];
        expect(other.body.map(shape), step.id).toEqual(step.body.map(shape));
        expect(other.bubbles.map((b) => b.tone), step.id).toEqual(step.bubbles.map((b) => b.tone));
        expect(other.meta.map((m) => m.icon), step.id).toEqual(step.meta.map((m) => m.icon));
        expect(other.faq.length, step.id).toBe(step.faq.length);
        expect(other.milestone?.items.length, step.id).toBe(step.milestone?.items.length);
        expect(other.checklist?.items.length, step.id).toBe(step.checklist?.items.length);
      }
      expect(he.documents.map((g) => g.items.map((i) => i.id))).toEqual(en.documents.map((g) => g.items.map((i) => i.id)));
    });

    it(`${name(a)} links only to guides that exist`, () => {
      for (const [texts, locale] of [
        [processEn, "en"],
        [processHe, "he"],
      ] as const) {
        const links = allTexts(texts, locale, a).flatMap((text) =>
          [...text.matchAll(/\]\(guide:([^)]+)\)/g)].map((m) => m[1]),
        );
        for (const link of [...links, ...relatedGuides(a)]) expect(guideSlugs, `${name(a)} links to ${link}`).toContain(link);
      }
    });

    it(`${name(a)} links within the page only to the document list or a step`, () => {
      const targets = ["documents", ...processSteps(a).map((id) => `step-${id}`)];
      for (const [texts, locale] of [
        [processEn, "en"],
        [processHe, "he"],
      ] as const) {
        const anchors = allTexts(texts, locale, a).flatMap((text) => [...text.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]));
        for (const anchor of anchors) expect(targets, `${name(a)} links to #${anchor}`).toContain(anchor);
      }
    });

    it(`${name(a)} says ויזה in Hebrew, not אשרה`, () => {
      const visa = /(^|[^֐-׿])[ובלכש]?ה?אשר(ה|ת|ות)(?![֐-׿])/;
      for (const text of allTexts(processHe, "he", a)) expect(text).not.toMatch(visa);
    });
  }

  it("links the landing page's questions only to guide sections that exist, the same in both languages", () => {
    expect(processHe.landing.faq.map((item) => item.link?.path)).toEqual(processEn.landing.faq.map((item) => item.link?.path));
    for (const item of processEn.landing.faq) {
      if (!item.link) continue;
      const [, slug, section] = item.link.path.match(/^\/guide\/([^#]+)(?:#(.+))?$/) ?? [];
      expect(guideSlugs, item.link.path).toContain(slug);
      if (section) expect(guidesEn.docs[slug as GuideSlug].sections.map((s) => s.id), item.link.path).toContain(section);
    }
  });

  it("has the same fixed lists in both languages", () => {
    expect(processHe.landing.faq.length).toBe(processEn.landing.faq.length);
    expect(processHe.landing.glance.stages.length).toBe(processEn.landing.glance.stages.length);
    expect(processHe.landing.promises.length).toBe(processEn.landing.promises.length);
    expect(processHe.documents.rules.items.length).toBe(processEn.documents.rules.items.length);
    expect(processHe.documents.depends.items.length).toBe(processEn.documents.depends.items.length);
    expect(processHe.cta.features.map((f) => f.icon)).toEqual(processEn.cta.features.map((f) => f.icon));
  });
});
