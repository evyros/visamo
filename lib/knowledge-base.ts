import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { format, type Messages } from "@/i18n/messages";
import { documents, type Category, type DocumentId } from "@/lib/documents/catalog";

// The knowledge base (lib/knowledge), as the models read it: the chat, and
// the document checker, so both know the process the same way.

/**
 * The knowledge base's version, recorded on every answer and check: the text
 * is too big to store with each. Any change to the files below needs a new
 * version: lib/prompts.test.ts fails until it's raised and recorded
 * (npm run prompts:lock).
 */
export const KNOWLEDGE_VERSION = 47;

/** In reading order. lib/knowledge/CLAUDE.md is for its authors, not the models. */
const KNOWLEDGE_FILES = [
  "README.md",
  "process.md",
  "application.md",
  "first-appointment.md",
  "interview.md",
  "both-abroad.md",
  "documents.md",
  "certification.md",
  "children.md",
  "former-ussr.md",
  "security-check.md",
  "sources.md",
  "glossary.md",
];

/** The groups the guides are read in, in catalog order, as documents.md names them. */
const CATEGORY_HEADINGS: Record<Category, string> = {
  forms: "Forms",
  identity: "Identity",
  relationship: "Your relationship",
  civilStatus: "Civil status",
  criminalRecord: "Criminal record",
  centerOfLife: "Center of life",
  children: "Children moving to Israel",
};

/** A message with its `{country}` left general: a guide covers every country at once. */
const general = (text: string) => format(text.replace(/:\s*\{country\}/, ""), { country: "the country" });

/**
 * How every guide opens: its title in English and Hebrew, and the page's
 * English description, from the messages. The tests check each guide opens
 * with it; `npm run guides:sync` rewrites the openings after a message change.
 */
export function guideOpening(id: DocumentId, en: Messages, he: Messages) {
  const text = en.app.documents.items[id];
  return `# ${general(text.title)} (${general(he.app.documents.items[id].title)})\n\n${general(text.description)}\n`;
}

/**
 * The documents' guides, grouped like the documents page, each one's headings
 * moved under its group. Their links go up a folder (`../certification.md`),
 * so they work in an editor; the models read them as the other files'.
 */
async function documentGuides(dir: string) {
  const sections = new Map<Category, string[]>();
  for (const doc of documents) {
    const guide = (await readFile(path.join(dir, "documents", `${doc.id}.md`), "utf8")).trim();
    sections.set(doc.category, [...(sections.get(doc.category) ?? []), guide.replace(/^#/gm, "###").replaceAll("](../", "](")]);
  }
  return [...sections].map(([category, guides]) => `## ${CATEGORY_HEADINGS[category]}\n\n${guides.join("\n\n")}`);
}

let knowledge: Promise<string> | undefined;

export function loadKnowledge() {
  const dir = path.join(process.cwd(), "lib/knowledge");
  knowledge ??= Promise.all([
    Promise.all(KNOWLEDGE_FILES.map((file) => readFile(path.join(dir, file), "utf8"))),
    documentGuides(dir),
  ]).then(([files, guides]) => {
    // The guides follow documents.md, as its sections.
    const at = KNOWLEDGE_FILES.indexOf("documents.md");
    const documentsPart = [files[at].trim(), ...guides].join("\n\n");
    return files.map((file, i) => (i === at ? documentsPart : file)).join("\n\n---\n\n");
  });
  return knowledge;
}
