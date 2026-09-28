import { describe, expect, it } from "vitest";
import { evaluate, factsIn } from "./conditions";
import { facts, type Fact } from "./facts";

const only = (...on: Fact[]) => Object.fromEntries(facts.map((f) => [f, on.includes(f)])) as Record<Fact, boolean>;

describe("evaluate", () => {
  it("matches with no condition, for no reason", () => {
    expect(evaluate(undefined, only())).toEqual({ match: true, because: [] });
  });

  it("gives a true fact as the reason", () => {
    expect(evaluate("married", only("married"))).toEqual({ match: true, because: ["married"] });
    expect(evaluate("married", only())).toEqual({ match: false, because: [] });
  });

  it("needs every part of all, and gives all their reasons", () => {
    const c = { all: ["commonLaw", "livingTogether"] } as const;
    expect(evaluate(c, only("commonLaw", "livingTogether"))).toEqual({
      match: true,
      because: ["commonLaw", "livingTogether"],
    });
    expect(evaluate(c, only("commonLaw")).match).toBe(false);
  });

  it("needs one part of any, and gives only the parts that matched", () => {
    const c = { any: ["israeliLivedAbroad", "israeliPermanentResident"] } as const;
    expect(evaluate(c, only("israeliPermanentResident"))).toEqual({
      match: true,
      because: ["israeliPermanentResident"],
    });
    expect(evaluate(c, only()).match).toBe(false);
  });

  it("negates with not, without a reason", () => {
    expect(evaluate({ not: "marriedInIsrael" }, only())).toEqual({ match: true, because: [] });
    expect(evaluate({ not: "marriedInIsrael" }, only("marriedInIsrael")).match).toBe(false);
  });

  it("lists each reason once", () => {
    const c = { all: ["married", { any: ["married", "marriedAbroad"] }] } as const;
    expect(evaluate(c, only("married", "marriedAbroad")).because).toEqual(["married", "marriedAbroad"]);
  });
});

describe("factsIn", () => {
  it("finds facts at any depth", () => {
    expect(factsIn({ all: ["married", { not: { any: ["marriedOnline"] } }] })).toEqual(["married", "marriedOnline"]);
  });
});
