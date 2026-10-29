import type { BranchCode } from "./case-options";

// How busy each Misrad Hapnim branch is, so the chat can place a couple's
// waits within the ranges the knowledge base gives ("from 3 weeks to more
// than 4 months depending on the branch", lib/knowledge/process.md): toward
// the short end at a less busy branch, the long end at a busier one.
//
// From couples' reports in the AIC Facebook group, April to October 2026
// (collect/experiences: the busy index in aggregate.mjs, which weighs reports
// of overload and the waits couples gave against the national figures), with
// the product owner's placements where reports were few or none, or ran
// against what's known in practice. "unknown" where there's too little to tell.

export type BranchLoad = "lessBusy" | "typical" | "busier" | "unknown";

export const branchLoad: Record<BranchCode, BranchLoad> = {
  telAvivCenter: "busier",
  jerusalemCenter: "typical",
  jerusalemEast: "lessBusy",
  jerusalemSouth: "lessBusy",
  eilat: "typical",
  ashdod: "typical",
  ashkelon: "typical",
  beersheba: "typical",
  bneiBrak: "typical",
  ramatGanGivatayim: "busier",
  herzliya: "lessBusy",
  holon: "lessBusy",
  hadera: "busier",
  haifa: "lessBusy",
  afula: "unknown",
  tiberias: "unknown",
  kfarSaba: "typical",
  nofHagalilNazareth: "lessBusy",
  netanya: "lessBusy",
  acre: "unknown",
  petahTikva: "typical",
  safed: "unknown",
  krayot: "typical",
  roshHaayin: "lessBusy",
  rishonLezion: "unknown",
  ramla: "unknown",
  rehovot: "busier",
};

/** What each level means for the couple's waits, as the chat reads it. */
export const branchLoadText: Record<BranchLoad, string> = {
  lessBusy: "less busy than most branches: expect their waits toward the short end of the usual ranges",
  typical: "about as busy as most branches: expect their waits around the usual figures",
  busier: "busier than most branches: expect their waits toward the long end of the usual ranges",
  unknown: "not known: too few reports from their branch to tell, so go by the usual ranges",
};
