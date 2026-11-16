import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import he from "@/i18n/messages/he.json";
import { procedures } from "./index";

// The sources page restates lib/knowledge/sources.md: this keeps the two in step.

const markdown = readFileSync(path.join(process.cwd(), "lib/knowledge/sources.md"), "utf8");

/** The bold names of the sources the knowledge base lists, without their periods. */
function sourceNames() {
  const heading = "## Where this knowledge comes from\n";
  const start = markdown.indexOf(heading);
  if (start < 0) throw new Error(`sources.md has no "${heading.trim()}"`);
  const rest = markdown.slice(start + heading.length);
  const end = rest.search(/^## /m);
  return [...(end < 0 ? rest : rest.slice(0, end)).matchAll(/^- \*\*(.+?)\.?\*\*/gm)].map((m) => m[1]);
}

describe("the sources page", () => {
  it("names the sources the knowledge base names", () => {
    const names = sourceNames();
    // The page orders them its own way.
    expect(en.sources.list.items.map((i) => i.title).sort()).toEqual([...names].sort());
    expect(he.sources.list.items).toHaveLength(names.length);
  });
});

describe("the procedures", () => {
  /** A procedure's entry in sources.md: its line, from its bold number. */
  function entry(number: string) {
    const start = markdown.indexOf(`- **${number}**`);
    if (start < 0) throw new Error(`sources.md has no procedure ${number}`);
    return markdown.slice(start, markdown.indexOf("\n", start));
  }

  it("are the ones sources.md lists, each for its kind of couple", () => {
    expect(entry(procedures.married)).toMatch(/married to an Israeli/);
    expect(entry(procedures.commonLaw)).toMatch(/common-law/);
  });
});
