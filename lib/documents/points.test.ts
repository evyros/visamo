import { describe, expect, it } from "vitest";
import en from "../../i18n/messages/en.json";
import he from "../../i18n/messages/he.json";
import { buildDocumentList } from "./build";
import { points } from "./points";
import { scenarios } from "./scenarios";

const pointsOf = (s: keyof typeof scenarios, key: string) =>
  buildDocumentList(scenarios[s]).find((d) => d.key === key)?.points;

describe("pointsFor", () => {
  it("asks a married partner for the status now and before the marriage", () => {
    expect(pointsOf("marriedInCyprus", "foreignCivilStatus:US")).toEqual(["statusNowMarried", "statusBeforeSingle"]);
  });

  it("asks a common-law partner for the status their previous marriages make them", () => {
    expect(pointsOf("commonLawLivingTogether", "foreignCivilStatus:US")).toEqual(["statusNowSingle"]);
    expect(pointsOf("commonLawForeignDivorced", "foreignCivilStatus:US")).toEqual(["statusNowDivorced"]);
  });

  it("asks for the status before the marriage by how the earlier marriages ended", () => {
    expect(pointsOf("bothPreviouslyMarried", "foreignCivilStatus:US")).toEqual([
      "statusNowMarried",
      "statusBeforeDivorcedOrWidowed",
    ]);
  });

  it("asks the children's affidavit about the children, whether or not they move to Israel", () => {
    expect(pointsOf("marriedInCyprus", "previousChildrenAffidavit")).toEqual(["noChildren"]);
    expect(pointsOf("childrenStayingBehind", "previousChildrenAffidavit")).toEqual(["children"]);
    expect(pointsOf("childrenMovingWithConsent", "previousChildrenAffidavit")).toEqual(["children"]);
  });

  it("asks the other countries lived in for the status now only", () => {
    expect(pointsOf("livedInThreeCountries", "foreignCivilStatus:FR")).toEqual(["statusNowMarried", "statusBeforeSingle"]);
    for (const country of ["GB", "TH", "IN"]) {
      expect(pointsOf("livedInThreeCountries", `foreignCivilStatus:${country}`), country).toEqual(["statusNowMarried"]);
    }
  });

  it("lists form AS/6's parts: the foreign partner's declaration by where they are, the landlord's affidavit with the lease", () => {
    expect(pointsOf("marriedInCyprus", "statusApplicationMarried")).toEqual([
      "as6Application",
      "as6IsraeliDeclaration",
      "as6ForeignDeclaration",
      "as6LandlordAffidavit",
    ]);
    // The foreign partner abroad, the Israeli partner filing from Israel: their declaration is a document of its own.
    expect(pointsOf("foreignAbroad", "statusApplicationMarried")).toEqual([
      "as6Application",
      "as6IsraeliDeclaration",
      "as6LandlordAffidavit",
    ]);
    // Both abroad: they file together once in Israel, with both declarations.
    expect(pointsOf("bothAbroad", "statusApplicationMarried")).toContain("as6ForeignDeclaration");
    expect(pointsOf("neverLivedTogetherBothAbroad", "statusApplicationMarried")).not.toContain("as6LandlordAffidavit");
  });

  it("gives other documents none", () => {
    expect(pointsOf("marriedInCyprus", "foreignPassport")).toEqual([]);
  });
});

describe("the points' messages", () => {
  it("has a text for every point, and none for others, in both languages", () => {
    for (const messages of [en, he]) {
      expect(Object.keys(messages.app.documents.points).sort()).toEqual([...points].sort());
    }
  });
});
