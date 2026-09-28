"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type {
  BranchCode,
  Gender,
  IsraeliStatus,
  Location,
  MarriagePlace,
  OtherParent,
  PreviousMarriages,
  Relationship,
  RENEWAL,
  Stage,
} from "@/lib/case-options";

// The onboarding answers, held in the onboarding layout. The layout stays
// mounted while the steps change the URL, so browser back and forward keep the
// answers. A refresh starts over: nothing is saved before the last step.

/** The questions that depend on whether the person is the Israeli side or the foreign partner. */
type RoleAnswers = {
  // The foreign partner's.
  nationality: string;
  /** Born in the country of their nationality; the birth country is asked only when not. */
  bornInNationality: boolean | null;
  birthCountry: string;
  /** Lived in another country besides the nationality. */
  livedElsewhere: boolean | null;
  /** Empty strings are rows not chosen yet. */
  countriesLived: string[];
  location: Location | null;
  nameChanged: boolean | null;
  hasChildren: boolean | null;
  childrenMoving: boolean | null;
  otherParents: OtherParent[];
  // The Israeli side's.
  israeliStatus: IsraeliStatus | null;
  livedAbroad: boolean | null;
};

export type PersonAnswers = RoleAnswers & {
  name: string;
  gender: Gender | null;
  /** The Israeli side, a citizen or a permanent resident. Asked of the user; the partner's is the opposite. */
  isIsraeli: boolean | null;
  previousMarriages: PreviousMarriages | null;
};

export type RelationshipAnswers = {
  relationship: Relationship | null;
  marriagePlace: MarriagePlace | null;
  marriageCountry: string;
  livingTogether: boolean | null;
  /** A year, or "" before one is chosen. */
  togetherSince: string;
  childrenTogether: boolean | null;
};

export type Answers = {
  self: PersonAnswers;
  partner: PersonAnswers;
  relationship: RelationshipAnswers;
  /** Whether they know their branch; the branch list shows only if they do. */
  knowsBranch: boolean | null;
  branch: BranchCode | "";
  /** Renewal can be chosen, but it stops the wizard: not supported yet. */
  stage: Stage | typeof RENEWAL | null;
};

type OnboardingState = {
  answers: Answers;
  setAnswers: Dispatch<SetStateAction<Answers>>;
  /** The furthest step the user got to. Later steps send them back to the first. */
  reached: number;
  setReached: Dispatch<SetStateAction<number>>;
};

/** Role answers not given yet. Swapping roles resets both people to these. */
export const emptyRole: RoleAnswers = {
  nationality: "",
  bornInNationality: null,
  birthCountry: "",
  livedElsewhere: null,
  countriesLived: [],
  location: null,
  nameChanged: null,
  hasChildren: null,
  childrenMoving: null,
  otherParents: [],
  israeliStatus: null,
  livedAbroad: null,
};

const emptyPerson: PersonAnswers = {
  ...emptyRole,
  name: "",
  gender: null,
  isIsraeli: null,
  previousMarriages: null,
};

const Context = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Answers>({
    self: emptyPerson,
    partner: emptyPerson,
    relationship: {
      relationship: null,
      marriagePlace: null,
      marriageCountry: "",
      livingTogether: null,
      togetherSince: "",
      childrenTogether: null,
    },
    knowsBranch: null,
    branch: "",
    stage: null,
  });
  const [reached, setReached] = useState(0);
  return <Context value={{ answers, setAnswers, reached, setReached }}>{children}</Context>;
}

export function useOnboarding() {
  const state = useContext(Context);
  if (!state) throw new Error("useOnboarding needs an OnboardingProvider");
  return state;
}
