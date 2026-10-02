import { describe, expect, it } from "vitest";
import { checkFor, checks, type DocumentCheck } from "./checks";
import { points } from "./points";

// A check written as a function of the points: here with every point, so every line is tested.
const written = Object.entries(checks)
  .filter(([, check]) => check !== "notYet")
  .map(([id, check]) => [id, typeof check === "function" ? check(points) : check] as [string, DocumentCheck]);

describe("checkFor", () => {
  it("finds a document's check by its list key, with or without a country", () => {
    expect(checkFor("securityCv")).toBe(checks.securityCv);
    expect(checkFor("foreignPoliceCertificate:US")).toBe(checks.foreignPoliceCertificate);
  });

  it("adds a required line for each point the item has to show", () => {
    const single = checkFor("foreignCivilStatus:US", ["statusNowSingle", "noChildren"])!;
    const married = checkFor("foreignCivilStatus:US", ["statusNowMarried", "statusBeforeSingle", "children"])!;
    expect(married.required.length).toBe(single.required.length + 1);
    expect(single.required.join(" ")).toMatch(/no children/);
    expect(married.required.join(" ")).toMatch(/before the marriage/);
  });

  it("has no check for a document that's put off, or for an unknown key", () => {
    expect(checkFor("foreignAffidavitMarried")).toBeNull();
    expect(checkFor("noSuchDocument")).toBeNull();
  });
});

describe("the checks", () => {
  it("give every written check at least one requirement, and no empty lines", () => {
    for (const [id, check] of written) {
      expect(check.required.length, id).toBeGreaterThan(0);
      for (const line of [...check.required, ...check.recommended]) expect(line.trim(), id).not.toBe("");
    }
  });

  it("never match a name against the name in the file: it's what the couple typed, not the legal name", () => {
    const namesTheFile = /name[^.]*\b(in the file|as they appear in the file)\b/i;
    for (const [id, check] of written) {
      for (const line of [...check.required, ...check.recommended]) expect(line, id).not.toMatch(namesTheFile);
    }
  });

  it("ask for the security screening CV in its bilingual form", () => {
    expect(checks.securityCv).not.toBe("notYet");
    expect((checks.securityCv as { required: readonly string[] }).required.join(" ")).toMatch(/Hebrew and Arabic/);
  });
});
