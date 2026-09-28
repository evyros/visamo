import { describe, expect, it } from "vitest";
import { buildDocumentList } from "./build";
import { scenarios } from "./scenarios";

const keys = (s: keyof typeof scenarios) => buildDocumentList(scenarios[s]).map((d) => d.key);
const find = (s: keyof typeof scenarios, key: string) => buildDocumentList(scenarios[s]).find((d) => d.key === key);

// What every couple in these scenarios needs, whatever their case.
const everyone = [
  "israeliAffidavit",
  "foreignAffidavit",
  "relationshipStory",
  "israeliId",
  "israeliPhotos",
  "foreignPassport",
  "foreignPhotos",
  "foreignBirthCertificate",
  "relationshipEvidence",
  "recommendationLetters",
  "foreignCivilStatus",
  "housingContract",
  "utilityBills",
  "governmentServices",
  "ishurToshav",
  "sharedFinances",
  "israeliIncomeProof",
  "foreignIncomeProof",
];

describe("buildDocumentList", () => {
  it("builds the whole list for a couple married abroad", () => {
    expect(keys("marriedInCyprus")).toEqual([
      "statusApplicationMarried",
      "israeliAffidavit",
      "foreignAffidavit",
      "relationshipStory",
      "israeliId",
      "israeliPhotos",
      "foreignPassport",
      "foreignPhotos",
      "foreignBirthCertificate",
      "marriageCertificateAbroad",
      "relationshipEvidence",
      "recommendationLetters",
      "foreignCivilStatus",
      "foreignPoliceCertificate:US",
      "housingContract",
      "utilityBills",
      "governmentServices",
      "ishurToshav",
      "sharedFinances",
      "israeliIncomeProof",
      "foreignIncomeProof",
    ]);
  });

  it("builds the whole list for common-law partners living together", () => {
    expect(keys("commonLawLivingTogether")).toEqual([
      "statusApplicationCommonLaw",
      "israeliAffidavit",
      "foreignAffidavit",
      "relationshipStory",
      "israeliId",
      "israeliPhotos",
      "foreignPassport",
      "foreignPhotos",
      "foreignBirthCertificate",
      "relationshipEvidence",
      "recommendationLetters",
      "jointLivingEvidence",
      "foreignCivilStatus",
      "foreignPoliceCertificate:US",
      "housingContract",
      "utilityBills",
      "governmentServices",
      "ishurToshav",
      "sharedFinances",
      "israeliIncomeProof",
      "foreignIncomeProof",
    ]);
  });

  it("gives every couple the documents everyone needs", () => {
    for (const name of Object.keys(scenarios) as (keyof typeof scenarios)[]) {
      expect(keys(name), name).toEqual(expect.arrayContaining(everyone));
    }
  });

  it("never repeats a key", () => {
    for (const name of Object.keys(scenarios) as (keyof typeof scenarios)[]) {
      const list = keys(name);
      expect(new Set(list).size, name).toBe(list.length);
    }
  });

  it("gives exactly one application form", () => {
    for (const name of Object.keys(scenarios) as (keyof typeof scenarios)[]) {
      const forms = keys(name).filter((k) => k.startsWith("statusApplication"));
      expect(forms, name).toHaveLength(1);
    }
  });

  it("needs the Israeli marriage certificate, uncertified, for a marriage in Israel", () => {
    const list = keys("marriedInIsrael");
    expect(list).toContain("marriageCertificateIsrael");
    expect(list).not.toContain("marriageCertificateAbroad");
    expect(find("marriedInIsrael", "marriageCertificateIsrael")?.certification).toEqual({
      authentication: "none",
      translation: false,
    });
  });

  it("certifies by the marriage country, or by Utah for an online marriage", () => {
    expect(find("marriedInCyprus", "marriageCertificateAbroad")?.certification?.authentication).toBe("apostille");
    expect(find("marriedInEgypt", "marriageCertificateAbroad")?.certification?.authentication).toBe("legalization");
    expect(find("marriedOnline", "marriageCertificateAbroad")?.certification).toEqual({
      authentication: "utahApostille",
      // In English: not accepted without a translation by law, though usually accepted in practice.
      translation: true,
    });
  });

  it("gives the marriage certificate its reason", () => {
    expect(find("marriedOnline", "marriageCertificateAbroad")?.because).toEqual(["marriedOnline"]);
  });

  it("asks for one police certificate per country, each certified by its country", () => {
    const police = buildDocumentList(scenarios.livedInThreeCountries).filter((d) => d.id === "foreignPoliceCertificate");
    expect(police.map((d) => [d.country, d.certification?.authentication])).toEqual([
      ["FR", "apostille"],
      ["GB", "apostille"],
      ["TH", "legalization"],
      ["IN", "apostille"],
    ]);
  });

  it("takes the birth certificate from the country of birth", () => {
    // Ukraine and Germany are both in the Apostille Convention; the birth country is what's checked.
    expect(find("bornInUSSRWithGermanNationality", "foreignBirthCertificate")?.certification?.authentication).toBe(
      "apostille",
    );
  });

  it("asks for the entry permit only from abroad, and the explanation only without a visa", () => {
    expect(keys("foreignAbroad")).toContain("entryPermitApplication");
    expect(keys("marriedInCyprus")).not.toContain("entryPermitApplication");
    expect(keys("foreignWithoutVisa")).toContain("foreignStayExplanation");
    expect(keys("marriedInCyprus")).not.toContain("foreignStayExplanation");
  });

  it("asks for the security CV only from the countries that need a security check", () => {
    expect(find("fromUkraine", "securityCv")?.because).toEqual(["foreignNeedsSecurityCheck"]);
    expect(keys("marriedInCyprus")).not.toContain("securityCv");
  });

  it("exempts a former-USSR birth certificate issued up to 1998 from authentication", () => {
    expect(find("fromUkraine", "foreignBirthCertificate")?.certification?.exemptIfIssuedUntil).toBe(1998);
    expect(find("marriedInCyprus", "foreignBirthCertificate")?.certification?.exemptIfIssuedUntil).toBeUndefined();
    // Only the birth certificate: the Ukrainian police certificate has no exemption.
    expect(find("fromUkraine", "foreignPoliceCertificate:UA")?.certification?.exemptIfIssuedUntil).toBeUndefined();
  });

  it("gives the number of copies where more than one is needed", () => {
    expect(find("marriedInCyprus", "foreignPhotos")?.copies).toBe(3);
    expect(find("marriedInCyprus", "israeliPhotos")?.copies).toBe(3);
    expect(find("marriedInCyprus", "foreignCivilStatus")?.copies).toBe(2);
    expect(find("marriedInCyprus", "foreignPassport")?.copies).toBeUndefined();
  });

  it("asks for each ending of a previous marriage", () => {
    expect(keys("bothPreviouslyMarried")).toEqual(
      expect.arrayContaining(["foreignDivorceDecree", "foreignSpouseDeathCertificate", "israeliSpouseDeathCertificate"]),
    );
    expect(keys("bothPreviouslyMarried")).not.toContain("israeliDivorceDecree");
  });

  it("asks for school records only when there are children in the household", () => {
    expect(find("childrenTogether", "childrenSchoolRecords")?.because).toEqual(["childrenTogether"]);
    expect(find("childrenMovingWithConsent", "childrenSchoolRecords")?.because).toEqual(["childrenMoving"]);
    expect(keys("childrenStayingBehind")).not.toContain("childrenSchoolRecords");
  });

  it("asks for children's documents only for children moving, by the other parent's situation", () => {
    const children = (s: keyof typeof scenarios) =>
      buildDocumentList(scenarios[s])
        .filter((d) => d.owner === "children")
        .map((d) => d.key);
    expect(children("childrenStayingBehind")).toEqual([]);
    expect(children("childrenMovingWithConsent")).toEqual([
      "childBirthCertificate",
      "childPassport",
      "childPoliceCertificate",
      "otherParentConsent",
      "otherParentAddress",
    ]);
    // No other parent the ministry can write to: sole custody, died, or not listed.
    expect(children("childrenMovingMixed")).toEqual([
      "childBirthCertificate",
      "childPassport",
      "childPoliceCertificate",
      "custodyOrder",
      "otherParentDeathCertificate",
    ]);
  });

  it("asks for living-together evidence only from common-law partners who live together", () => {
    expect(keys("commonLawApart")).not.toContain("jointLivingEvidence");
    expect(keys("marriedInCyprus")).not.toContain("jointLivingEvidence");
  });
});
