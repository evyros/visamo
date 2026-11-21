// The Contributor program's page (/contributor-program): what couples get,
// how to join, and what we promise, in short. The full terms are a legal page
// (/legal/contributor-program, content/legal).
//
// {price} is the program's price, {regular} Full file check's regular price
// and {saving} the difference: the page fills them in.

import type { IconName } from "@/components/icons";

export type ContributorTexts = {
  metaTitle: string;
  description: string;
  hero: {
    eyebrow: string;
    title: string;
    /** The H1's second line, in teal. */
    titleAccent: string;
    subtitle: string;
    /** The button to the contact form, here and at the end. */
    cta: string;
    terms: string;
  };
  /** Without the program and in it, side by side: the one thing that changes is the consent. */
  consent: {
    title: string;
    without: { label: string; title: string; body: string; price: string };
    with: { label: string; title: string; body: string; price: string };
    /** Under the cards: no one is in the program without asking to join. */
    note: string;
  };
  /** What the documents teach us, and why we want them. */
  why: { title: string; items: { icon: IconName; title: string; body: string }[] };
  /** {form} in a step is a link to the contact form, its text `formLink`. */
  steps: { title: string; formLink: string; items: { title: string; body: string }[] };
  promises: {
    eyebrow: string;
    title: string;
    items: { icon: IconName; title: string; body: string }[];
    link: string;
  };
  final: {
    title: string;
    optional: string;
  };
};
