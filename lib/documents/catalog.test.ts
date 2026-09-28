import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import en from "../../i18n/messages/en.json";
import he from "../../i18n/messages/he.json";
import { buildDocumentList } from "./build";
import {
  CATALOG_VERSION,
  DOCUMENT_ALIASES,
  RETIRED_DOCUMENT_IDS,
  documents as catalog,
  type DocumentDefinition,
} from "./catalog";
import { factsIn } from "./conditions";
import { facts } from "./facts";
import { scenarios } from "./scenarios";

const documents: readonly DocumentDefinition[] = catalog;
const ids = documents.map((d) => d.id);

describe("the catalog", () => {
  it("has each id once", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives each document from one police country per item its issuer", () => {
    for (const d of documents) {
      expect(d.issuedBy === "each", d.id).toBe(!!d.each);
    }
  });

  it("aliases old ids to live ones, and never an id still in use", () => {
    for (const [old, now] of Object.entries(DOCUMENT_ALIASES)) {
      expect(ids, old).not.toContain(old);
      expect(ids, old).toContain(now);
    }
  });

  it("never uses a retired id again", () => {
    for (const old of RETIRED_DOCUMENT_IDS) {
      expect(ids, old).not.toContain(old);
      expect(Object.keys(DOCUMENT_ALIASES), old).not.toContain(old);
    }
  });

  it("uses only facts the case profile has", () => {
    for (const d of documents) {
      for (const fact of factsIn(d.when)) expect(facts, d.id).toContain(fact);
    }
  });
});

describe("the messages", () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  for (const [locale, messages] of [
    ["en", en],
    ["he", he],
  ] as const) {
    const t = messages.app.documents;

    it(`${locale}: has a title and description for every document, and none for others`, () => {
      expect(Object.keys(t.items).sort()).toEqual([...ids].sort());
      for (const [id, item] of Object.entries(t.items)) {
        expect(item.title, id).not.toBe("");
        expect(item.description, id).not.toBe("");
      }
    });

    it(`${locale}: has a reason for every fact`, () => {
      expect(Object.keys(t.because).sort()).toEqual([...facts].sort());
    });

    it(`${locale}: uses {country} only for one item per country, and there always`, () => {
      for (const d of documents) {
        const item = t.items[d.id as keyof typeof t.items];
        const expected = d.each ? ["country"] : [];
        expect(placeholders(item.title), d.id).toEqual(expected);
      }
    });
  }

  it("uses the same placeholders in every language", () => {
    for (const id of ids) {
      const a = en.app.documents.items[id as keyof typeof en.app.documents.items];
      const b = he.app.documents.items[id as keyof typeof he.app.documents.items];
      expect(placeholders(b.title), id).toEqual(placeholders(a.title));
      expect(placeholders(b.description), id).toEqual(placeholders(a.description));
    }
  });
});

// ── The version lock ─────────────────────────────────────────────────────────
// catalog.lock.json records the catalog version, a fingerprint of the catalog
// and of every scenario's list, and each scenario's list. Any change to what a
// couple gets, from the catalog, the facts, the country lists or the
// certification rules, changes the fingerprint, and then the version has to
// go up with a changelog entry. `npm run catalog:lock` records a new version.

const here = (file: string) => fileURLToPath(new URL(file, import.meta.url));
const LOCK = here("./catalog.lock.json");
const CHANGELOG = here("./CHANGELOG.md");

type Lock = { version: number; fingerprint: string; scenarios: Record<string, string[]> };

const lists = Object.fromEntries(Object.entries(scenarios).map(([name, s]) => [name, buildDocumentList(s)]));
// Where a requirement comes from, and whether a person checked it, don't change any list.
const rules = documents.map((d) => ({ ...d, source: undefined, verified: undefined }));
const fingerprint = createHash("sha256").update(JSON.stringify({ rules, lists })).digest("hex");
const current: Lock = {
  version: CATALOG_VERSION,
  fingerprint,
  scenarios: Object.fromEntries(Object.entries(lists).map(([name, list]) => [name, list.map((d) => d.key)])),
};
const recorded: Lock | null = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : null;

/** Which scenarios' lists changed since the lock, for the failure message and the changelog entry. */
function changes(from: Lock | null) {
  const lines: string[] = [];
  for (const [name, keys] of Object.entries(current.scenarios)) {
    const before = from?.scenarios[name];
    if (!before) {
      lines.push(`  ${name}: new scenario`);
      continue;
    }
    const added = keys.filter((k) => !before.includes(k));
    const removed = before.filter((k) => !keys.includes(k));
    if (added.length || removed.length) {
      lines.push(`  ${name}: ${[...added.map((k) => `+${k}`), ...removed.map((k) => `-${k}`)].join(" ")}`);
    }
  }
  for (const name of Object.keys(from?.scenarios ?? {})) {
    if (!(name in current.scenarios)) lines.push(`  ${name}: scenario removed`);
  }
  return lines.length ? lines.join("\n") : "  (no scenario's list changed; something else in the catalog did)";
}

const hasChangelogEntry = (version: number) =>
  existsSync(CHANGELOG) && new RegExp(`^## v${version}\\b`, "m").test(readFileSync(CHANGELOG, "utf8"));

describe("the catalog version", () => {
  if (process.env.UPDATE_CATALOG_LOCK) {
    it("records the new version in catalog.lock.json", () => {
      const next = recorded ? recorded.version + 1 : 1;
      if (recorded && fingerprint === recorded.fingerprint) {
        expect(CATALOG_VERSION, "Nothing changed since the lock: keep the version as it is").toBe(recorded.version);
        return;
      }
      expect(CATALOG_VERSION, `The catalog changed: set CATALOG_VERSION to ${next} before recording`).toBe(next);
      expect(hasChangelogEntry(next), `Add a "## v${next}" entry to CHANGELOG.md before recording`).toBe(true);
      writeFileSync(LOCK, JSON.stringify(current, null, 2) + "\n");
      console.log(`Recorded catalog v${next}. Lists that changed:\n${changes(recorded)}`);
    });
    return;
  }

  it("matches catalog.lock.json", () => {
    expect(recorded, "No catalog.lock.json: run npm run catalog:lock").not.toBeNull();
    const next = recorded!.version + 1;
    expect(
      fingerprint === recorded!.fingerprint,
      [
        "The document catalog changed, so couples' lists change. To release it:",
        `  1. Set CATALOG_VERSION to ${next} in lib/documents/catalog.ts`,
        `  2. Add a "## v${next}" entry to lib/documents/CHANGELOG.md (format in lib/documents/CLAUDE.md)`,
        "  3. Run npm run catalog:lock",
        "Lists that changed:",
        changes(recorded),
      ].join("\n"),
    ).toBe(true);
    expect(CATALOG_VERSION, "CATALOG_VERSION doesn't match catalog.lock.json: run npm run catalog:lock").toBe(
      recorded!.version,
    );
  });

  it("has a changelog entry for this version", () => {
    expect(hasChangelogEntry(CATALOG_VERSION), `Add a "## v${CATALOG_VERSION}" entry to CHANGELOG.md`).toBe(true);
  });
});
