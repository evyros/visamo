import { describe, expect, it } from "vitest";
import en from "../i18n/messages/en.json";
import he from "../i18n/messages/he.json";
import { chainLinks } from "./documents/countries";
import { stepsInWords, stepText } from "./document-steps";
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
    const { label, text, details } = legalization("TH", ["englishTranslation", "foreignMinistry", "israeliConsulate"]);
    expect(label).toBe("Consular legalization");
    expect(text).toBe("In Thailand");
    expect(details).toMatchObject({ lead: t.steps.legalizationLead, numbered: true });
    expect(details?.points).toEqual([
      "A district office (สำนักงานเขต or ที่ว่าการอำเภอ)",
      "A certified translation into English (unless it's in English already)",
      "The foreign ministry",
      "The Israeli embassy",
    ]);
    expect(details?.end).toBe("It can only be done in Thailand, not in Israel.");
  });

  it("goes on through the third country, where Israel has no embassy", () => {
    const step = {
      kind: "authenticate" as const,
      from: "CU",
      certification: { authentication: "legalization" as const },
      chain: ["ministryOfJustice", "viaEmbassy", "viaForeignMinistry", "viaIsraeliConsulate"] as const,
      via: "CA",
    };
    const { text, details } = stepText(step, "foreignBirthCertificate", t, "en");
    expect(text).toBe("In Cuba, through Canada");
    expect(details?.points).toEqual([
      "The civil registry (Registro Civil)",
      "The ministry of justice",
      "The embassy of Canada in Cuba",
      "The foreign ministry of Canada",
      "The Israeli embassy in Canada",
    ]);
    expect(details?.end).toBe("Israel has no embassy in Cuba, so the chain goes on through Canada. None of it can be done in Israel.");
    expect(stepsInWords([step], "foreignBirthCertificate", t)).toBe(
      "1. Consular legalization: In Cuba, through Canada, in this order: the ministry of justice, then the embassy of Canada in Cuba, then the foreign ministry of Canada, then the Israeli embassy in Canada",
    );
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

describe("AS/6's signing lines", () => {
  const sign = (points: NonNullable<Parameters<typeof stepText>[4]>["points"]) =>
    stepText({ kind: "sign", before: "lawyer" }, "statusApplicationMarried", t, "en", { points, israeli: "Evy" });

  it("has both declarations signed, when both partners sign now", () => {
    expect(sign(["as6Application", "as6IsraeliDeclaration", "as6ForeignDeclaration"])).toEqual({
      label: t.steps.labels.sign,
      text: t.steps.signingFor.statusApplicationMarried.text,
      details: { lead: t.steps.signingFor.statusApplicationMarried.details },
    });
  });

  it("has only the Israeli partner's signed, by name, when the foreign partner's is a document of its own", () => {
    expect(sign(["as6Application", "as6IsraeliDeclaration"])).toEqual({
      label: t.steps.labels.sign,
      text: "Evy's declaration (הצהרת בן הזוג המזמין), in front of an Israeli lawyer",
      details: { lead: t.steps.signingFor.statusApplicationMarriedIsraeliOnly.details },
    });
  });

  it("has the landlord's affidavit signed on a line of its own", () => {
    expect(stepText({ kind: "sign", before: "lawyer", by: "landlord" }, "statusApplicationMarried", t, "en")).toEqual({
      label: t.steps.labels.sign,
      text: t.steps.signingFor.landlordAffidavit.text,
      details: { lead: t.steps.signingFor.landlordAffidavit.details },
    });
  });
});

describe("a signature", () => {
  it("names who confirms it on its line, and how in its full text, for every signer, in both languages", () => {
    for (const messages of [en, he]) {
      const s = messages.app.documentsPage.steps;
      expect(Object.keys(s.signingDetails).sort()).toEqual(Object.keys(s.signing).sort());
    }
    for (const before of ["clerk", "lawyer", "lawyerCourtOrNotary", "notary", "consul"] as const) {
      expect(stepText({ kind: "sign", before }, "otherParentConsent", t, "en"), before).toEqual({
        label: t.steps.labels.sign,
        text: t.steps.signing[before],
        details: { lead: t.steps.signingDetails[before] },
      });
    }
  });

  it("gives the chat and the check its full text too", () => {
    expect(stepsInWords([{ kind: "sign", before: "lawyerCourtOrNotary" }], "otherParentConsent", t)).toBe(
      `1. ${t.steps.signingSentence.lawyerCourtOrNotary}: ${t.steps.signingDetails.lawyerCourtOrNotary}`,
    );
  });

  it("names the foreign partner as the only one who signs the children affidavit", () => {
    const { text, details } = stepText({ kind: "sign", before: "lawyerCourtOrNotary" }, "previousChildrenAffidavit", t, "en", { foreign: "Liz", israeli: "Evy" });
    expect(text).toBe("Only by Liz, in front of a lawyer or notary");
    expect(details?.lead).toContain("checks Liz's identity");
    expect(details?.lead).toContain("Evy doesn't sign it.");
  });
});

describe("the foreign partner's signature by email", () => {
  it("names them, on the line and in its full text", () => {
    const { label, text, details } = stepText({ kind: "signByEmail" }, "statusApplicationMarried", t, "en", { foreign: "Liz", israeli: "Evy" });
    expect(label).toBe(t.steps.labels.sign);
    expect(text).toBe("By Liz, on the applicants' declaration (הצהרת המבקשים)");
    expect(details?.lead).toMatch(/^Only page 3 of the form\./);
    expect(details?.lead).toContain("Liz can send it by email, so Evy can file the application");
    expect(details?.lead).toContain("Liz's own declaration");
  });
});

describe("an affidavit in the chat's and the check's view", () => {
  it("says who confirms it, which the line alone doesn't", () => {
    expect(stepsInWords([{ kind: "affidavit" }], "foreignCivilStatus", t)).toBe(
      `1. ${t.steps.labels.affidavit}: ${t.steps.affidavit}. ${t.steps.affidavitDetails}`,
    );
    // With what the country has first, then who confirms it.
    expect(stepsInWords([{ kind: "affidavit", from: "IN" }], "foreignCivilStatus", t)).toBe(
      `1. ${t.steps.labels.affidavit}: ${t.steps.affidavit}. ${t.issuers.foreignCivilStatus.IN.details} ${t.steps.affidavitDetails}`,
    );
  });
});

describe("a signature in the chat's and the check's view", () => {
  it("is the whole requirement in one sentence, as before the titles, for every signer, in both languages", () => {
    for (const messages of [en, he]) {
      const s = messages.app.documentsPage.steps;
      expect(Object.keys(s.signingSentence).sort()).toEqual(Object.keys(s.signing).sort());
      for (const own of Object.values(s.signingFor)) expect(own.sentence).toBeTruthy();
    }
    expect(stepsInWords([{ kind: "sign", before: "lawyer" }], "foreignDeclarationMarried", t)).toBe(
      `1. Must be signed in front of an Israeli lawyer: ${t.steps.signingFor.foreignDeclarationMarried.details}`,
    );
    expect(stepsInWords([{ kind: "signByEmail" }], "statusApplicationMarried", t, { foreign: "Liz", israeli: "Evy" })).toMatch(
      /^1\. Liz signs the applicants' declaration \(הצהרת המבקשים\): Only page 3 of the form\./,
    );
  });
});

describe("a step's title", () => {
  const titleOf = (step: Parameters<typeof stepText>[0]) => stepText(step, "foreignCivilStatus", t, "en").label;

  it("says what the step is, by its kind", () => {
    expect(titleOf({ kind: "obtain", from: "DE" })).toBe(t.steps.labels.obtain);
    expect(titleOf({ kind: "send" })).toBe(t.steps.labels.send);
    expect(titleOf({ kind: "translate", level: "notarized", from: "DE" })).toBe(t.steps.labels.translate);
    expect(titleOf({ kind: "affidavit" })).toBe(t.steps.labels.affidavit);
  });

  it("names the certification the country uses, or both when it isn't known", () => {
    expect(titleOf({ kind: "authenticate", from: "DE", certification: { authentication: "apostille" } })).toBe(t.steps.labels.apostille);
    expect(titleOf({ kind: "authenticate", from: "utah", certification: { authentication: "utahApostille" } })).toBe(t.steps.labels.apostille);
    expect(titleOf({ kind: "authenticate", from: "EG", certification: { authentication: "legalization" } })).toBe(t.steps.labels.legalization);
    expect(titleOf({ kind: "authenticate", from: null, certification: { authentication: "dependsOnCountry" } })).toBe(t.steps.labels.certification);
  });

  it("starts the line with a capital, where it's the office's name", () => {
    expect(stepText({ kind: "obtain", from: "DE" }, "foreignCivilStatus", t, "en").text).toBe(
      "The citizens' office (Bürgeramt) where they're registered",
    );
  });

  it("is written in both languages, each of them", () => {
    expect(Object.keys(he.app.documentsPage.steps.labels).sort()).toEqual(Object.keys(t.steps.labels).sort());
  });
});
