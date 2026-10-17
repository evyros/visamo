import { describe, expect, it } from "vitest";
import en from "../i18n/messages/en.json";
import he from "../i18n/messages/he.json";
import { chainLinks } from "./documents/countries";
import { stepText } from "./document-steps";
import type { Issuer } from "./documents/certification";

const t = en.app.documentsPage;
const firstPoint = (from?: Issuer) =>
  stepText({ kind: "translate", level: "notarized", ...(from !== undefined && { from }) }, "foreignBirthCertificate", t, "en")
    .details?.points?.[0];

describe("a notarized translation's full text", () => {
  it("says only that English is usually accepted, for a country that doesn't issue in Arabic", () => {
    expect(firstPoint("TH")).toBe(t.steps.translateEnglish);
    expect(firstPoint("utah")).toBe(t.steps.translateEnglish);
  });

  it("adds that Arabic needs none, for an Arabic-speaking country", () => {
    expect(firstPoint("JO")).toBe(`${t.steps.translateArabic} ${t.steps.translateEnglish}`);
  });

  it("adds Hebrew and Arabic when the country isn't known", () => {
    expect(firstPoint(null)).toBe(`${t.steps.translateHebrewArabic} ${t.steps.translateEnglish}`);
  });
});

describe("a legalization's full text", () => {
  const legalization = (from: string, chain?: ("englishTranslation" | "foreignMinistry" | "israeliConsulate")[]) =>
    stepText(
      { kind: "authenticate", from, certification: { authentication: "legalization" }, ...(chain && { chain }) },
      "foreignBirthCertificate",
      t,
      "en",
    );

  it("numbers the country's own offices, after the issuing office", () => {
    const { text, details } = legalization("TH", ["englishTranslation", "foreignMinistry", "israeliConsulate"]);
    expect(text).toBe("Consular legalization in Thailand");
    expect(details).toMatchObject({ lead: t.steps.legalizationLead, numbered: true });
    expect(details?.points).toEqual([
      "The office that issued it",
      "A certified translation into English (unless it's in English already)",
      "The foreign ministry",
      "The Israeli embassy",
    ]);
    expect(details?.end).toBe("It can only be done in Thailand, not in Israel.");
  });

  it("numbers the usual offices for a country whose own aren't known", () => {
    const { details } = legalization("EG");
    expect(details?.lead).toBe(t.steps.legalizationUsualLead);
    expect(details?.points).toEqual([
      "The office that issued it",
      "The ministry of justice",
      "The foreign ministry",
      "The Israeli embassy",
    ]);
  });
});

describe("a legalization's offices", () => {
  it("are named in both languages, each of them", () => {
    for (const messages of [en, he]) expect(Object.keys(messages.app.documentsPage.steps.chain).sort()).toEqual([...chainLinks].sort());
  });
});

describe("AS/6's signing line", () => {
  const sign = (points: Parameters<typeof stepText>[4]) =>
    stepText({ kind: "sign", before: "lawyer" }, "statusApplicationMarried", t, "en", points).text;

  it("has both declarations signed, when both partners sign now", () => {
    expect(sign(["as6Application", "as6IsraeliDeclaration", "as6ForeignDeclaration"])).toBe(
      t.steps.signingFor.statusApplicationMarried,
    );
  });

  it("has only the Israeli partner's signed, while the foreign partner's waits", () => {
    expect(sign(["as6Application", "as6IsraeliDeclaration", "as6ForeignDeclarationLater"])).toBe(
      t.steps.signingFor.statusApplicationMarriedForeignLater,
    );
  });
});
