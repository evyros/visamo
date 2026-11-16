import "server-only";
import { and, asc, eq, inArray, isNotNull, isNull, min } from "drizzle-orm";
import { caseDocuments } from "./case-documents";
import { db } from "./db";
import { caseFile, caseMember, cases, documentCheck, user } from "./db/schema";
import { checkFirst } from "./documents/check-priority";
import { sameSet } from "./same-set";

// The admin's "To check" list for the free check (lib/checks/free.ts): what
// waits for the admin across every case without Full file check. A fallback
// for when the first-upload email gets buried.
//
// A document whose files changed since its approved result is listed until
// the admin checks it again and approves or discards that result: a check
// discarded on the current files counts as dealt with. Once the files change
// again, it's listed again.

/** Each case's owner, the partner who created it, whose documents page the list links to. */
async function owners(caseIds: string[]) {
  if (!caseIds.length) return new Map<string, { id: string; name: string; email: string }>();
  const rows = await db
    .select({ caseId: caseMember.caseId, id: user.id, name: user.name, email: user.email })
    .from(caseMember)
    .innerJoin(user, eq(user.id, caseMember.userId))
    .where(and(inArray(caseMember.caseId, caseIds), eq(caseMember.role, "owner")));
  return new Map(rows.map(({ caseId, ...owner }) => [caseId, owner]));
}

/** The rows by a key of theirs. */
function groupBy<T>(rows: readonly T[], key: (row: T) => string) {
  const groups = new Map<string, T[]>();
  for (const row of rows) groups.set(key(row), [...(groups.get(key(row)) ?? []), row]);
  return groups;
}

/** What waits for the admin, each with the case's owner. */
export async function freeCheckQueue() {
  const [pending, waiting, approved, discarded] = await Promise.all([
    // Results waiting for approval, checks still running for it, and ones that failed. Oldest first.
    db
      .select({
        caseId: documentCheck.caseId,
        documentKey: documentCheck.documentKey,
        state: documentCheck.state,
        rating: documentCheck.rating,
        startedAt: documentCheck.startedAt,
      })
      .from(documentCheck)
      .innerJoin(cases, eq(cases.id, documentCheck.caseId))
      .where(and(eq(documentCheck.approval, "pending"), eq(cases.fileCheck, false)))
      .orderBy(asc(documentCheck.startedAt)),
    // Cases with files and nothing shown in full yet: the free check hasn't reached them.
    db
      .select({ caseId: cases.id, firstUploadAt: min(caseFile.createdAt) })
      .from(cases)
      .innerJoin(caseFile, and(eq(caseFile.caseId, cases.id), isNull(caseFile.deletedAt)))
      .where(and(eq(cases.fileCheck, false), isNull(cases.freeFullKey)))
      .groupBy(cases.id)
      .orderBy(asc(min(caseFile.createdAt))),
    // Approved results, to find the documents whose files changed since.
    db
      .select({
        caseId: documentCheck.caseId,
        documentKey: documentCheck.documentKey,
        fileIds: documentCheck.fileIds,
        startedAt: documentCheck.startedAt,
      })
      .from(documentCheck)
      .innerJoin(cases, eq(cases.id, documentCheck.caseId))
      .where(
        and(
          eq(documentCheck.approval, "approved"),
          eq(documentCheck.state, "done"),
          isNull(documentCheck.replacedBy),
          isNotNull(documentCheck.rating),
          eq(cases.fileCheck, false),
        ),
      ),
    // Results the admin discarded: the files each one saw count as dealt with.
    db
      .select({ caseId: documentCheck.caseId, documentKey: documentCheck.documentKey, fileIds: documentCheck.fileIds })
      .from(documentCheck)
      .innerJoin(cases, eq(cases.id, documentCheck.caseId))
      .where(and(eq(documentCheck.approval, "discarded"), eq(cases.fileCheck, false))),
  ]);

  // Each document's latest approved result, against its files now.
  const latest = new Map<string, (typeof approved)[number]>();
  for (const run of approved) {
    const key = `${run.caseId}/${run.documentKey}`;
    const seen = latest.get(key);
    if (!seen || seen.startedAt < run.startedAt) latest.set(key, run);
  }
  const approvedCases = [...new Set(approved.map((r) => r.caseId))];
  const files = approvedCases.length
    ? await db
        .select({ caseId: caseFile.caseId, documentKey: caseFile.documentKey, id: caseFile.id })
        .from(caseFile)
        .where(and(inArray(caseFile.caseId, approvedCases), isNull(caseFile.deletedAt)))
    : [];
  // By case and document, so each lookup is one step.
  const docKey = (r: { caseId: string; documentKey: string }) => `${r.caseId}/${r.documentKey}`;
  const pendingKeys = new Set(pending.map(docKey));
  const filesOf = groupBy(files, docKey);
  const discardedOf = groupBy(discarded, docKey);
  const changed = [...latest.values()].filter((run) => {
    // Already checked again and waiting: it's in the first list.
    if (pendingKeys.has(docKey(run))) return false;
    const now = (filesOf.get(docKey(run)) ?? []).map((f) => f.id);
    if (!now.length || sameSet(now, run.fileIds)) return false;
    // Checked again on these very files, and that result discarded: dealt with.
    return !(discardedOf.get(docKey(run)) ?? []).some((d) => sameSet(d.fileIds, now));
  });

  // Where to start each case nobody checked yet: its uploaded document most likely to need fixing.
  // The uploads of all of them in one query; each case's list needs its own details.
  const pendingCases = new Set(pending.map((p) => p.caseId));
  const notStarted = waiting.filter((w) => !pendingCases.has(w.caseId));
  const uploads = notStarted.length
    ? await db
        .selectDistinct({ caseId: caseFile.caseId, documentKey: caseFile.documentKey })
        .from(caseFile)
        .where(and(inArray(caseFile.caseId, notStarted.map((w) => w.caseId)), isNull(caseFile.deletedAt)))
    : [];
  const uploadsOf = groupBy(uploads, (u) => u.caseId);
  const startWith = new Map(
    await Promise.all(
      notStarted.map(async (w) => {
        const { list } = await caseDocuments(w.caseId);
        const uploaded = new Set((uploadsOf.get(w.caseId) ?? []).map((u) => u.documentKey));
        const [first] = checkFirst(list, uploaded, 1);
        return [w.caseId, first?.key ?? null] as const;
      }),
    ),
  );

  const caseIds = [...new Set([...pending, ...waiting, ...changed].map((r) => r.caseId))];
  const owner = await owners(caseIds);
  const withOwner = <T extends { caseId: string }>(rows: T[]) =>
    rows.flatMap((row) => {
      const o = owner.get(row.caseId);
      return o ? [{ ...row, owner: o }] : [];
    });
  return {
    pending: withOwner(pending),
    // A case with a result waiting is in the first list.
    waiting: withOwner(notStarted.map((w) => ({ ...w, startWith: startWith.get(w.caseId) ?? null }))),
    changed: withOwner(changed),
  };
}
