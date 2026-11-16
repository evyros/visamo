/**
 * Whether two lists of ids hold the same ids, in any order: the files a
 * check saw against a document's files now. A result applies only while
 * they're the same (lib/checks/store.ts).
 */
export function sameSet(a: readonly string[], b: readonly string[]) {
  if (a.length !== b.length) return false;
  const sorted = [...b].sort();
  return [...a].sort().every((id, i) => id === sorted[i]);
}
