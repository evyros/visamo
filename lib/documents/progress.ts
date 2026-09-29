import type { Owner } from "./catalog";

// How far along a case's list is. A document is done once it has a file
// uploaded. An optional document counts only
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
