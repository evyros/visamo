// The public guides (/guide/<slug>): pages written for search and for sharing.
// Every fact in them comes from lib/knowledge, which stays the source of truth;
// guides.test.ts flags a guide whose sources changed since it was last checked.

export const guideSlugs = [
  "partner-visa-israel",
  "partner-visa-timeline",
  "partner-visa-documents",
  "common-law-couples",
  "entry-permit",
  "both-partners-abroad",
  "apostille-and-translation",
  "b1-visa",
  "a5-visa",
] as const;
export type GuideSlug = (typeof guideSlugs)[number];

export const guideGroupIds = ["steps", "visas", "situation"] as const;
export type GuideGroupId = (typeof guideGroupIds)[number];

/**
 * Text with a little inline markup: **bold**, and links written
 * [text](guide:<slug>) for another guide, [text](/path) for a page, or
 * [text](https://…) for another site, which opens in a new tab.
 */
export type GuideText = string;

export type GuideBlock =
  | GuideText
  | { list: GuideText[] }
  | { steps: GuideText[] }
  | { table: { head: GuideText[]; rows: GuideText[][] } }
  | { note: GuideText };

export type Guide = {
  /** The <title>, before " | Visamo". */
  metaTitle: string;
  description: string;
  /** A few key facts from the guide, shown on its card in the guides list. */
  facts: string[];
  /** The H1. */
  title: string;
  /** The short answer the page opens with. */
  answer: GuideText;
  /** When the facts were last checked, as YYYY-MM-DD. */
  updated: string;
  sections: { id: string; heading: string; body: GuideBlock[] }[];
  faq: { q: string; a: GuideText }[];
  related: GuideSlug[];
  cta: { title: string; body: string };
};

export type Guides = {
  labels: {
    guides: string;
    updated: string;
    shortAnswer: string;
    onThisPage: string;
    faq: string;
    related: string;
    /** `{minutes}` is filled in from the guide's length. */
    readingTime: string;
  };
  index: {
    metaTitle: string;
    description: string;
    title: string;
    intro: string;
    startHere: string;
    groups: Record<GuideGroupId, { title: string; intro: string }>;
  };
  docs: Record<GuideSlug, Guide>;
};
