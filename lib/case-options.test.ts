import { describe, expect, it } from "vitest";
import { changedFields, parseDetails, type CaseDetails } from "./case-options";
import { scenarios } from "./documents/scenarios";

const { relationship, people } = scenarios.marriedInCyprus;
const current: CaseDetails = { relationship, israeli: people[0], foreign: people[1] };

describe("parseDetails", () => {
  it("takes the editable answers", () => {
    const next = parseDetails({ ...current, foreign: { ...current.foreign, location: "abroad" } }, current);
    expect(next?.foreign.location).toBe("abroad");
    expect(changedFields(current, next!)).toEqual(["foreign.location"]);
  });

  it("keeps who the people are, whatever the input says", () => {
    const input = {
      ...current,
      israeli: { ...current.israeli, name: "Someone Else", israeliStatus: "permanentResident" },
      foreign: { ...current.foreign, name: "Someone Else", nationality: "FR", birthCountry: "FR", gender: "female" },
    };
    expect(parseDetails(input, current)).toEqual(current);
  });

  it("changes the relationship answers, like where they married", () => {
    const married = { ...current.relationship, marriagePlace: "israel", marriageCountry: null };
    const next = parseDetails({ ...current, relationship: married }, current);
    expect(changedFields(current, next!)).toEqual(["relationship.marriagePlace", "relationship.marriageCountry"]);
  });

  it("rejects answers that don't fit together", () => {
    // Children moving without saying who the other parent is.
    const foreign = { ...current.foreign, hasChildren: true, childrenMoving: true, otherParents: null };
    expect(parseDetails({ ...current, foreign }, current)).toBeNull();
    // The nationality among the other countries lived in.
    expect(parseDetails({ ...current, foreign: { ...current.foreign, countriesLived: ["US"] } }, current)).toBeNull();
    expect(parseDetails({ relationship: current.relationship }, current)).toBeNull();
    // Every couple says whether they live or lived together, and the Israeli side where they live.
    expect(parseDetails({ ...current, relationship: { ...current.relationship, livingTogether: null } }, current)).toBeNull();
    expect(parseDetails({ ...current, israeli: { ...current.israeli, residence: null } }, current)).toBeNull();
  });
});
