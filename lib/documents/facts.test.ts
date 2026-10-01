import { describe, expect, it } from "vitest";
import { profileOf } from "./facts";
import { scenarios } from "./scenarios";

describe("profileOf", () => {
  it("finds the Israeli side and the foreign partner in either order", () => {
    expect(profileOf(scenarios.foreignFirst)).toEqual(profileOf(scenarios.marriedInCyprus));
  });

  it("rejects a case without one of each", () => {
    const [israeli] = scenarios.marriedInCyprus.people;
    expect(() => profileOf({ ...scenarios.marriedInCyprus, people: [israeli, israeli] })).toThrow();
  });

  it("tells the ways of marrying apart", () => {
    const place = (s: keyof typeof scenarios) => {
      const f = profileOf(scenarios[s]).facts;
      return { israel: f.marriedInIsrael, abroad: f.marriedAbroad, online: f.marriedOnline };
    };
    expect(place("marriedInIsrael")).toEqual({ israel: true, abroad: false, online: false });
    expect(place("marriedInCyprus")).toEqual({ israel: false, abroad: true, online: false });
    expect(place("marriedOnline")).toEqual({ israel: false, abroad: false, online: true });
    expect(place("commonLawLivingTogether")).toEqual({ israel: false, abroad: false, online: false });
  });

  it("keeps the marriage country only for a marriage abroad", () => {
    expect(profileOf(scenarios.marriedInCyprus).countries.marriageCountry).toBe("CY");
    expect(profileOf(scenarios.marriedOnline).countries.marriageCountry).toBeNull();
  });

  it("asks every couple, married or not, whether they live or lived together", () => {
    expect(profileOf(scenarios.marriedInCyprus).facts.livingTogether).toBe(true);
    expect(profileOf(scenarios.marriedNeverLivedTogether).facts.livingTogether).toBe(false);
    expect(profileOf(scenarios.commonLawApart).facts.livingTogether).toBe(false);
  });

  it("knows when the Israeli partner lives abroad too", () => {
    const f = profileOf(scenarios.bothAbroad).facts;
    expect([f.israeliAbroad, f.israeliInIsrael, f.foreignAbroad]).toEqual([true, false, true]);
    const g = profileOf(scenarios.foreignAbroad).facts;
    expect([g.israeliAbroad, g.israeliInIsrael]).toEqual([false, true]);
  });

  it("finds the former USSR by birth, not only by nationality", () => {
    expect(profileOf(scenarios.bornInUSSRWithGermanNationality).facts.foreignFromFormerUSSR).toBe(true);
    expect(profileOf(scenarios.marriedInCyprus).facts.foreignFromFormerUSSR).toBe(false);
  });

  it("finds the former USSR and the security check by nationality or birth, not by residence", () => {
    expect(profileOf(scenarios.fromUkraine).facts.foreignNeedsSecurityCheck).toBe(true);
    expect(profileOf(scenarios.bornInUSSRWithGermanNationality).facts.foreignNeedsSecurityCheck).toBe(true);
    expect(profileOf(scenarios.marriedInCyprus).facts.foreignNeedsSecurityCheck).toBe(false);
    // Lived in India and Thailand: neither fact comes from countries lived in.
    const lived = profileOf(scenarios.livedInThreeCountries).facts;
    expect([lived.foreignFromFormerUSSR, lived.foreignNeedsSecurityCheck]).toEqual([false, false]);
  });

  it("counts both endings for someone divorced and widowed", () => {
    const f = profileOf(scenarios.bothPreviouslyMarried).facts;
    expect([f.foreignDivorced, f.foreignWidowed, f.israeliDivorced, f.israeliWidowed]).toEqual([true, true, false, true]);
  });

  it("asks for police certificates from the nationality and every country lived in", () => {
    expect(profileOf(scenarios.livedInThreeCountries).countries.police).toEqual(["FR", "GB", "TH", "IN"]);
  });

  it("has no other-parent facts when no children are moving", () => {
    const f = profileOf(scenarios.childrenStayingBehind).facts;
    expect([f.childrenMoving, f.otherParentInvolved, f.otherParentCourtOrder, f.otherParentDeceased]).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  it("tells where the foreign partner is", () => {
    const at = (s: keyof typeof scenarios) => {
      const f = profileOf(scenarios[s]).facts;
      return { inIsrael: f.foreignInIsrael, withoutVisa: f.foreignInIsraelWithoutVisa, abroad: f.foreignAbroad };
    };
    expect(at("marriedInCyprus")).toEqual({ inIsrael: true, withoutVisa: false, abroad: false });
    expect(at("foreignWithoutVisa")).toEqual({ inIsrael: true, withoutVisa: true, abroad: false });
    expect(at("foreignAbroad")).toEqual({ inIsrael: false, withoutVisa: false, abroad: true });
  });
});
