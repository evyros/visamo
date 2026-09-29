import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

// The knowledge base (lib/knowledge), as the models read it: the chat, and
// the document checker, so both know the process the same way.

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

/** Identifies the knowledge base's version, for a check's record: the text itself is too big to store per check. */
export async function knowledgeHash() {
  return createHash("sha256").update(await loadKnowledge()).digest("hex").slice(0, 16);
}
