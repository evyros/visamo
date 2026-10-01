import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadMessages } from "@/i18n/messages";
import { documents } from "./documents/catalog";
import { guideOpening } from "./knowledge-base";

// Every catalog document has a guide in lib/knowledge/documents/<id>.md. It
// opens with its title in English and Hebrew and the page's description,
// from the messages; the rest is empty until it's written.
// `npm run guides:sync` rewrites the openings after a message change.

const DIR = fileURLToPath(new URL("./knowledge/documents", import.meta.url));
const guides = readdirSync(DIR).filter((file) => file.endsWith(".md"));
const ids: readonly string[] = documents.map((d) => d.id);
const [en, he] = await Promise.all([loadMessages("en"), loadMessages("he")]);

/** A guide without its opening: the title line and the paragraph under it. */
const bodyOf = (text: string) => (text.startsWith("# ") ? text.replace(/^# .*\n+(?:.+\n)*\n*/, "") : text.trimStart());

describe("the document guides", () => {
  if (process.env.SYNC_GUIDES) {
    it("rewrites each guide's opening from the messages", () => {
      for (const { id } of documents) {
        const file = `${DIR}/${id}.md`;
        const body = guides.includes(`${id}.md`) ? bodyOf(readFileSync(file, "utf8")).trim() : "";
        writeFileSync(file, guideOpening(id, en, he) + (body ? `\n${body}\n` : ""));
      }
    });
    return;
  }

  it("has a guide for every document", () => {
    const missing = ids.filter((id) => !guides.includes(`${id}.md`));
    expect(missing, "Run npm run guides:sync to add lib/knowledge/documents/<id>.md").toEqual([]);
  });

  it("names every guide after a catalog document", () => {
    const unknown = guides.map((file) => file.replace(/\.md$/, "")).filter((id) => !ids.includes(id));
    expect(unknown, "A guide's file name is its document's id").toEqual([]);
  });

  for (const { id } of documents) {
    it(`${id}: opens with its title and description from the messages`, () => {
      const text = readFileSync(`${DIR}/${id}.md`, "utf8");
      expect(text.startsWith(guideOpening(id, en, he)), "Run npm run guides:sync").toBe(true);
      expect(bodyOf(text), "Only the title is a # heading: sections start at ##").not.toMatch(/^# /m);
      const broken = [...text.matchAll(/\]\(([^)]+\.md)\)/g)].map(([, to]) => to).filter((to) => !existsSync(`${DIR}/${to}`));
      expect(broken, "Link to another knowledge file as ../<file>.md").toEqual([]);
    });
  }
});
