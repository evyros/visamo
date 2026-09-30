import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CHAT_RULES_VERSION, RULES } from "./chat/prompt";
import { KNOWLEDGE_VERSION, loadKnowledge } from "./knowledge-base";

// ── The prompt version lock ──────────────────────────────────────────────────
// Every chat answer records the version of the assistant's rules and of the
// knowledge base it was given (and every check, the knowledge base's), so an
// answer can be traced to the text behind it: `git log -S "KNOWLEDGE_VERSION = 7"`
// finds the commit. prompts.lock.json holds each version with a fingerprint
// of its text; when the text changes, the version has to go up with it.
// `npm run prompts:lock` records the new versions.

const LOCK = fileURLToPath(new URL("./prompts.lock.json", import.meta.url));

type Entry = { version: number; fingerprint: string };
type Lock = Record<"chatRules" | "knowledge", Entry>;

const fingerprint = (text: string) => createHash("sha256").update(text).digest("hex");
const current: Lock = {
  chatRules: { version: CHAT_RULES_VERSION, fingerprint: fingerprint(RULES) },
  knowledge: { version: KNOWLEDGE_VERSION, fingerprint: fingerprint(await loadKnowledge()) },
};
/** Where each version is set, for the messages. */
const where: Record<keyof Lock, string> = {
  chatRules: "CHAT_RULES_VERSION in lib/chat/prompt.ts",
  knowledge: "KNOWLEDGE_VERSION in lib/knowledge-base.ts",
};
const recorded: Lock | null = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")) : null;
const names = Object.keys(current) as (keyof Lock)[];

describe("the prompt versions", () => {
  if (process.env.UPDATE_PROMPTS_LOCK) {
    it("records the versions in prompts.lock.json", () => {
      for (const name of names) {
        const before = recorded?.[name];
        const expected = !before ? 1 : before.fingerprint === current[name].fingerprint ? before.version : before.version + 1;
        expect(
          current[name].version,
          before?.fingerprint === current[name].fingerprint
            ? `Nothing changed in ${name}: keep ${where[name]} at ${expected}`
            : `${name} changed: set ${where[name]} to ${expected} before recording`,
        ).toBe(expected);
      }
      writeFileSync(LOCK, JSON.stringify(current, null, 2) + "\n");
    });
    return;
  }

  for (const name of names) {
    it(`${name} matches prompts.lock.json`, () => {
      expect(recorded?.[name], "No entry in prompts.lock.json: run npm run prompts:lock").toBeTruthy();
      const before = recorded![name];
      expect(
        current[name].fingerprint === before.fingerprint,
        `${name} changed. Set ${where[name]} to ${before.version + 1}, then run npm run prompts:lock`,
      ).toBe(true);
      expect(current[name].version, `${where[name]} doesn't match prompts.lock.json: run npm run prompts:lock`).toBe(
        before.version,
      );
    });
  }
});
