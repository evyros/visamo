import type { Relationship } from "@/lib/case-options";

// The sources page (/sources): where Visamo's knowledge comes from, as
// lib/knowledge/sources.md says. Its texts are in the messages (`sources`);
// sources.test.ts keeps the sources they name in step with that file.

export const sourcesPath = "/sources";

/**
 * The Population and Immigration Authority's procedure for each kind of
 * couple, as lib/knowledge/sources.md lists it (sources.test.ts checks).
 * Under a check's result, "What the check covered" names the couple's own.
 */
export const procedures: Record<Relationship, string> = {
  married: "5.2.0008",
  commonLaw: "5.2.0009",
};
