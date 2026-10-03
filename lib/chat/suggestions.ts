import { format, type Messages } from "@/i18n/messages";
import type { Stage } from "@/lib/case-options";
import type { Certification } from "@/lib/documents/certification";

// The three questions a new chat suggests, one for each thing the chat can do
// that a general answer can't: it knows the couple's file, it knows each of
// their documents, and it knows what comes next at their stage. Picked from
// the case by fixed rules, never written by a model, so a case gets the same
// three until it changes.

type Texts = Messages["app"]["chat"]["suggestions"];

type Item = {
  key: string;
  optional: boolean;
  certification: Certification | null;
  mayNeedTranslation: boolean;
};

export type SuggestionCase = {
  stage: Stage;
  /** The document list, in its order. */
  items: readonly Item[];
  uploaded: ReadonlySet<string>;
  /** The documents whose current check found something to fix. */
  toFix: ReadonlySet<string>;
};

/** The file, a document, then the stage. `title` names a document by its list key. */
export function suggestionsFor(c: SuggestionCase, t: Texts, title: (key: string) => string): string[] {
  const missing = c.items.filter((i) => !i.optional && !c.uploaded.has(i.key));
  const file = missing.length ? t.file.missing : c.stage === "notFiled" ? t.file.ready : t.file.complete;
  return [file, documentQuestion(c, missing, t, title), t.stage[c.stage]];
}

function documentQuestion(c: SuggestionCase, missing: readonly Item[], t: Texts, title: (key: string) => string) {
  const ask = (template: string, item: Item) => format(template, { document: title(item.key) });
  // A check's finding first: it's the couple's own document, and the chat has the result.
  const fix = c.items.find((i) => c.uploaded.has(i.key) && c.toFix.has(i.key));
  if (fix) return ask(t.document.fix, fix);
  // Then what's still missing, the hardest part to get first.
  const by = (auth: Certification["authentication"]) => missing.find((i) => i.certification?.authentication === auth);
  const apostille = by("apostille") ?? by("utahApostille");
  if (apostille) return ask(t.document.apostille, apostille);
  const legalization = by("legalization");
  if (legalization) return ask(t.document.legalization, legalization);
  const translation = missing.find((i) => i.mayNeedTranslation);
  if (translation) return ask(t.document.translation, translation);
  if (missing[0]) return ask(t.document.show, missing[0]);
  return t.document.general;
}
