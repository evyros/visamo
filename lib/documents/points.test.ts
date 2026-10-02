import { describe, expect, it } from "vitest";
import en from "../../i18n/messages/en.json";
import he from "../../i18n/messages/he.json";
import { buildDocumentList } from "./build";
import { points } from "./points";
import { scenarios } from "./scenarios";

const pointsOf = (s: keyof typeof scenarios, key: string) =>
  buildDocumentList(scenarios[s]).find((d) => d.key === key)?.points;

describe("pointsFor", () => {
  it("asks a married partner for the status now, before the marriage, and the children", () => {
    expect(pointsOf("marriedInCyprus", "foreignCivilStatus:US")).toEqual([
      "statusNowMarried",
      "statusBeforeSingle",
      "noChildren",
    ]);
  });

  it("asks a common-law partner for the status their previous marriages make them, and the children", () => {
    expect(pointsOf("commonLawLivingTogether", "foreignCivilStatus:US")).toEqual(["statusNowSingle", "noChildren"]);
    expect(pointsOf("commonLawForeignDivorced", "foreignCivilStatus:US")).toEqual(["statusNowDivorced", "noChildren"]);
  });

  it("asks for the status before the marriage by how the earlier marriages ended", () => {
    expect(pointsOf("bothPreviouslyMarried", "foreignCivilStatus:US")).toEqual([
      "statusNowMarried",
      "statusBeforeDivorcedOrWidowed",
      "noChildren",
    ]);
  });

  it("asks about the children whether or not they move to Israel", () => {
    expect(pointsOf("childrenStayingBehind", "foreignCivilStatus:US")).toContain("children");
    expect(pointsOf("childrenMovingWithConsent", "foreignCivilStatus:US")).toContain("children");
  });

  it("asks the other countries lived in for the status now only", () => {
    expect(pointsOf("livedInThreeCountries", "foreignCivilStatus:FR")).toEqual([
      "statusNowMarried",
      "statusBeforeSingle",
      "noChildren",
    ]);
    for (const country of ["GB", "TH", "IN"]) {
      expect(pointsOf("livedInThreeCountries", `foreignCivilStatus:${country}`), country).toEqual(["statusNowMarried"]);
    }
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
