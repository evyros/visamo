import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { guideSlugs } from "@/content/guides";
import { glossaryGroupIds, glossaryGroups, glossarySources, glossaryTerms } from ".";
import { glossaryEn } from "./en";
import { glossaryHe } from "./he";

// ── The glossary's lock ──────────────────────────────────────────────────────
// Like content/guides: the lock holds a fingerprint of the glossary's sources
// in lib/knowledge, of its terms, and of both its texts, as they were when
// someone last checked they agree. `npm run guides:lock` records the new state.

const LOCK = fileURLToPath(new URL("./glossary.lock.json", import.meta.url));
const KNOWLEDGE = fileURLToPath(new URL("../../lib/knowledge/", import.meta.url));

const fingerprint = (value: unknown) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");

const current = {
  sources: fingerprint(glossarySources.map((file) => readFileSync(KNOWLEDGE + file, "utf8")).join("\n")),
  terms: fingerprint(glossaryGroups),
  en: fingerprint(glossaryEn),
  he: fingerprint(glossaryHe),
};

type Entry = typeof current;
const recorded: Entry | null = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : null;

describe("the glossary's lock", () => {
  if (process.env.UPDATE_GUIDES_LOCK) {
    it("records the glossary in glossary.lock.json", () => {
      writeFileSync(LOCK, JSON.stringify(current, null, 2) + "\n");
    });
    return;
  }

  it("matches glossary.lock.json", () => {
    expect(recorded, "No glossary.lock.json: run npm run guides:lock").toBeTruthy();
    const changed = (["sources", "terms", "en", "he"] as const).filter((part) => current[part] !== recorded![part]);
    const then = "then run npm run guides:lock";
    const message = changed.includes("sources")
      ? `A source of the glossary changed (${glossarySources.join(", ")}): check the terms and both languages, ${then}`
      : changed.includes("terms")
        ? `The glossary's terms changed: check them against glossary.md and both languages, ${then}`
        : changed.length === 2
          ? `The glossary changed in both languages: check they still agree, ${then}`
          : changed[0] === "en"
            ? `The English glossary changed and the Hebrew didn't: update the Hebrew to match, ${then}`
            : `The Hebrew glossary changed and the English didn't: update the English to match, ${then}`;
    expect(changed, message).toEqual([]);
  });
});

describe("the glossary", () => {
  it("has every group once, in order", () => {
    expect(glossaryGroups.map((group) => group.id)).toEqual([...glossaryGroupIds]);
  });

  it("gives every term its own anchor", () => {
    const ids = glossaryTerms.map((term) => term.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("explains every term, in both languages, and only terms that exist", () => {
    const ids = glossaryTerms.map((term) => term.id).sort();
    expect(Object.keys(glossaryEn.meanings).sort()).toEqual(ids);
    expect(Object.keys(glossaryHe.meanings).sort()).toEqual(ids);
  });

  it("has the same notes in both languages", () => {
    for (const id of glossaryGroupIds) {
      expect(Boolean(glossaryHe.groups[id].note)).toBe(Boolean(glossaryEn.groups[id].note));
    }
  });

  it("links only to guides that exist", () => {
    for (const term of glossaryTerms) if (term.guide) expect(guideSlugs).toContain(term.guide);
  });

  it("says ויזה in Hebrew, not אשרה", () => {
    const visa = /(^|[^֐-׿])[ובלכש]?ה?אשר(ה|ת|ות)(?![֐-׿])/;
    const hebrew = [JSON.stringify(glossaryHe), ...glossaryTerms.map((term) => term.hebrew)];
    for (const text of hebrew) expect(text).not.toMatch(visa);
  });
});
