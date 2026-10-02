import type { OtherParent, PersonInput, RelationshipInput } from "../case-options";
import { FORMER_USSR, SECURITY_CHECK } from "./countries";

// The first layer: a couple's answers turned into named facts about the case.
// Conditions in the catalog read only these facts, never the answers, so the
// onboarding can change without touching the catalog. Anything tricky
// ("from the former USSR by birth, nationality or residence") is worked out
// here once, as its own fact, and tested on its own.

/** A case as the document list needs it: the relationship answers and both people, in any order. */
export type CaseSnapshot = {
  relationship: RelationshipInput;
  people: readonly [PersonInput, PersonInput];
};

export const facts = [
  // The relationship.
  "married",
  "commonLaw",
  "marriedInIsrael",
  "marriedAbroad",
  "marriedOnline",
  "livingTogether",
  "childrenTogether",
  // The Israeli side.
  "israeliCitizen",
  "israeliPermanentResident",
  "israeliInIsrael",
  "israeliAbroad",
  "israeliDivorced",
  "israeliWidowed",
  // The foreign partner.
  "foreignInIsrael",
  "foreignInIsraelWithoutVisa",
  "foreignAbroad",
  "foreignLivedElsewhere",
  "foreignFromFormerUSSR",
  "foreignNeedsSecurityCheck",
  "foreignNameChanged",
  "foreignDivorced",
  "foreignWidowed",
  "foreignHasChildren",
  // The foreign partner's children moving to Israel.
  "childrenMoving",
  "otherParentInvolved",
  "otherParentCourtOrder",
  "otherParentDeceased",
] as const;
export type Fact = (typeof facts)[number];

export type CaseProfile = {
  facts: Record<Fact, boolean>;
  /** Region codes the catalog's documents are issued by. */
  countries: {
    nationality: string;
    birthCountry: string;
    /** Null unless married abroad (not online). */
    marriageCountry: string | null;
    /**
     * Where the foreign partner needs a police certificate and a civil-status
     * document from: the nationality, then every other country lived in for 6
     * months in a row, or held a citizenship of (onboarding asks for both in one question).
     */
    police: string[];
  };
};

/** Throws on a case that isn't one Israeli side and one foreign partner: the parser never lets one through. */
export function profileOf({ relationship: r, people }: CaseSnapshot): CaseProfile {
  const israeli = people.find((p) => p.isIsraeli);
  const foreign = people.find((p) => !p.isIsraeli);
  if (!israeli || !foreign || !foreign.nationality || !foreign.birthCountry) {
    throw new Error("A case needs one Israeli side and one foreign partner");
  }
  const lived = foreign.countriesLived ?? [];
  const divorced = (p: PersonInput) => p.previousMarriages === "divorced" || p.previousMarriages === "divorcedAndWidowed";
  const widowed = (p: PersonInput) => p.previousMarriages === "widowed" || p.previousMarriages === "divorcedAndWidowed";
  const moving = !!foreign.childrenMoving;
  const otherParent = (o: OtherParent) => moving && !!foreign.otherParents?.includes(o);
  const married = r.relationship === "married";

  return {
    facts: {
      married,
      commonLaw: !married,
      marriedInIsrael: married && r.marriagePlace === "israel",
      marriedAbroad: married && r.marriagePlace === "abroad",
      marriedOnline: married && r.marriagePlace === "online",
      livingTogether: r.livingTogether,
      childrenTogether: r.childrenTogether,

      israeliCitizen: israeli.israeliStatus === "citizen",
      israeliPermanentResident: israeli.israeliStatus === "permanentResident",
      israeliInIsrael: israeli.residence === "israel",
      israeliAbroad: israeli.residence === "abroad",
      israeliDivorced: divorced(israeli),
      israeliWidowed: widowed(israeli),

      foreignInIsrael: foreign.location === "israelValid" || foreign.location === "israelInvalid",
      foreignInIsraelWithoutVisa: foreign.location === "israelInvalid",
      foreignAbroad: foreign.location === "abroad",
      foreignLivedElsewhere: lived.length > 0,
      // By nationality or birth, as the procedure refers them to Nativ (5.2.0008 §ד.4).
      foreignFromFormerUSSR: [foreign.nationality, foreign.birthCountry].some((c) => FORMER_USSR.has(c)),
      // By nationality only: Palestinian residents and citizens of Arab countries.
      foreignNeedsSecurityCheck: SECURITY_CHECK.has(foreign.nationality),
      foreignNameChanged: !!foreign.nameChanged,
      foreignDivorced: divorced(foreign),
      foreignWidowed: widowed(foreign),
      // Children from a previous relationship, moving to Israel or not.
      foreignHasChildren: !!foreign.hasChildren,

      childrenMoving: moving,
      // Alive, listed and without a sole-custody order: the ministry writes to them.
      otherParentInvolved: otherParent("consents"),
      otherParentCourtOrder: otherParent("courtOrder"),
      otherParentDeceased: otherParent("deceased"),
    },
    countries: {
      nationality: foreign.nationality,
      birthCountry: foreign.birthCountry,
      marriageCountry: married && r.marriagePlace === "abroad" ? r.marriageCountry : null,
      police: [foreign.nationality, ...lived],
    },
  };
}
