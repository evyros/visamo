import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import { suggestionsFor, type SuggestionCase } from "./suggestions";

const t = en.app.chat.suggestions;
const title = (key: string) => key;

const form = { key: "form", optional: false, certification: null, translation: "none" as const };
const birth = { key: "birth", optional: false, certification: { authentication: "apostille" as const }, translation: "notarized" as const };
const police = { key: "police", optional: false, certification: { authentication: "legalization" as const }, translation: "notarized" as const };
const letters = { key: "letters", optional: false, certification: null, translation: "notarized" as const };
const lease = { key: "lease", optional: true, certification: null, translation: "notarized" as const };

const base: SuggestionCase = {
  stage: "preparing",
  track: ["preparing", "filed", "firstAppointment", "interview"],
  awaitingDecision: false,
  items: [form, letters, police, birth, lease],
  uploaded: new Set(),
  toFix: new Set(),
};

describe("suggestionsFor", () => {
  it("asks about the file, a document and the stage", () => {
    expect(suggestionsFor(base, t, title)).toEqual([
      t.file.missing,
      "Does “birth” need an apostille?",
      t.stage.preparing,
    ]);
  });

  it("asks about the consulate while preparing, when both live abroad", () => {
    const c = { ...base, track: ["preparing", "consulate", "entryPermit", "arrived", "filed"] as const };
    expect(suggestionsFor(c, t, title)[2]).toBe(t.stage.consulate);
    const ready = { ...c, items: [form], uploaded: new Set(["form"]) };
    expect(suggestionsFor(ready, t, title)[0]).toBe(t.file.readyConsulate);
    expect(suggestionsFor({ ...ready, stage: "consulate" }, t, title)[0]).toBe(t.file.complete);
  });

  it("puts a check's finding before anything missing", () => {
    const c = { ...base, uploaded: new Set(["letters"]), toFix: new Set(["letters"]) };
    expect(suggestionsFor(c, t, title)[1]).toBe("How do I fix what the check found in “letters”?");
  });

  it("ignores a finding on a document with no file", () => {
    expect(suggestionsFor({ ...base, toFix: new Set(["letters"]) }, t, title)[1]).toBe("Does “birth” need an apostille?");
  });

  it("goes from apostille to legalization to translation to any missing document", () => {
    const ask = (uploaded: string[]) => suggestionsFor({ ...base, uploaded: new Set(uploaded) }, t, title)[1];
    expect(ask(["birth"])).toBe("How do I get “police” legalized?");
    expect(ask(["birth", "police"])).toBe("Does “letters” need a translation?");
    expect(ask(["birth", "police", "letters"])).toBe("What does “form” need to show?");
  });

  it("doesn't count an optional document as missing", () => {
    const c = { ...base, uploaded: new Set(["form", "letters", "police", "birth"]) };
    expect(suggestionsFor(c, t, title).slice(0, 2)).toEqual([t.file.ready, t.document.general]);
    expect(suggestionsFor({ ...c, stage: "interview" }, t, title)).toEqual([
      t.file.complete,
      t.document.general,
      t.stage.interview,
    ]);
    expect(suggestionsFor({ ...c, stage: "interview", awaitingDecision: true }, t, title)[2]).toBe(
      t.stage.awaitingDecision,
    );
  });
});
