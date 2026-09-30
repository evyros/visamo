import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

// The knowledge base (lib/knowledge), as the models read it: the chat, and
// the document checker, so both know the process the same way.

/**
 * The knowledge base's version, recorded on every answer and check: the text
 * is too big to store with each. Any change to the files below needs a new
 * version: lib/prompts.test.ts fails until it's raised and recorded
 * (npm run prompts:lock).
 */
export const KNOWLEDGE_VERSION = 1;

/** In reading order. lib/knowledge/CLAUDE.md is for its authors, not the models. */
const KNOWLEDGE_FILES = [
  "README.md",
  "process.md",
  "documents.md",
  "certification.md",
  "children.md",
  "former-ussr-and-security.md",
  "sources.md",
];

let knowledge: Promise<string> | undefined;

export function loadKnowledge() {
  const dir = path.join(process.cwd(), "lib/knowledge");
  knowledge ??= Promise.all(KNOWLEDGE_FILES.map((file) => readFile(path.join(dir, file), "utf8"))).then((files) =>
    files.join("\n\n---\n\n"),
  );
  return knowledge;
}

