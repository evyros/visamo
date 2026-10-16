import { describe, expect, it } from "vitest";
import { buildDocumentList } from "./build";
import { scenarios } from "./scenarios";

const keys = (s: keyof typeof scenarios) => buildDocumentList(scenarios[s]).map((d) => d.key);
const find = (s: keyof typeof scenarios, key: string) => buildDocumentList(scenarios[s]).find((d) => d.key === key);

// What every couple in these scenarios needs, whatever their case.
const everyone = [
  "relationshipStory",
  "israeliId",
  "israeliPhotos",
  "foreignPassport",
  "foreignPhotos",
  "foreignBirthCertificate",
  "relationshipEvidence",
  "messageHistory",
  "recommendationLetters",
  "israeliIncomeProof",
  "foreignIncomeProof",
];

describe("buildDocumentList", () => {
  it("builds the whole list for a couple married abroad", () => {
    expect(keys("marriedInCyprus")).toEqual([
      "statusApplicationMarried",
      "visaChangeApplication",
      "relationshipStory",
      "israeliId",
      "israeliPhotos",
      "foreignPassport",
      "foreignPhotos",
      "foreignBirthCertificate",
      "marriageCertificateAbroad",
      "relationshipEvidence",
      "messageHistory",
      "recommendationLetters",
      "jointLivingEvidence",
      "foreignCivilStatus:US",
      "foreignPoliceCertificate:US",
      "housingContract",
      "utilityBills",
      "governmentServices",
      "foreignHealthInsurance",
      "ishurToshav",
      "sharedBankAccount",
      "israeliIncomeProof",
      "foreignIncomeProof",
    ]);
  });

  it("builds the whole list for common-law partners living together", () => {
    expect(keys("commonLawLivingTogether")).toEqual([
      "visaChangeApplication",
      "affidavitCommonLaw",
      "relationshipStory",
      "israeliId",
      "israeliPhotos",
      "foreignPassport",
      "foreignPhotos",
      "foreignBirthCertificate",
      "relationshipEvidence",
      "messageHistory",
      "recommendationLetters",
      "jointLivingEvidence",
      "foreignCivilStatus:US",
      "foreignPoliceCertificate:US",
      "housingContract",
      "utilityBills",
      "governmentServices",
      "foreignHealthInsurance",
      "bankStatements",
      "israeliIncomeProof",
      "foreignIncomeProof",
    ]);
  });

  it("asks for health insurance only once the foreign partner is in Israel", () => {
    expect(keys("marriedInCyprus")).toContain("foreignHealthInsurance");
    expect(keys("foreignAbroad")).not.toContain("foreignHealthInsurance");
    expect(keys("commonLawApart")).not.toContain("foreignHealthInsurance");
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

  it("gives married couples their declarations in form AS/6, and common-law couples an affidavit together", () => {
    for (const name of Object.keys(scenarios) as (keyof typeof scenarios)[]) {
      const affidavits = keys(name).filter((k) => /affidavit/i.test(k));
      const married = scenarios[name].relationship.relationship === "married";
      expect(affidavits, name).toEqual(married ? [] : ["affidavitCommonLaw"]);
      const points = find(name, "statusApplicationMarried")?.points ?? [];
      if (married) expect(points.slice(0, 2), name).toEqual(["as6Application", "as6IsraeliDeclaration"]);
    }
  });

  it("gives married couples the AS/6 application, and common-law couples none of their own", () => {
    for (const name of Object.keys(scenarios) as (keyof typeof scenarios)[]) {
      const married = scenarios[name].relationship.relationship === "married";
      const forms = keys(name).filter((k) => k.startsWith("statusApplication"));
      expect(forms, name).toEqual(married ? ["statusApplicationMarried"] : []);
    }
  });

  it("needs the Israeli marriage certificate, uncertified, for a marriage in Israel", () => {
    const list = keys("marriedInIsrael");
    expect(list).toContain("marriageCertificateIsrael");
    expect(list).not.toContain("marriageCertificateAbroad");
    expect(find("marriedInIsrael", "marriageCertificateIsrael")?.certification).toEqual({ authentication: "none" });
  });

  it("certifies by the marriage country, or by Utah for an online marriage", () => {
    expect(find("marriedInCyprus", "marriageCertificateAbroad")?.certification?.authentication).toBe("apostille");
    expect(find("marriedInEgypt", "marriageCertificateAbroad")?.certification?.authentication).toBe("legalization");
    expect(find("marriedOnline", "marriageCertificateAbroad")?.certification).toEqual({
      authentication: "utahApostille",
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

  it("asks for proof of civil status from the same countries as the police certificate", () => {
    const civil = buildDocumentList(scenarios.livedInThreeCountries).filter((d) => d.id === "foreignCivilStatus");
    expect(civil.map((d) => [d.country, d.certification?.authentication])).toEqual([
      ["FR", "apostille"],
      ["GB", "apostille"],
      ["TH", "legalization"],
      // India issues none: an affidavit in its place, with no certification of its own.
      ["IN", undefined],
    ]);
  });

  it("takes the birth certificate from the country of birth", () => {
    // Ukraine and Germany are both in the Apostille Convention; the birth country is what's checked.
    expect(find("bornInUSSRWithGermanNationality", "foreignBirthCertificate")?.certification?.authentication).toBe(
      "apostille",
    );
  });

  it("asks for the entry permit only from a partner abroad whose Israeli partner lives in Israel", () => {
    expect(keys("foreignAbroad")).toContain("entryPermitApplication");
    expect(keys("marriedInCyprus")).not.toContain("entryPermitApplication");
    // Both abroad: the entry permit comes from the consulate, before the file.
    expect(keys("bothAbroad")).not.toContain("entryPermitApplication");
  });

  it("asks for proof of government services only when at least one of them lives in Israel", () => {
    expect(keys("foreignAbroad")).toContain("governmentServices");
    expect(find("foreignAbroad", "governmentServices")?.because).toEqual(["israeliInIsrael"]);
    expect(keys("bothAbroad")).not.toContain("governmentServices");
  });

  it("asks for the municipality confirmation only from married couples, when at least one of them lives in Israel", () => {
    expect(keys("foreignAbroad")).toContain("ishurToshav");
    expect(find("foreignAbroad", "ishurToshav")?.because).toEqual(["married", "israeliInIsrael"]);
    expect(keys("commonLawLivingTogether")).not.toContain("ishurToshav");
    expect(keys("bothAbroad")).not.toContain("ishurToshav");
    expect(keys("neverLivedTogetherBothAbroad")).not.toContain("ishurToshav");
  });

  it("asks for the security CV only from the countries that need a security check", () => {
    expect(find("fromJordan", "securityCv")?.because).toEqual(["foreignNeedsSecurityCheck"]);
    expect(keys("fromUkraine")).not.toContain("securityCv");
    expect(keys("marriedInCyprus")).not.toContain("securityCv");
  });

  it("exempts a former-USSR birth certificate issued up to 1998 from authentication", () => {
    expect(find("fromUkraine", "foreignBirthCertificate")?.certification?.exemptIfIssuedUntil).toBe(1998);
    expect(find("marriedInCyprus", "foreignBirthCertificate")?.certification?.exemptIfIssuedUntil).toBeUndefined();
    // Only the birth certificate: the Ukrainian police certificate has no exemption.
    expect(find("fromUkraine", "foreignPoliceCertificate:UA")?.certification?.exemptIfIssuedUntil).toBeUndefined();
  });

  it("takes the translation a document needs from the catalog, not from where it's issued", () => {
    expect(find("marriedInCyprus", "foreignBirthCertificate")?.translation).toBe("notarized");
    // In English: not accepted without a translation by law, though usually accepted in practice.
    expect(find("marriedOnline", "marriageCertificateAbroad")?.translation).toBe("notarized");
    // Their everyday documents: they translate them themselves.
    expect(find("marriedInCyprus", "jointLivingEvidence")?.translation).toBe("self");
    expect(find("marriedInCyprus", "israeliIncomeProof")?.translation).toBe("self");
    expect(find("marriedInCyprus", "recommendationLetters")?.translation).toBe("none");
    expect(find("marriedInIsrael", "marriageCertificateIsrael")?.translation).toBe("none");
    expect(find("marriedInCyprus", "israeliId")?.translation).toBe("none");
    expect(find("marriedInCyprus", "foreignPassport")?.translation).toBe("none");
  });

  it("lists what to do to a document, in order", () => {
    const kinds = (s: keyof typeof scenarios, key: string) => find(s, key)?.steps.map((step) => step.kind);
    // The originals are sent to Israel from the country that issued them, wherever the foreign partner is.
    expect(kinds("marriedInCyprus", "foreignBirthCertificate")).toEqual(["obtain", "authenticate", "send", "translate"]);
    expect(kinds("foreignAbroad", "foreignBirthCertificate")).toEqual(["obtain", "authenticate", "send", "translate"]);
    // Both abroad: they bring them when they move.
    expect(kinds("bothAbroad", "foreignBirthCertificate")).toEqual(["obtain", "authenticate", "translate"]);
    // Issued in Israel: nothing to do.
    expect(kinds("marriedInIsrael", "marriageCertificateIsrael")).toEqual([]);
    // From a country not known: certified if it's from abroad, but nothing to get or send.
    expect(kinds("commonLawForeignDivorced", "foreignDivorceDecree")).toEqual(["authenticate", "translate"]);
    expect(kinds("marriedInCyprus", "israeliIncomeProof")).toEqual(["translate"]);
    expect(kinds("marriedInCyprus", "statusApplicationMarried")).toEqual(["sign"]);
    expect(kinds("commonLawLivingTogether", "affidavitCommonLaw")).toEqual(["sign"]);
  });

  it("says which country a translation is from, when it's issued by one", () => {
    const translate = (s: keyof typeof scenarios, key: string) => find(s, key)?.steps.find((step) => step.kind === "translate");
    expect(translate("fromJordan", "foreignBirthCertificate")).toEqual({ kind: "translate", level: "notarized", from: "JO" });
    // From a country not known: null, so the card names Hebrew and Arabic too.
    expect(translate("commonLawForeignDivorced", "foreignDivorceDecree")).toEqual({ kind: "translate", level: "notarized", from: null });
    expect(translate("marriedInCyprus", "israeliIncomeProof")).toEqual({ kind: "translate", level: "self" });
  });

  it("follows how the country provides the civil status", () => {
    const kinds = (s: keyof typeof scenarios, key: string) =>
      find(s, key)?.steps.map((step) => (step.kind === "affidavit" ? `affidavit:${step.about}` : step.kind));
    // The US: a state's letter and the children's affidavit; one affidavit in their place if the letter can't be had.
    expect(kinds("marriedInCyprus", "foreignCivilStatus:US")).toEqual([
      "obtain",
      "authenticate",
      "send",
      "translate",
      "affidavit:noChildren",
    ]);
    expect(find("marriedInCyprus", "foreignCivilStatus:US")?.affidavitInstead).toBe(true);
    expect(find("livedInThreeCountries", "foreignCivilStatus:TH")?.affidavitInstead).toBe(false);
    // Thailand, a country lived in: the district office's certificate; the children only from the nationality.
    expect(kinds("livedInThreeCountries", "foreignCivilStatus:TH")).toEqual(["obtain", "authenticate", "send", "translate"]);
    // India issues none: an affidavit about the civil status in its place.
    expect(kinds("livedInThreeCountries", "foreignCivilStatus:IN")).toEqual(["affidavit:status", "translate"]);
    expect(find("livedInThreeCountries", "foreignCivilStatus:IN")?.affidavitInstead).toBe(false);
    // An affidavit in place of the document isn't certified like one.
    expect(find("livedInThreeCountries", "foreignCivilStatus:IN")?.certification).toBeNull();
  });

  it("names the legalization's offices where they're known for the country", () => {
    const authenticate = (key: string) =>
      find("livedInThreeCountries", key)?.steps.find((step) => step.kind === "authenticate");
    expect(authenticate("foreignPoliceCertificate:TH")).toMatchObject({
      from: "TH",
      certification: { authentication: "legalization" },
      chain: ["englishTranslation", "foreignMinistry", "israeliConsulate"],
    });
    const egypt = find("marriedInEgypt", "marriageCertificateAbroad")?.steps.find((step) => step.kind === "authenticate");
    expect(egypt).toMatchObject({ from: "EG", certification: { authentication: "legalization" } });
    expect(egypt).not.toHaveProperty("chain");
  });

  it("lists the lease for couples who lived together or whose Israeli partner lives in Israel, and with it, for married couples, the landlord's affidavit in form AS/6", () => {
    for (const name of Object.keys(scenarios) as (keyof typeof scenarios)[]) {
      const { relationship, people } = scenarios[name];
      const home = relationship.livingTogether || people.some((p) => p.residence === "israel");
      const married = relationship.relationship === "married";
      const landlord = find(name, "statusApplicationMarried")?.points.includes("as6LandlordAffidavit") ?? false;
      expect(landlord, name).toBe(home && married);
      const leases = keys(name).filter((k) => k === "housingContract" || k === "israeliHousingContract");
      expect(leases, name).toHaveLength(home ? 1 : 0);
    }
    // In both names, from the couple; or the Israeli partner's own home, from them.
    expect(find("marriedInCyprus", "housingContract")?.owner).toBe("couple");
    expect(keys("marriedInCyprus")).not.toContain("israeliHousingContract");
    expect(find("marriedNeverLivedTogether", "israeliHousingContract")?.owner).toBe("israeli");
    expect(find("marriedNeverLivedTogether", "israeliHousingContract")?.because).toEqual(["israeliInIsrael"]);
    expect(keys("marriedNeverLivedTogether")).not.toContain("housingContract");
  });

  it("lists the shared home's bills for couples who live together, and the Israeli partner's own otherwise", () => {
    expect(find("marriedInCyprus", "utilityBills")?.owner).toBe("couple");
    expect(keys("marriedInCyprus")).not.toContain("israeliUtilityBills");
    expect(find("marriedNeverLivedTogether", "israeliUtilityBills")?.owner).toBe("israeli");
    expect(keys("marriedNeverLivedTogether")).not.toContain("utilityBills");
    expect(keys("neverLivedTogetherBothAbroad")).not.toContain("utilityBills");
    expect(keys("neverLivedTogetherBothAbroad")).not.toContain("israeliUtilityBills");
  });

  it("gives the number of copies where more than one is needed", () => {
    expect(find("marriedInCyprus", "foreignPhotos")?.copies).toBe(3);
    expect(find("marriedInCyprus", "israeliPhotos")?.copies).toBe(3);
    expect(find("marriedInCyprus", "foreignCivilStatus:US")?.copies).toBe(2);
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

  it("asks for AS/3 from a partner in Israel, and AS/1 from one abroad", () => {
    expect(keys("marriedInCyprus")).toContain("visaChangeApplication");
    expect(keys("foreignAbroad")).not.toContain("visaChangeApplication");
    expect(keys("foreignWithoutVisa")).toContain("visaChangeApplication");
    expect(keys("commonLawLivingTogether")).toContain("visaChangeApplication");
  });

  it("asks married couples for the joint bank account confirmation, and common-law couples for bank statements", () => {
    expect(keys("marriedInCyprus")).toContain("sharedBankAccount");
    expect(keys("marriedInCyprus")).not.toContain("bankStatements");
    expect(keys("commonLawLivingTogether")).toContain("bankStatements");
    expect(keys("commonLawLivingTogether")).not.toContain("sharedBankAccount");
  });

  it("asks for living-together evidence from every couple who live or lived together, married or not", () => {
    expect(keys("marriedInCyprus")).toContain("jointLivingEvidence");
    expect(keys("commonLawLivingTogether")).toContain("jointLivingEvidence");
    expect(keys("commonLawApart")).not.toContain("jointLivingEvidence");
    expect(keys("marriedNeverLivedTogether")).not.toContain("jointLivingEvidence");
  });
});
