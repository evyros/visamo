import { describe, expect, it } from "vitest";
import { scenarios } from "../documents/scenarios";
import { detailsHash } from "./prompt";

// What retires a check result besides its files: the couple's own details, never the guidance.
describe("detailsHash", () => {
  const { relationship, people } = scenarios.marriedInCyprus;
  const details = { relationship, israeli: people[0], foreign: people[1] };

  it("stays the same while the couple's details do", () => {
    expect(detailsHash(details, "telAvivCenter")).toBe(detailsHash(structuredClone(details), "telAvivCenter"));
  });

  it("changes when their answers or their branch change", () => {
    const divorced = { ...details, foreign: { ...details.foreign, previousMarriages: "divorced" as const } };
    expect(detailsHash(divorced, "telAvivCenter")).not.toBe(detailsHash(details, "telAvivCenter"));
    expect(detailsHash(details, null)).not.toBe(detailsHash(details, "telAvivCenter"));
  });
});
