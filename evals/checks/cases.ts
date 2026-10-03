import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { regionName } from "@/i18n/format";
import { format } from "@/i18n/messages";
import en from "@/i18n/messages/en.json";
import type { BranchCode, CaseDetails } from "@/lib/case-options";
import { checkLines, type CheckLine } from "@/lib/checks/lines";
import { checkRatings, type CheckRating } from "@/lib/checks/result";
import { buildDocumentList, type RequiredDocument } from "@/lib/documents/build";
import { checkFor, type DocumentCheck } from "@/lib/documents/checks";
import { parts as allParts } from "@/lib/documents/points";
import { scenarios, type ScenarioName } from "@/lib/documents/scenarios";

// The document check's cases: a folder per document, named by its catalog id
// (or with "documentKey" in cases.json, for a key with a country), holding
// the files in files/ and the cases in cases.json:
//
//   {
//     "scenario": "marriedInCyprus",      the couple (lib/documents/scenarios.ts)
//     "today": "2026-10-01",              fixed, so the files don't age
//     "cases": [
//       { "name": "clean", "files": ["photo.jpg"], "expect": { "rating": "looksGood" } },
//       { "name": "busy background", "files": ["busy.jpg"],
//         "expect": { "flagged": ["light, plain background"] } }
//     ]
//   }
//
// A case can set its own "scenario", "today" and "branch". What it expects:
//
//   rating        the rating, or the ratings that are all fine
//   flagged       the checks the checker has to report
//   mayFlag       checks it may report or not, both fine
//   allowedExtra  findings for no expected check that a person reviewed and
//                 approved, in a few words each: the judge matches new ones
//                 against them
//
// A check is named by a piece of its text (any case), unique in the
// document, with "part: " in front for a document of parts
// ("foreignDeclaration: stamp and signature"). Not by its id: ids move when
// a check is added.

const ROOT = path.join(process.cwd(), "evals/checks");

const contentTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
};

type CaseSpec = {
  name: string;
  files: string[];
  scenario?: ScenarioName;
  today?: string;
  branch?: BranchCode;
  expect: {
    rating?: CheckRating | CheckRating[];
    flagged?: string[];
    mayFlag?: string[];
    allowedExtra?: string[];
  };
};

type SuiteSpec = Omit<CaseSpec, "name" | "files" | "expect"> & {
  documentKey?: string;
  scenario: ScenarioName;
  today: string;
  cases: CaseSpec[];
};

export type Expectation = {
  /** Null: any rating but "unreadable" (and "needsFixing" if a required line is flagged). */
  ratings: CheckRating[] | null;
  flagged: CheckLine[];
  mayFlag: CheckLine[];
  allowedExtra: string[];
};

export type CaseFile = { name: string; path: string; contentType: string };

export type EvalCase = {
  /** "<folder>/<case name>". */
  id: string;
  folder: string;
  name: string;
  /** The document's title, as the couple's list shows it in English. */
  title: string;
  documentKey: string;
  scenario: ScenarioName;
  details: CaseDetails;
  branch: BranchCode | null;
  today: string;
  item: RequiredDocument;
  check: DocumentCheck;
  lines: CheckLine[];
  files: CaseFile[];
  /** Files the case names that aren't in files/ yet: it's skipped until they are. */
  missing: string[];
  expect: Expectation;
};

/** The line `ref` names: a piece of its text, unique, with "part: " in front to pick a part's. */
export function resolveLine(ref: string, lines: readonly CheckLine[]): CheckLine | string {
  const prefixed = /^(\w+):\s*(.+)$/.exec(ref);
  const part = prefixed && (allParts as readonly string[]).includes(prefixed[1]) ? prefixed[1] : null;
  const text = (part ? prefixed![2] : ref).toLowerCase();
  const hits = lines.filter((l) => (!part || l.part === part) && l.text.toLowerCase().includes(text));
  if (hits.length === 1) return hits[0];
  const listed = (hits.length ? hits : lines).map((l) => `  ${l.id}${l.part ? ` [${l.part}]` : ""}: ${l.text}`);
  return `"${ref}" matches ${hits.length} checks${hits.length ? "" : ". The document's checks"}:\n${listed.join("\n")}`;
}

function loadSuite(folder: string): EvalCase[] {
  const dir = path.join(ROOT, folder);
  const suite = JSON.parse(readFileSync(path.join(dir, "cases.json"), "utf8")) as SuiteSpec;
  const documentKey = suite.documentKey ?? folder;
  const errors: string[] = [];
  const cases: EvalCase[] = [];

  for (const spec of suite.cases) {
    const id = `${folder}/${spec.name}`;
    const scenarioName = spec.scenario ?? suite.scenario;
    const snapshot = scenarios[scenarioName];
    if (!snapshot) {
      errors.push(`${id}: no scenario "${scenarioName}" in lib/documents/scenarios.ts`);
      continue;
    }
    const list = buildDocumentList(snapshot);
    const item = list.find((d) => d.key === documentKey) ?? list.find((d) => d.id === documentKey);
    if (!item) {
      errors.push(`${id}: "${documentKey}" isn't on ${scenarioName}'s list (${list.map((d) => d.key).join(", ")})`);
      continue;
    }
    const check = checkFor(item.key, item.points);
    if (!check) {
      errors.push(`${id}: "${item.key}" has no check yet`);
      continue;
    }
    const lines = checkLines(check);
    const resolve = (refs: string[] = []) =>
      refs.flatMap((ref) => {
        const line = resolveLine(ref, lines);
        if (typeof line === "string") errors.push(`${id}: ${line}`);
        return typeof line === "string" ? [] : [line];
      });

    const rating = spec.expect.rating;
    const ratings = rating === undefined ? null : Array.isArray(rating) ? rating : [rating];
    for (const r of ratings ?? []) if (!checkRatings.includes(r)) errors.push(`${id}: no rating "${r}"`);
    const files = spec.files.map((name) => {
      const ext = path.extname(name).toLowerCase();
      if (!contentTypes[ext]) errors.push(`${id}: "${name}" isn't a type the app accepts`);
      return { name, path: path.join(dir, "files", name), contentType: contentTypes[ext] };
    });
    if (!files.length) errors.push(`${id}: no files`);

    const israeli = snapshot.people.find((p) => p.isIsraeli)!;
    const foreign = snapshot.people.find((p) => !p.isIsraeli)!;
    cases.push({
      id,
      folder,
      name: spec.name,
      title: format(en.app.documents.items[item.id].title, { country: item.country ? regionName(item.country, "en") : "" }),
      documentKey: item.key,
      scenario: scenarioName,
      details: { relationship: snapshot.relationship, israeli, foreign },
      branch: spec.branch ?? suite.branch ?? null,
      today: spec.today ?? suite.today,
      item,
      check,
      lines,
      files,
      missing: files.filter((f) => !existsSync(f.path)).map((f) => f.name),
      expect: {
        ratings,
        flagged: resolve(spec.expect.flagged),
        mayFlag: resolve(spec.expect.mayFlag),
        allowedExtra: spec.expect.allowedExtra ?? [],
      },
    });
  }
  if (errors.length) throw new Error(`evals/checks/${folder}/cases.json:\n${errors.join("\n")}`);
  return cases;
}

/** Every case, from every folder with a cases.json. */
export function loadCases(): EvalCase[] {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(ROOT, entry.name, "cases.json")))
    .flatMap((entry) => loadSuite(entry.name));
}
