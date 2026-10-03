import { describe, expect, it } from "vitest";
import type { CaseDetails } from "./case-options";
import { scenarios } from "./documents/scenarios";
import { awaitingDecision, onboardingTrack, parseStageDate, sameTrack, trackOf } from "./stages";

const { relationship, people } = scenarios.marriedInCyprus;
const married: CaseDetails = { relationship, israeli: people[0], foreign: people[1] };
const commonLaw: CaseDetails = {
  ...married,
  relationship: { ...relationship, relationship: "commonLaw", marriagePlace: null, marriageCountry: null },
};
const partnerAbroad = (c: CaseDetails): CaseDetails => ({ ...c, foreign: { ...c.foreign, location: "abroad" } });
const bothAbroad = (c: CaseDetails): CaseDetails => ({
  ...partnerAbroad(c),
  israeli: { ...c.israeli, residence: "abroad" },
});

describe("trackOf", () => {
  it("gives a married couple the B/1 before the interview, and ends at A/5", () => {
    expect(trackOf(married)).toEqual([
      "preparing",
      "filed",
      "firstAppointment",
      "b1",
      "interview",
      "approvedA5",
    ]);
  });

  it("gives a common-law couple the interview before the B/1, and ends there", () => {
    expect(trackOf(commonLaw)).toEqual([
      "preparing",
      "filed",
      "firstAppointment",
      "interview",
      "approvedB1",
    ]);
  });

  it("waits for the entry permit after the first appointment when the partner is abroad", () => {
    expect(trackOf(partnerAbroad(commonLaw)).slice(0, 6)).toEqual([
      "preparing",
      "filed",
      "firstAppointment",
      "entryPermit",
      "arrived",
      "interview",
    ]);
  });

  it("starts at the consulate when both live abroad, and files after arriving", () => {
    expect(trackOf(bothAbroad(married)).slice(0, 6)).toEqual([
      "consulate",
      "entryPermit",
      "arrived",
      "filed",
      "firstAppointment",
      "b1",
    ]);
  });

  it("adds Nativ for a partner from the former USSR, before the interview", () => {
    const ukrainian = { ...commonLaw, foreign: { ...commonLaw.foreign, nationality: "UA", birthCountry: "UA" } };
    expect(trackOf(ukrainian).slice(3, 5)).toEqual(["nativ", "interview"]);
    const bornInRussia = { ...married, foreign: { ...married.foreign, birthCountry: "RU" } };
    expect(trackOf(bornInRussia).slice(3, 5)).toEqual(["b1", "nativ"]);
  });

  it("never lists a stage twice", () => {
    for (const c of [married, commonLaw, partnerAbroad(married), bothAbroad(commonLaw)]) {
      const track = trackOf(c);
      expect(new Set(track).size).toBe(track.length);
    }
  });

  it("tells tracks apart", () => {
    expect(sameTrack(trackOf(married), trackOf(married))).toBe(true);
    expect(sameTrack(trackOf(married), trackOf(commonLaw))).toBe(false);
  });
});

describe("onboardingTrack", () => {
  it("leaves out the approval", () => {
    expect(onboardingTrack(commonLaw)).toEqual(["preparing", "filed", "firstAppointment", "interview"]);
  });
});

describe("parseStageDate", () => {
  const today = new Date("2026-09-28T12:00:00Z");

  it("takes a real calendar date", () => {
    expect(parseStageDate("filed", "2026-09-01", today)).toBe("2026-09-01");
    expect(parseStageDate("filed", "2026-02-30", today)).toBeNull();
    expect(parseStageDate("filed", "01/09/2026", today)).toBeNull();
  });

  it("allows a past date up to today in Israel, never later", () => {
    expect(parseStageDate("filed", "2026-09-29", today)).toBe("2026-09-29");
    expect(parseStageDate("filed", "2026-10-05", today)).toBeNull();
  });

  it("allows an appointment or interview ahead, within two years", () => {
    expect(parseStageDate("interview", "2027-03-01", today)).toBe("2027-03-01");
    expect(parseStageDate("firstAppointment", "2030-01-01", today)).toBeNull();
  });
});

describe("awaitingDecision", () => {
  it("waits for the decision once the interview's date has passed", () => {
    const dates = { interview: "2026-10-01" };
    expect(awaitingDecision("interview", dates, "2026-10-01")).toBe(false);
    expect(awaitingDecision("interview", dates, "2026-10-02")).toBe(true);
    expect(awaitingDecision("approvedB1", dates, "2026-10-02")).toBe(false);
    expect(awaitingDecision("interview", {}, "2026-10-02")).toBe(false);
  });
});
