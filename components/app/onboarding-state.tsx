"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { BranchCode, Gender, MaritalStatus, Stage } from "@/lib/case-options";

// The onboarding answers, held in the onboarding layout. The layout stays
// mounted while the steps change the URL, so browser back and forward keep the
// answers. A refresh starts over: nothing is saved before the last step.

export type PersonAnswers = {
  name: string;
  gender: Gender | null;
  isIsraeli: boolean | null;
  nationality: string;
  maritalStatus: MaritalStatus | null;
  hasChildren: boolean;
};

export type Answers = {
  self: PersonAnswers;
  partner: PersonAnswers;
  branch: BranchCode | "";
  stage: Stage | null;
};

type OnboardingState = {
  answers: Answers;
  setAnswers: Dispatch<SetStateAction<Answers>>;
  /** The furthest step the user got to. Later steps send them back to the first. */
  reached: number;
  setReached: Dispatch<SetStateAction<number>>;
};

const emptyPerson: PersonAnswers = {
  name: "",
  gender: null,
  isIsraeli: null,
  nationality: "",
  maritalStatus: null,
  hasChildren: false,
};

const Context = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Answers>({
    self: emptyPerson,
    partner: emptyPerson,
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
