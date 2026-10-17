import { describe, expect, it } from "vitest";
import { affidavitInsteadOf, byOf, statusByAffidavit, stepsFor } from "./steps";

describe("stepsFor", () => {
  it("leaves out what doesn't apply", () => {
    expect(stepsFor({ issuer: undefined, certification: null, translation: "none" }, true)).toEqual([]);
    expect(stepsFor({ issuer: "IL", certification: { authentication: "none" }, translation: "none" }, true)).toEqual([]);
  });

  it("certifies a document from a country not known, without getting or sending it", () => {
    const steps = stepsFor({ issuer: null, certification: { authentication: "dependsOnCountry" }, translation: "notarized" }, true);
    expect(steps.map((s) => s.kind)).toEqual(["authenticate", "translate"]);
  });

  it("sends nothing to Israel for a document issued only as a file", () => {
    const item = { issuer: "PH", certification: { authentication: "apostille" as const }, translation: "notarized" as const };
    expect(stepsFor({ ...item, electronic: true }, true).map((s) => s.kind)).toEqual(["obtain", "authenticate", "translate"]);
    expect(stepsFor({ ...item, electronic: true }, true)[0]).toEqual({ kind: "obtain", from: "PH", electronic: true });
    expect(stepsFor(item, true).map((s) => s.kind)).toEqual(["obtain", "authenticate", "send", "translate"]);
  });

  it("gets a Utah marriage's original from Utah", () => {
    const steps = stepsFor({ issuer: "utah", certification: { authentication: "utahApostille" }, translation: "notarized" }, false);
    expect(steps[0]).toEqual({ kind: "obtain", from: "utah" });
  });
});

describe("affidavits", () => {
  const civilStatus = { issuer: "IN", certification: { authentication: "legalization" as const }, translation: "notarized" as const };

  it("replaces a document the country doesn't issue with an affidavit about the civil status", () => {
    const steps = stepsFor({ ...civilStatus, issuerKind: "affidavit", orAffidavit: true }, true);
    expect(steps).toEqual([
      { kind: "affidavit", from: "IN" },
      { kind: "translate", level: "notarized", from: "IN" },
    ]);
    expect(affidavitInsteadOf({ ...civilStatus, issuerKind: "affidavit", orAffidavit: true })).toBe(false);
  });

  it("says whether the civil status may be an affidavit: in its place, or where the country issues none", () => {
    expect(statusByAffidavit({ ...civilStatus, issuerKind: "affidavit", orAffidavit: true })).toBe(true);
    expect(statusByAffidavit({ ...civilStatus, issuer: "US", issuerKind: "documentOrAffidavit", orAffidavit: true })).toBe(true);
    expect(statusByAffidavit({ ...civilStatus, issuer: "TH", issuerKind: "document", orAffidavit: true })).toBe(false);
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

  it("puts it at a notary", () => {
    expect(byOf({ kind: "affidavit" })).toBe("notary");
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
