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
  | { note: GuideText }
  | GuideFigure;

/**
 * A drawing (components/guide-figures). The drawing itself has no words, so
 * one drawing serves both languages; its words and numbers are here.
 */
export type GuideFigure =
  | {
      /** The visas in order, each with what it makes possible. */
      figure: "path";
      stages: { title: string; text: string }[];
      /** The stage the guide is about, marked "you are here" (an index into `stages`). */
      current?: number;
      caption: GuideText;
    }
  | {
      /** A trip abroad on a visa: with the second sticker it's `kept`, without it it's `ended`. */
      figure: "trip";
      kept: { title: string; text: string };
      ended: { title: string; text: string };
      caption: GuideText;
    }
  | {
      /** Time on each visa, a bar per track. `b1` and `a5` are in months. */
      figure: "years";
      legend: { b1: string; a5: string; end: string };
      tracks: { name: string; total: string; b1: number; a5: number }[];
      caption: GuideText;
    }
  | {
      /** Two ways to the same place, side by side, each a few steps, joining at `end`. */
      figure: "routes";
      routes: { icon: FigureIcon; title: string; steps: string[] }[];
      end: { icon: FigureIcon; title: string; text?: string };
      caption: GuideText;
    }
  | {
      /** Stages that come back around to the first; `cost` is what each round costs. */
      figure: "loop";
      stages: { icon: FigureIcon; title: string }[];
      cost: string;
      caption: GuideText;
    }
  | {
      /** The guide's sections as tiles, each jumping to its section (a section id). */
      figure: "map";
      items: { icon: FigureIcon; title: string; section: string }[];
      caption: GuideText;
    };

/** The small drawings the figures are built from (components/guide-figures). */
export const figureIcons = [
  "home",
  "consulate",
  "seal",
  "chain",
  "plane",
  "translation",
  "forms",
  "passport",
  "hearts",
  "certificate",
  "shield",
  "rejected",
  "send",
  "hourglass",
] as const;
export type FigureIcon = (typeof figureIcons)[number];

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
