// Legal documents live here rather than in i18n/messages: they're long,
// reviewed by counsel as whole documents, and change on their own schedule.

/** A paragraph, or a bulleted list. */
export type LegalBlock = string | { list: string[] };

export type LegalSection = { heading: string; body: LegalBlock[] };

export type LegalDoc = {
  title: string;
  intro: LegalBlock[];
  sections: LegalSection[];
};

export type LegalSlug = "privacy" | "terms" | "accessibility";

export type LegalContent = {
  /** ISO date the texts were last changed. */
  updated: string;
  updatedLabel: string;
  docs: Record<LegalSlug, LegalDoc>;
};
