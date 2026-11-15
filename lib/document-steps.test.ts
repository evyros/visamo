import { describe, expect, it } from "vitest";
import en from "../i18n/messages/en.json";
import he from "../i18n/messages/he.json";
import { readFileSync } from "node:fs";
import { chainLinks } from "./documents/countries";
import { COUNTRY_LANGUAGES, NOTARY_LANGUAGES } from "./documents/languages";
import { stepsInWords, stepText } from "./document-steps";
import type { Issuer } from "./documents/certification";
import type { English } from "./documents/issuers";
import type { Step } from "./documents/steps";

const t = en.app.documentsPage;
type Translate = Extract<Step, { kind: "translate" }>;
const translation = (from: Issuer, english?: English, locale: "en" | "he" = "en") =>
  stepText(
    { kind: "translate", level: "notarized", from, ...(english && { english }) } as Translate,
    "foreignPoliceCertificate",
    (locale === "en" ? t : he.app.documentsPage) as typeof t,
    locale,
  );
const inWords = (from: Issuer, english?: English) =>
  stepsInWords([{ kind: "translate", level: "notarized", from, ...(english && { english }) } as Translate], "foreignPoliceCertificate", t);

describe("a notarized translation, by the language the country's documents are assumed to be in", () => {
  it("names a language a notary in Israel knows, with its steps, then what to do in any other", () => {
    const { text, details } = translation("DE");
    expect(text).toBe("By a notary in Israel, if it's in German");
    expect(details?.lead).toBe("Done in Israel, by a notary who knows German:");
    expect(details?.numbered).toBe(true);
    expect(details?.points).toEqual([
      "The notary translates it into Hebrew themselves, and the apostille too, unless that's in English.",
      t.steps.translateUpload,
    ]);
    expect(details?.otherwise?.points).toEqual([t.steps.translateOtherEnglish, t.steps.translateOtherAbroad]);
  });

  it("is made abroad, into English, with an apostille of its own, for a language none knows", () => {
    const { text, details } = translation("EE");
    expect(text).toBe("Abroad, into English, if it's in Estonian");
    expect(details?.lead).toBe("No notary in Israel translates Estonian, so it's done abroad:");
    expect(details?.points).toEqual([expect.stringContaining("into English"), t.steps.translateAbroadOwnApostille, t.steps.translateUpload]);
    expect(details?.end).toBe(t.steps.translateAbroadEnd);
    expect(details?.otherwise?.points).toEqual([t.steps.translateOtherEnglish, t.steps.translateOtherNotary]);
    expect(inWords("EE")).toContain("No notary in Israel translates Estonian");
    expect(inWords("EE")).not.toContain(t.steps.translateOtherNotary);
  });

  it("assumes the likely language of a country with no languages of its own listed", () => {
    expect(translation("TM").text).toBe("Abroad, into English, if it's in Turkmen");
    expect(translation("TM").details?.otherwise?.points).toContain(t.steps.translateOtherNotary);
  });

  it("names no language for the other languages, which would read as the country's own", () => {
    for (const locale of ["en", "he"] as const) {
      const words = JSON.stringify(translation("TH", undefined, locale));
      expect(words).not.toMatch(/Russian|רוסית/);
    }
  });

  it("certifies a translation made abroad like the document, or in the legalization, where the chain has one", () => {
    expect(translation("TH").details?.points).toEqual([t.steps.translateAbroadBeforeLegalization, t.steps.translateUpload]);
    expect(translation("KH").details?.points).toContain(t.steps.translateAbroadOwnLegalization);
    expect(translation("KH").details?.points?.[0]).toContain("the legalization too");
  });

  it("names all of a country's languages, when they're translated the same way", () => {
    expect(translation("CH").text).toBe("By a notary in Israel, if it's in German, French or Italian");
  });

  it("gives each language its part, when a country's languages are translated differently", () => {
    const { text, details } = translation("CA");
    expect(text).toBe(t.steps.translateByLanguageLine);
    expect(details?.parts?.map((part) => part.lead)).toEqual([t.steps.translateEnglishIn, "In French, by a notary in Israel:"]);
    expect(details?.otherwise?.points).toEqual([t.steps.translateOtherAbroad]);
    expect(translation("KG").details?.parts?.map((part) => part.lead)).toEqual([
      "In Russian, by a notary in Israel:",
      "In Kyrgyz, it's done abroad, since no notary in Israel translates it:",
    ]);
  });

  it("follows the notaries' list for the language the locale data calls otherwise (Norwegian)", () => {
    expect(translation("NO").text).toBe("By a notary in Israel, if it's in Norwegian");
  });

  it("assumes the language documents are issued in, not a spoken one", () => {
    expect(translation("PY").text).toBe(t.steps.translateByLanguageLine);
    expect(translation("PY").details?.parts?.[0]?.lead).toBe("In Spanish, by a notary in Israel:");
    expect(translation("SN").text).toBe("By a notary in Israel, if it's in French");
  });

  it("assumes no language for Hebrew or Arabic, which need none", () => {
    expect(translation("IL").text).toBe(t.steps.translateUnknownLine);
  });

  it("is usually not needed for a document in English", () => {
    for (const from of ["US", "utah", "GH"] as const) expect(translation(from).text).toBe(t.steps.translateEnglishLine);
    expect(translation("US").details).toEqual({
      lead: t.steps.translateEnglishSingle,
      otherwise: { heading: t.steps.translateOtherHeading, points: [t.steps.translateOtherNotary, t.steps.translateOtherAbroad] },
    });
  });

  it("asks for it in English first, where the country issues it in English, then by its language", () => {
    const { text, details } = translation("EE", "onRequest");
    expect(text).toBe(t.steps.translateInEnglishLine);
    expect(details?.lead).toBe(t.steps.translateInEnglishAsk);
    expect(details?.parts?.map((part) => part.lead)).toEqual(["In Estonian, it's done abroad, since no notary in Israel translates it:"]);
    expect(details?.otherwise?.points).toEqual([t.steps.translateOtherNotary]);
    expect(inWords("EE", "onRequest")).toContain(t.steps.translateInEnglishAsk);
    expect(inWords("DK", "onRequest")).toContain("In Danish, by a notary in Israel:");
  });

  it("is usually not needed for a document that's always in English, whatever the country's language", () => {
    expect(translation("JP", "always").text).toBe(t.steps.translateEnglishLine);
    expect(inWords("JP", "always")).toContain(t.steps.translateEnglishLine);
    expect(inWords("JP", "always")).not.toContain("Japanese");
  });

  it("gives each language a line where the country isn't known, or speaks Arabic", () => {
    const routes = [t.steps.translateOtherEnglish, t.steps.translateAnyNotary, t.steps.translateOtherAbroad];
    expect(translation(null).text).toBe(t.steps.translateUnknownLine);
    expect(translation(null).details).toEqual({
      otherwise: { heading: t.steps.translateByLanguageHeading, points: [t.steps.translateHebrewArabic, ...routes], end: t.steps.translateUpload },
    });
    expect(translation("JO").text).toBe(t.steps.translateArabicLine);
    expect(translation("JO").details).toEqual({
      otherwise: { heading: t.steps.translateOtherHeading, points: routes, end: t.steps.translateUpload },
    });
    for (const from of [null, "JO"] as const) expect(inWords(from)).toContain(t.steps.translateAnyFull);
  });

  it("names the languages in Hebrew too", () => {
    expect(translation("CH", undefined, "he").text).toBe("אצל נוטריון בישראל, אם המסמך בגרמנית, צרפתית או איטלקית");
  });
});

describe("the languages notaries in Israel translate", () => {
  const knowledge = readFileSync(new URL("./knowledge/translation-languages.md", import.meta.url), "utf8");
  const names = new Intl.DisplayNames(["en"], { type: "language" });
  // A group's bullet in the knowledge: its languages, after the label, without the notes in brackets.
  const group = (label: string) => {
    const bullet = knowledge.split(`- **${label}`)[1]!.split(/\n- |\n\n/)[0]!;
    return bullet
      .replace(/\([^)]*\)/g, "")
      .split(":")
      .at(-1)!
      .split(",")
      .map((name) => name.replace(/[.*\s]+/g, " ").trim())
      .filter(Boolean)
      .sort();
  };

  it("are the knowledge's list, group by group", () => {
    const named = (codes: readonly string[]) => codes.map((code) => names.of(code)).sort();
    expect(named(NOTARY_LANGUAGES.many)).toEqual(group("Many notaries:"));
    expect(named(NOTARY_LANGUAGES.few)).toEqual(group("A few notaries,"));
    expect(named(NOTARY_LANGUAGES.oneOrTwo)).toEqual(group("Only one or two notaries"));
  });

  it("give every country's language a name", () => {
    for (const [country, languages] of Object.entries(COUNTRY_LANGUAGES))
      for (const language of languages!) expect(names.of(language), country).not.toBe(language);
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

  it("ends at the Israeli embassy in another country, where it serves the issuing one", () => {
    const step = {
      kind: "authenticate" as const,
      from: "TZ",
      certification: { authentication: "legalization" as const },
      chain: ["foreignMinistry", "israeliConsulate"] as const,
      mission: "KE",
    };
    const { text, details } = stepText(step, "foreignPoliceCertificate", t, "en");
    expect(text).toBe("In Tanzania, then in Kenya");
    expect(details?.points).toEqual([
      "The Forensic Bureau of the police's Criminal Investigation Department",
      "The foreign ministry",
      "The Israeli embassy in Kenya",
    ]);
    expect(details?.end).toBe("Israel has no embassy in Tanzania: its embassy in Kenya serves Tanzania. None of it can be done in Israel.");
    expect(stepsInWords([step], "foreignPoliceCertificate", t)).toBe(
      "1. Consular legalization: In Tanzania, then in Kenya, in this order: the foreign ministry, then the Israeli embassy in Kenya",
    );
    const hebrew = stepText(step, "foreignPoliceCertificate", he.app.documentsPage, "he");
    expect(hebrew.details?.points?.at(-1)).toBe("שגרירות ישראל בקניה");
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
