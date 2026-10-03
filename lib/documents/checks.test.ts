import { describe, expect, it } from "vitest";
import { checkFor, checks, type DocumentCheck } from "./checks";
import { points } from "./points";

// A check written as a function of the points: here with every point, so every line is tested.
const written = Object.entries(checks)
  .filter(([, check]) => check !== "notYet")
  .map(([id, check]) => [id, typeof check === "function" ? check(points) : check] as [string, DocumentCheck]);

/** Every line of a check, its parts' included. */
const linesOf = (check: DocumentCheck) => [
  ...check.required,
  ...check.recommended,
  ...(check.parts ?? []).flatMap((part) => [...part.required, ...part.recommended]),
];

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
    expect(checkFor("childPoliceCertificate")).toBeNull();
    expect(checkFor("noSuchDocument")).toBeNull();
  });

  it("checks form AS/6 by its parts, the landlord's affidavit only where it's listed, and none of it required", () => {
    const withLandlord = checkFor("statusApplicationMarried", [
      "as6Application",
      "as6IsraeliDeclaration",
      "as6ForeignDeclaration",
      "as6LandlordAffidavit",
    ])!;
    expect(withLandlord.parts?.map((p) => p.part)).toEqual([
      "application",
      "israeliDeclaration",
      "foreignDeclaration",
      "landlordAffidavit",
    ]);
    expect(withLandlord.parts?.find((p) => p.part === "landlordAffidavit")?.required).toEqual([]);
    const abroad = checkFor("statusApplicationMarried", ["as6Application", "as6IsraeliDeclaration", "as6ForeignDeclarationLater"])!;
    expect(abroad.parts?.map((p) => p.part)).toEqual(["application", "israeliDeclaration", "foreignDeclaration"]);
    expect(abroad.parts?.find((p) => p.part === "foreignDeclaration")?.required).toEqual([]);
  });

  it("checks form AS/6 on the strong model, and other documents on the standard one", () => {
    expect(checkFor("statusApplicationMarried", ["as6Application"])?.model).toBe("strong");
    expect(checkFor("relationshipStory")?.model).toBeUndefined();
  });

  it("follows the AS/6 declarations, merged into the form, to its check", () => {
    for (const old of ["israeliAffidavitMarried", "foreignAffidavitMarried", "landlordAffidavit"]) {
      expect(checkFor(old, ["as6Application"])?.parts?.[0].part, old).toBe("application");
    }
  });
});

describe("the checks", () => {
  it("give every written check at least one requirement, and no empty lines", () => {
    const required = (check: DocumentCheck) =>
      check.required.length + (check.parts ?? []).reduce((n, part) => n + part.required.length, 0);
    for (const [id, check] of written) {
      expect(required(check), id).toBeGreaterThan(0);
      for (const line of linesOf(check)) expect(line.trim(), id).not.toBe("");
    }
  });

  it("never match a name against the name in the file: it's what the couple typed, not the legal name", () => {
    const namesTheFile = /name[^.]*\b(in the file|as they appear in the file)\b/i;
    for (const [id, check] of written) {
      for (const line of linesOf(check)) expect(line, id).not.toMatch(namesTheFile);
    }
  });

  it("ask for the security screening CV in its bilingual form", () => {
    expect(checks.securityCv).not.toBe("notYet");
    expect((checks.securityCv as { required: readonly string[] }).required.join(" ")).toMatch(/Hebrew and Arabic/);
  });
});
