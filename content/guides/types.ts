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
  "visiting-your-partner-in-israel",
] as const;
export type GuideSlug = (typeof guideSlugs)[number];

export const guideGroupIds = ["steps", "visas", "situation"] as const;
export type GuideGroupId = (typeof guideGroupIds)[number];

/**
 * Text with a little inline markup: **bold**, and links written
 * [text](guide:<slug>) for another guide (guide:<slug>#<section> for a part
 * of it), [text](/path) for a page, or [text](https://…) for another site,
 * which opens in a new tab.
 */
export type GuideText = string;

export type GuideBlock =
  | GuideText
  | { list: GuideText[] }
  | { steps: GuideText[] }
  | { table: { head: GuideText[]; rows: GuideText[][] } }
  /**
   * A note in a bubble: teal, or amber with `warning`. `link`: a link under its
   * text, with an arrow; `to` is guide:<slug>(#<section>) or a page's path.
   */
  | { note: GuideText; warning?: true; link?: { label: string; to: string } }
  /**
   * A button, for where the guide runs out and the couple's own case begins:
   * `to` is "signup", or a page's path (/guide/partner-visa-process), kept in
   * the reader's language.
   */
  | { button: string; to: string }
  /**
   * A card into the interactive guide (/guide/partner-visa-process), with a
   * drawing (components/guide-process-card): its questions, if listed, and a button.
   */
  | { process: { title: string; text: string; questions?: string[]; button: string } }
  /**
   * A card into the app, where the guide runs out and the couple's own case
   * begins (components/guide-list-card): a title, a line, a few short `points`
   * if given, and a sign-up button, beside a drawing of their own documents list.
   */
  | { signup: { title: string; text: GuideText; points?: string[]; button: string } }
  /** A heading inside a section, for a part of it. */
  | { heading: string }
  /** Lists of what to do (`yes`) and what isn't accepted (`no`), each with a title. */
  | { checks: { title: string; verdict: "yes" | "no"; items: GuideText[] }[] }
  /** Short tips, each beside a drawing: cards, or with `rows`, rows with no box. */
  | { tips: { icon: FigureIcon; text: GuideText }[]; rows?: true }
  /**
   * Documents as rows: each one's name, its tags (the couples it's only for,
   * and whether it comes from abroad with an apostille), and a note. Each row
   * starts with a bullet, or with `marker: "page"`, a small page (for forms).
   */
  | { docs: { name: GuideText; tags?: DocTag[]; note?: GuideText }[]; marker?: "page" }
  /** A few rules, numbered, each with a short title. The numbers count them; they aren't an order. */
  | { cards: { title: string; text: GuideText }[] }
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
      /** `text`: a line under the route's title. */
      routes: { icon: FigureIcon; title: string; text?: string; steps: string[] }[];
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
      /** One visa's years as its stickers, a row per way it's renewed; `months` is each sticker's length. */
      figure: "renewals";
      legend: { visa: string; renewal: string; end: string };
      rows: { name: string; total: string; stickers: { months: number; label: string }[] }[];
      caption: GuideText;
    }
  | {
      /** Who does the work: what's `yours` either way, beside what `theirs` adds. */
      figure: "split";
      yours: { title: string; items: { icon: FigureIcon; title: string; text: string }[] };
      theirs: { title: string; items: { icon: FigureIcon; title: string; text: string }[] };
      caption: GuideText;
    }
  | {
      /** Situations sorted in two: the `regular` process, and the ones that need a `lawyer`. */
      figure: "triage";
      regular: { title: string; items: GuideText[] };
      lawyer: { title: string; items: GuideText[] };
      caption: GuideText;
    }
  | {
      /**
       * The guide's sections as numbered steps in a row, each jumping to its
       * section (a section id). `handoff`: what happens on the way to the next
       * step, drawn as a plane on the arrow.
       */
      figure: "journey";
      steps: { icon: FigureIcon; title: string; text: string; section: string; handoff?: string }[];
      caption?: GuideText;
    }
  | {
      /** Two cases side by side: `when` it's this case, `then` what to do, and why. `art` draws the case. */
      figure: "fork";
      options: { art?: ForkArt; when: string; then: string; text: GuideText }[];
      caption?: GuideText;
    }
  | {
      /** Whether a document needs translating, a row per language. */
      figure: "languages";
      rows: { script: LanguageScript; name: string; verdict: string; tone: "ok" | "maybe" | "needed"; text?: GuideText }[];
      caption?: GuideText;
    }
  | {
      /** A way around, step by step. */
      figure: "detour";
      steps: GuideText[];
      caption?: GuideText;
    }
  | {
      /** The guide's sections as tiles, each jumping to its section (a section id). */
      figure: "map";
      /**
       * `apart`: a tile that isn't a subject like the others, drawn dashed and
       * tinted; with `wide` too, on a row of its own.
       */
      items: { icon: FigureIcon; title: string; section: string; wide?: boolean; apart?: boolean }[];
      caption: GuideText;
    };

/**
 * A document's tags: the couples it's only for (married or common-law), and its
 * mark: from abroad, with an apostille (`abroad`). Which partner a document is
 * for goes in its note. Their words are in the guides' labels.
 */
export const docTags = ["married", "commonLaw", "abroad"] as const;
export type DocTag = (typeof docTags)[number];

/** What a fork's case looks like: a paper document, or one that's only a file. */
export type ForkArt = "paper" | "digital";

/** The letters a languages row is drawn with: Hebrew and Arabic, Latin, or other scripts. */
export type LanguageScript = "he-ar" | "en" | "other";

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
  "talk",
  "more",
  "document",
  "attached",
  "screen",
  "family",
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
  /** The short answer the page opens with: a paragraph, or a few numbered lines. */
  answer: GuideText | GuideText[];
  /** When the facts were last checked, as YYYY-MM-DD. */
  updated: string;
  /** Blocks before the first section, like a drawing of the whole guide. */
  intro?: GuideBlock[];
  /** `step`: the section is a numbered step, shown beside its heading. */
  sections: { id: string; heading: string; step?: number; body: GuideBlock[] }[];
  /**
   * `signup`: a sign-up link under the answer, with this label. `link`: a link
   * to another page under it.
   */
  faq: { q: string; a: GuideText; signup?: string; link?: { label: string; path: string } }[];
  /** A few words to close the guide: after its sections, before the questions. */
  closing?: GuideText;
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
    /** The words on a document's tags. */
    docTags: Record<DocTag, string>;
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
