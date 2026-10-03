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

type Item = { key: string; optional: boolean };

export function progressOf(items: readonly Item[], uploaded: ReadonlySet<string>): Progress {
  const counted = items.filter((i) => !i.optional || uploaded.has(i.key));
  return { done: counted.filter((i) => uploaded.has(i.key)).length, total: counted.length };
}

/** Progress for each owner with anything to count, in the order given. */
export function progressByOwner(
  items: readonly (Item & { owner: Owner })[],
  uploaded: ReadonlySet<string>,
  order: readonly Owner[],
): { owner: Owner; progress: Progress }[] {
  return order
    .map((owner) => ({ owner, progress: progressOf(items.filter((i) => i.owner === owner), uploaded) }))
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

/** Checked progress for each owner with anything to count, in the order given. */
export function checkedProgressByOwner(
  items: readonly (Item & { owner: Owner })[],
  standing: ReadonlyMap<string, Standing>,
  order: readonly Owner[],
): { owner: Owner; progress: CheckedProgress }[] {
  return order
    .map((owner) => ({ owner, progress: checkedProgressOf(items.filter((i) => i.owner === owner), standing) }))
    .filter((g) => g.progress.total > 0);
}
