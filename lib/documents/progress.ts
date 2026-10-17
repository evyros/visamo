import type { CheckRating } from "@/lib/checks/result";
import type { Owner } from "./catalog";

// How far along a case's list is, in one of two ways. Without Full file check,
// a document is done once it has a file uploaded. With it, an upload isn't
// done: a document is ready once its current check passed it, and the rest
// are counted by where they stand. Either way an optional document counts only
// once it's uploaded, never as missing. The documents page and the overview
// both count this way.

export type Progress = { done: number; total: number };

/** The order documents are grouped in, by whose they are. */
export const ownerOrder: readonly Owner[] = ["couple", "israeli", "foreign", "children"];

/**
 * The groups of the documents page: whose they are, then the ones done once
 * the foreign partner is in Israel, whoever's they are.
 */
export type Group = Owner | "afterArrival";
export const groupOrder: readonly Group[] = [...ownerOrder, "afterArrival"];
export const groupOf = (item: { owner: Owner; later: boolean }): Group => (item.later ? "afterArrival" : item.owner);

type Item = { key: string; optional: boolean };
type Grouped = Item & { owner: Owner; later: boolean };

export function progressOf(items: readonly Item[], uploaded: ReadonlySet<string>): Progress {
  const counted = items.filter((i) => !i.optional || uploaded.has(i.key));
  return { done: counted.filter((i) => uploaded.has(i.key)).length, total: counted.length };
}

/** Progress for each group with anything to count, in the page's order. */
export function progressByGroup(items: readonly Grouped[], uploaded: ReadonlySet<string>): { group: Group; progress: Progress }[] {
  return groupOrder
    .map((group) => ({ group, progress: progressOf(items.filter((i) => groupOf(i) === group), uploaded) }))
    .filter((g) => g.progress.total > 0);
}

/** The keys with a file uploaded, from a case's files. */
export function uploadedKeys(files: readonly { documentKey: string }[]): Set<string> {
  return new Set(files.map((f) => f.documentKey));
}

/** Where a document stands once checks count, in the order they're read. */
export const standings = ["ready", "fix", "unchecked", "notUploaded"] as const;
export type Standing = (typeof standings)[number];

export type CheckedProgress = Record<Standing, number> & { total: number };

/**
 * A document's standing. `rating` is its current check's: one checked against
 * the files there now and the current details; null if there's none. Ready is
 * looks good, or tips only. A document with no check written can't be more
 * than uploaded, so once it is, it's ready.
 */
export function standingOf(uploaded: boolean, checkable: boolean, rating: CheckRating | null): Standing {
  if (!uploaded) return "notUploaded";
  if (!checkable) return "ready";
  if (!rating) return "unchecked";
  return rating === "looksGood" || rating === "canImprove" ? "ready" : "fix";
}

export function checkedProgressOf(items: readonly Item[], standing: ReadonlyMap<string, Standing>): CheckedProgress {
  const counts: CheckedProgress = { ready: 0, fix: 0, unchecked: 0, notUploaded: 0, total: 0 };
  for (const item of items) {
    const s = standing.get(item.key) ?? "notUploaded";
    if (item.optional && s === "notUploaded") continue;
    counts[s]++;
    counts.total++;
  }
  return counts;
}

/** Checked progress for each group with anything to count, in the page's order. */
export function checkedProgressByGroup(
  items: readonly Grouped[],
  standing: ReadonlyMap<string, Standing>,
): { group: Group; progress: CheckedProgress }[] {
  return groupOrder
    .map((group) => ({ group, progress: checkedProgressOf(items.filter((i) => groupOf(i) === group), standing) }))
    .filter((g) => g.progress.total > 0);
}
