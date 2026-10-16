import { describe, expect, it } from "vitest";
import { affidavitInsteadOf, byOf, partOf, stepsFor } from "./steps";

describe("stepsFor", () => {
  it("leaves out what doesn't apply", () => {
    expect(stepsFor({ issuer: undefined, certification: null, translation: "none" }, true)).toEqual([]);
    expect(stepsFor({ issuer: "IL", certification: { authentication: "none" }, translation: "none" }, true)).toEqual([]);
  });

  it("certifies a document from a country not known, without getting or sending it", () => {
    const steps = stepsFor({ issuer: null, certification: { authentication: "dependsOnCountry" }, translation: "notarized" }, true);
    expect(steps.map((s) => s.kind)).toEqual(["authenticate", "translate"]);
  });

  it("gets a Utah marriage's original from Utah", () => {
    const steps = stepsFor({ issuer: "utah", certification: { authentication: "utahApostille" }, translation: "notarized" }, false);
    expect(steps[0]).toEqual({ kind: "obtain", from: "utah" });
  });
});

describe("affidavits", () => {
  const civilStatus = { issuer: "IN", certification: { authentication: "legalization" as const }, translation: "notarized" as const };

  it("replaces a document the country doesn't issue with an affidavit about the civil status", () => {
    const steps = stepsFor({ ...civilStatus, issuerKind: "affidavit", orAffidavit: true, children: "children" }, true);
    expect(steps).toEqual([
      { kind: "affidavit", about: "status", from: "IN" },
      { kind: "translate", level: "notarized", from: "IN" },
      { kind: "affidavit", about: "children" },
    ]);
    expect(affidavitInsteadOf({ ...civilStatus, issuerKind: "affidavit", orAffidavit: true })).toBe(false);
  });

  it("always declares the children in an affidavit of their own, whatever the country issues", () => {
    for (const issuerKind of ["document", "documentOrAffidavit", "affidavit", undefined] as const) {
      const steps = stepsFor({ ...civilStatus, issuer: "TH", ...(issuerKind && { issuerKind }), orAffidavit: true, children: "children" }, true);
      expect(steps.at(-1), issuerKind).toEqual({ kind: "affidavit", about: "children" });
    }
    // Only on the nationality's item.
    expect(stepsFor({ ...civilStatus, issuer: "TH", orAffidavit: true }, true).some((s) => s.kind === "affidavit")).toBe(false);
  });

  it("says there are no children, for a partner without any", () => {
    const steps = stepsFor({ ...civilStatus, issuer: "TH", orAffidavit: true, children: "noChildren" }, true);
    expect(steps.at(-1)).toEqual({ kind: "affidavit", about: "noChildren" });
    expect(partOf(steps.at(-1)!)).toBe("children");
    expect(byOf(steps.at(-1)!)).toBe("lawyer");
  });

  it("offers an affidavit in its place, where the document may not be had, or the country isn't known", () => {
    expect(affidavitInsteadOf({ ...civilStatus, issuer: "US", issuerKind: "documentOrAffidavit", orAffidavit: true })).toBe(true);
    expect(affidavitInsteadOf({ ...civilStatus, issuer: "VN", orAffidavit: true })).toBe(true);
    expect(affidavitInsteadOf({ ...civilStatus, issuer: "TH", issuerKind: "document", orAffidavit: true })).toBe(false);
  });

  it("never offers one for a document without it", () => {
    const steps = stepsFor({ ...civilStatus, issuer: "TH" }, true);
    expect(steps.some((s) => s.kind === "affidavit")).toBe(false);
    expect(affidavitInsteadOf({ ...civilStatus, issuer: "TH" })).toBe(false);
  });

  it("puts the children's at a lawyer and the status's at a notary", () => {
    expect(byOf({ kind: "affidavit", about: "children" })).toBe("lawyer");
    expect(byOf({ kind: "affidavit", about: "status" })).toBe("notary");
  });
});

describe("who does a step", () => {
  it("sends a notarized translation to a notary and their own to the couple", () => {
    expect(byOf({ kind: "translate", level: "notarized" })).toBe("notary");
    expect(byOf({ kind: "translate", level: "self" })).toBe("couple");
  });

  it("signs in front of whoever confirms it", () => {
    expect(byOf({ kind: "sign", before: "lawyer" })).toBe("lawyer");
    expect(byOf({ kind: "sign", before: "lawyerCourtOrNotary" })).toBe("lawyer");
    expect(byOf({ kind: "sign", before: "clerk" })).toBe("clerk");
  });
});
