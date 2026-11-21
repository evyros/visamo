import { describe, expect, it } from "vitest";
import { blockShape, blockTexts, guideSlugs } from "@/content/guides";
import { lawyerEn } from "./en";
import { lawyerHe } from "./he";
import type { LawyerSection, LawyerTexts } from "./types";

// The lawyer page in both languages: the same sections, drawings and
// questions, links only to guides that exist, and ויזה in Hebrew, as the
// guides (content/guides/guides.test.ts).

const shape = (section: LawyerSection) =>
  "compare" in section ? [`compare:${section.compare.rows.length}`] : section.body.map(blockShape);

const texts = (page: LawyerTexts) => [
  page.metaTitle,
  page.description,
  page.title,
  page.answer,
  ...page.summary.points.flatMap((p) => [p.title, p.text]),
  ...page.sections.flatMap((section) => [
    section.heading,
    ...("compare" in section
      ? [...Object.values(section.compare.head), ...section.compare.rows.flatMap((r) => [r.task, r.lawyer, r.visamo])]
      : section.body.flatMap(blockTexts)),
  ]),
  ...page.faq.items.flatMap((item) => [item.q, item.a]),
  page.card.title,
  page.card.body,
];

describe("the lawyer page", () => {
  it("has the same sections, blocks and questions in both languages", () => {
    expect(lawyerHe.sections.map((s) => s.id)).toEqual(lawyerEn.sections.map((s) => s.id));
    expect(lawyerHe.sections.map(shape)).toEqual(lawyerEn.sections.map(shape));
    expect(lawyerHe.summary.points.map((p) => p.icon)).toEqual(lawyerEn.summary.points.map((p) => p.icon));
    expect(lawyerHe.faq.items.length).toBe(lawyerEn.faq.items.length);
  });

  it("has the section its opening jumps to", () => {
    expect(lawyerEn.sections.map((s) => s.id)).toContain("when-you-need-a-lawyer");
  });

  it("links only to guides that exist", () => {
    for (const page of [lawyerEn, lawyerHe]) {
      const links = texts(page).flatMap((text) => [...text.matchAll(/\]\(guide:([^)]+)\)/g)].map((m) => m[1]));
      for (const link of links) expect(guideSlugs).toContain(link);
    }
  });

  it("says ויזה in Hebrew, not אשרה", () => {
    // As in the guides: the noun with its prefixes, not the verb (מאשרת).
    const visa = /(^|[^֐-׿])[ובלכש]?ה?אשר(ה|ת|ות)(?![֐-׿])/;
    for (const text of texts(lawyerHe)) expect(text.replace(/מחלקת אשרות/g, "")).not.toMatch(visa);
  });
});
