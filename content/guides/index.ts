import type { Locale } from "@/i18n/config";
import { guidesEn } from "./en";
import { guidesHe } from "./he";
import type { Guide, GuideBlock, GuideGroupId, GuideSlug, Guides } from "./types";

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
  "partner-visa-timeline": [
    "process.md",
    "application.md",
    "first-appointment.md",
    "entry-permit.md",
    "interview.md",
    "certification.md",
    "documents/foreignPoliceCertificate.md",
  ],
  "common-law-couples": [
    "process.md",
    "application.md",
    "first-appointment.md",
    "interview.md",
    "documents.md",
    "documents/affidavitCommonLaw.md",
    "documents/jointLivingEvidence.md",
    "documents/foreignCivilStatus.md",
  ],
  "partner-visa-documents": [
    "documents.md",
    "certification.md",
    "children.md",
    "application.md",
    "documents/foreignPoliceCertificate.md",
    "documents/foreignCivilStatus.md",
  ],
  "entry-permit": ["entry-permit.md", "application.md", "first-appointment.md", "interview.md"],
  "both-partners-abroad": ["both-abroad.md", "entry-permit.md"],
  "apostille-and-translation": ["certification.md"],
};

/**
 * How the guides list (/guide) is laid out: it starts with the process guide
 * (content/process), then the guides in groups. Every guide appears exactly
 * once (guides.test.ts).
 */
export const guideIndex: {
  groups: { id: GuideGroupId; numbered: boolean; slugs: GuideSlug[] }[];
} = {
  groups: [
    {
      id: "steps",
      numbered: true,
      slugs: [
        "partner-visa-israel",
        "partner-visa-documents",
        "apostille-and-translation",
        "entry-permit",
        "partner-visa-timeline",
      ],
    },
    { id: "visas", numbered: false, slugs: ["b1-visa", "a5-visa"] },
    { id: "situation", numbered: false, slugs: ["common-law-couples", "both-partners-abroad"] },
  ],
};

/** A block's text, in reading order. */
export function blockTexts(block: GuideBlock): string[] {
  if (typeof block === "string") return [block];
  if ("list" in block) return block.list;
  if ("steps" in block) return block.steps;
  if ("table" in block) return [...block.table.head, ...block.table.rows.flat()];
  if ("note" in block) return [block.note];
  switch (block.figure) {
    case "path":
      return [...block.stages.flatMap((s) => [s.title, s.text]), block.caption];
    case "trip":
      return [block.kept.title, block.kept.text, block.ended.title, block.ended.text, block.caption];
    case "years":
      return [...Object.values(block.legend), ...block.tracks.flatMap((t) => [t.name, t.total]), block.caption];
    case "routes":
      return [
        ...block.routes.flatMap((r) => [r.title, ...r.steps]),
        block.end.title,
        ...(block.end.text ? [block.end.text] : []),
        block.caption,
      ];
    case "loop":
      return [...block.stages.map((s) => s.title), block.cost, block.caption];
    case "map":
      return [...block.items.map((item) => item.title), block.caption];
  }
}

/** A block's kind and size, and a drawing's numbers: the same in both languages. */
export function blockShape(block: GuideBlock): string {
  if (typeof block === "string") return "p";
  if ("list" in block) return `list:${block.list.length}`;
  if ("steps" in block) return `steps:${block.steps.length}`;
  if ("table" in block) return `table:${block.table.head.length}x${block.table.rows.length}`;
  if ("note" in block) return "note";
  switch (block.figure) {
    case "path":
      return `path:${block.stages.length}${block.current === undefined ? "" : `@${block.current}`}`;
    case "trip":
      return "trip";
    case "years":
      return `years:${block.tracks.map((t) => `${t.b1}/${t.a5}`).join(",")}`;
    case "routes":
      return `routes:${block.routes.map((r) => `${r.icon}/${r.steps.length}`).join(",")}>${block.end.icon}/${block.end.text ? 1 : 0}`;
    case "loop":
      return `loop:${block.stages.map((s) => s.icon).join(",")}`;
    case "map":
      return `map:${block.items.map((item) => `${item.icon}@${item.section}`).join(",")}`;
  }
}

/** Every piece of a guide's body text, in reading order: its answer, sections and questions. */
export function guideTexts(guide: Guide): string[] {
  const blocks = guide.sections.flatMap((section) => [section.heading, ...section.body]);
  return [guide.answer, ...blocks.flatMap(blockTexts), ...guide.faq.flatMap((item) => [item.q, item.a])];
}

/** Minutes to read a guide, at 200 words a minute. */
export function readingMinutes(guide: Guide) {
  const words = guideTexts(guide).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export {
  figureIcons,
  guideGroupIds,
  guideSlugs,
  type FigureIcon,
  type Guide,
  type GuideBlock,
  type GuideFigure,
  type GuideSlug,
} from "./types";
