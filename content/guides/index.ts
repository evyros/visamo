import type { Locale } from "@/i18n/config";
import { guidesEn } from "./en";
import { guidesHe } from "./he";
import type { Guide, GuideSlug, Guides } from "./types";

// One entry per locale; adding a language means adding its guides file here.
const guides: Record<Locale, Guides> = { en: guidesEn, he: guidesHe };

export function getGuides(locale: Locale): Guides {
  return guides[locale];
}

/**
 * The knowledge-base files (lib/knowledge) each guide's facts come from.
 * When one changes, guides.test.ts fails until the guide is checked against
 * it in both languages (npm run guides:lock).
 */
export const guideSources: Record<GuideSlug, string[]> = {
  "partner-visa-israel": [
    "process.md",
    "application.md",
    "first-appointment.md",
    "entry-permit.md",
    "interview.md",
    "certification.md",
  ],
  "a5-visa": ["process.md", "interview.md", "documents/foreignHealthInsurance.md"],
  "b1-visa": ["process.md", "first-appointment.md", "entry-permit.md", "documents/foreignHealthInsurance.md"],
};

/** Every piece of a guide's body text, in reading order: its answer, sections and questions. */
export function guideTexts(guide: Guide): string[] {
  const blocks = guide.sections.flatMap((section) => [section.heading, ...section.body]);
  return [
    guide.answer,
    ...blocks.flatMap((block) =>
      typeof block === "string"
        ? [block]
        : "list" in block
          ? block.list
          : "steps" in block
            ? block.steps
            : "table" in block
              ? [...block.table.head, ...block.table.rows.flat()]
              : [block.note],
    ),
    ...guide.faq.flatMap((item) => [item.q, item.a]),
  ];
}

/** Minutes to read a guide, at 200 words a minute. */
export function readingMinutes(guide: Guide) {
  const words = guideTexts(guide).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export { guideSlugs, type Guide, type GuideBlock, type GuideSlug } from "./types";
