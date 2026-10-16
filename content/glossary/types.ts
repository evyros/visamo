// The glossary (/guide/glossary): the words of the process, from
// lib/knowledge/glossary.md, which stays the source of truth;
// glossary.test.ts flags the page when it changes.

import type { GuideSlug } from "@/content/guides";

export const glossaryGroupIds = ["offices", "process", "visas", "couple", "work", "certification", "laws"] as const;
export type GlossaryGroupId = (typeof glossaryGroupIds)[number];

/** A term as it is in every language: its names, and the guide about it, if there is one. */
export type GlossaryTerm = {
  /** Its anchor on the page: /guide/glossary#<id>. */
  id: string;
  english: string;
  /** How people say it in Israel, in Latin letters. */
  said: string;
  hebrew: string;
  guide?: GuideSlug;
};

export type GlossaryTexts = {
  labels: {
    guides: string;
    glossary: string;
    updated: string;
    /** The link to a term's guide. */
    readGuide: string;
  };
  /** Its card on the guides list (/guide). */
  card: { title: string; body: string; terms: string };
  metaTitle: string;
  description: string;
  title: string;
  intro: string;
  search: { label: string; placeholder: string; empty: string; clear: string };
  groups: Record<GlossaryGroupId, { title: string; note?: { title: string; body: string } }>;
  /** What each term is, and where it comes up in the process: one for every term, in every language. */
  meanings: Record<string, string>;
  cta: { title: string; body: string };
};
