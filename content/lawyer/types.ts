// The lawyer page (/do-we-need-a-lawyer): whether a couple needs a lawyer for
// the partner visa, what a lawyer does and doesn't do, and the cases that need
// one. Its sections are written in the guides' blocks (content/guides), so
// they share the guides' text markup and drawings.

import type { FigureIcon, GuideBlock } from "@/content/guides";

/** Text with the guides' inline markup: **bold** and [links](…). */
type Text = string;

export type LawyerSection =
  | { id: string; heading: string; body: GuideBlock[] }
  | {
      id: string;
      heading: string;
      /** A lawyer and Visamo, task by task. */
      compare: { head: { task: string; lawyer: string; visamo: string }; rows: { task: string; lawyer: Text; visamo: Text }[] };
    };

export type LawyerTexts = {
  metaTitle: string;
  description: string;
  eyebrow: string;
  /** The H1. */
  title: string;
  /** The short answer the page opens with. */
  answer: Text;
  /** The anchor to the section on the cases that need a lawyer. */
  whenLink: string;
  updated: string;
  /** The short answer in three points, beside the opening. */
  summary: { title: string; points: { icon: FigureIcon; title: string; text: string }[] };
  sections: LawyerSection[];
  faq: { title: string; items: { q: string; a: string }[] };
  cta: { title: string; body: string };
  related: string;
  /** Its card on the guides list (/guide). */
  card: { title: string; body: string };
};
