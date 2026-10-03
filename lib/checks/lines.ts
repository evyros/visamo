import type { DocumentCheck } from "@/lib/documents/checks";
import type { Part } from "@/lib/documents/points";

// The lines of a document's check (lib/documents/checks.ts), each with an id
// the model gives back on every finding: R1, R2… for the required lines, S1,
// S2… for the recommended ones, numbered across the whole document, its
// parts' lines included, so an id alone names one line. Pure.

export type CheckLine = { id: string; kind: "required" | "recommended"; text: string; part?: Part };

/** What a finding that's for no line says instead of an id. */
export const NO_LINE = "none";

/** Every line of the check, in the order the model reads them: the document's own, then each part's. */
export function checkLines(check: DocumentCheck): CheckLine[] {
  let required = 0;
  let recommended = 0;
  const group = (lines: Pick<DocumentCheck, "required" | "recommended">, part?: Part): CheckLine[] => [
    ...lines.required.map((text) => ({ id: `R${++required}`, kind: "required" as const, text, ...(part && { part }) })),
    ...lines.recommended.map((text) => ({ id: `S${++recommended}`, kind: "recommended" as const, text, ...(part && { part }) })),
  ];
  return [group(check), ...(check.parts ?? []).map((p) => group(p, p.part))].flat();
}

/** What an answer's findings can name: the check's parts and its line ids. */
export type CheckShape = { parts: readonly Part[]; lines: readonly string[] };

export function checkShape(check: DocumentCheck): CheckShape {
  return { parts: check.parts?.map((p) => p.part) ?? [], lines: checkLines(check).map((l) => l.id) };
}
