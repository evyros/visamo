import type { PersonInput, RelationshipInput } from "../case-options";
import type { CaseSnapshot } from "./facts";

// Example couples covering the cases the catalog tells apart. The tests check
// some of their lists exactly, and catalog.lock.json records every one, so
// any catalog change shows which couples it affects. Add a couple for each
// new kind of case; don't change an existing one to fit a new rule.

const israeli = (over: Partial<PersonInput> = {}): PersonInput => ({
  name: "Noa Levi",
  gender: "female",
  isIsraeli: true,
  israeliStatus: "citizen",
  previousMarriages: "none",
  nationality: null,
  birthCountry: null,
  countriesLived: null,
  location: null,
  nameChanged: null,
  hasChildren: null,
  childrenMoving: null,
  otherParents: null,
  residence: "israel",
  ...over,
});

const foreign = (over: Partial<PersonInput> = {}): PersonInput => ({
  name: "John Smith",
  gender: "male",
  isIsraeli: false,
  israeliStatus: null,
  previousMarriages: "none",
  nationality: "US",
  birthCountry: "US",
  countriesLived: [],
  location: "israelValid",
  nameChanged: false,
  hasChildren: false,
  childrenMoving: null,
  otherParents: null,
  residence: null,
  ...over,
});

const married = (over: Partial<RelationshipInput> = {}): RelationshipInput => ({
  relationship: "married",
  marriagePlace: "abroad",
  marriageCountry: "CY",
  livingTogether: true,
  togetherSince: 2021,
  childrenTogether: false,
  ...over,
});

const commonLaw = (over: Partial<RelationshipInput> = {}): RelationshipInput => ({
  relationship: "commonLaw",
  marriagePlace: null,
  marriageCountry: null,
  livingTogether: true,
  togetherSince: 2021,
  childrenTogether: false,
  ...over,
});

export const scenarios = {
  marriedInCyprus: { relationship: married(), people: [israeli(), foreign()] },
  marriedInIsrael: {
    relationship: married({ marriagePlace: "israel", marriageCountry: null }),
    people: [israeli(), foreign()],
  },
  marriedOnline: {
    relationship: married({ marriagePlace: "online", marriageCountry: null }),
    people: [israeli(), foreign()],
  },
  // Married in a country outside the Apostille Convention.
  marriedInEgypt: { relationship: married({ marriageCountry: "EG" }), people: [israeli(), foreign()] },
  commonLawLivingTogether: { relationship: commonLaw(), people: [israeli(), foreign()] },
  commonLawApart: {
    relationship: commonLaw({ livingTogether: false, togetherSince: null }),
    people: [israeli(), foreign({ location: "abroad" })],
  },
  // The foreign partner is the user, listed first.
  foreignFirst: { relationship: married(), people: [foreign(), israeli()] },
  bornInUSSRWithGermanNationality: {
    relationship: married(),
    people: [israeli(), foreign({ nationality: "DE", birthCountry: "UA" })],
  },
  // Needs the security check, and is from the former USSR by nationality.
  fromUkraine: {
    relationship: married(),
    people: [israeli(), foreign({ nationality: "UA", birthCountry: "UA" })],
  },
  livedInThreeCountries: {
    relationship: married(),
    people: [israeli(), foreign({ nationality: "FR", birthCountry: "FR", countriesLived: ["GB", "TH", "IN"] })],
  },
  foreignAbroad: { relationship: married(), people: [israeli(), foreign({ location: "abroad" })] },
  foreignWithoutVisa: { relationship: married(), people: [israeli(), foreign({ location: "israelInvalid" })] },
  foreignNameChanged: { relationship: married(), people: [israeli(), foreign({ nameChanged: true })] },
  bothPreviouslyMarried: {
    relationship: married(),
    people: [israeli({ previousMarriages: "widowed" }), foreign({ previousMarriages: "divorcedAndWidowed" })],
  },
  permanentResident: {
    relationship: married(),
    people: [israeli({ israeliStatus: "permanentResident" }), foreign()],
  },
  // Both live abroad, together.
  bothAbroad: {
    relationship: married(),
    people: [israeli({ residence: "abroad" }), foreign({ location: "abroad" })],
  },
  marriedNeverLivedTogether: {
    relationship: married({ livingTogether: false, togetherSince: null }),
    people: [israeli(), foreign({ location: "abroad" })],
  },
  // Never lived together, and the Israeli partner lives abroad too: no home in Israel to show.
  neverLivedTogetherBothAbroad: {
    relationship: married({ livingTogether: false, togetherSince: null }),
    people: [israeli({ residence: "abroad" }), foreign({ location: "abroad" })],
  },
  childrenStayingBehind: {
    relationship: married(),
    people: [israeli(), foreign({ hasChildren: true, childrenMoving: false })],
  },
  childrenMovingWithConsent: {
    relationship: married(),
    people: [israeli(), foreign({ hasChildren: true, childrenMoving: true, otherParents: ["consents"] })],
  },
  childrenMovingMixed: {
    relationship: married(),
    people: [
      israeli(),
      foreign({ hasChildren: true, childrenMoving: true, otherParents: ["courtOrder", "deceased", "notListed"] }),
    ],
  },
  childrenTogether: { relationship: married({ childrenTogether: true }), people: [israeli(), foreign()] },
} satisfies Record<string, CaseSnapshot>;

export type ScenarioName = keyof typeof scenarios;
