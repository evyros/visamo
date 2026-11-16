import Link from "next/link";
import type { AdminCheckRun, AdminFile } from "@/lib/admin-documents";
import { findingText, type CheckFinding, type CheckRating } from "@/lib/checks/result";
import en from "@/i18n/messages/en.json";
import { Icon } from "@/components/icons";
import { formatBytes, formatDateTime, Pill, type PillTone } from "./admin-ui";
import { activeResult, type FindingKind } from "@/lib/checks/dismissals";
import { stillRunning, type ItemCheck } from "@/lib/checks/store";
import { sameSet } from "@/lib/same-set";
import { FreeCheckForm, HideFindingButton } from "./free-check-form";

// One document on a case's list, as the admin sees it: its files as they are
// now, its latest result, and a link to everything that happened to it,
// removed files included (the document history page, users/[id]/documents/[key]/history).

export const ratingTone: Record<CheckRating, PillTone> = {
  looksGood: "teal",
  canImprove: "blue",
  needsFixing: "crimson",
  unreadable: "slate",
};

export const typeLabel: Record<string, string> = { "application/pdf": "PDF", "image/jpeg": "JPEG", "image/png": "PNG" };

/** A document's id on the documents page, for linking back to its card. */
export const cardId = (key: string) => `doc-${key}`;

/** A user's documents page, and a document's card on it. */
export const documentsHref = (userId: string, key?: string) =>
  `/users/${userId}/documents${key ? `#${cardId(key)}` : ""}`;

/** A check run's id on its document's history page. */
export const runId = (id: string) => `check-${id}`;

/** A document's history page, and a check run on it. Keys can hold a colon (`id:country`), so it's encoded. */
export const historyHref = (userId: string, key: string, run?: string) =>
  `/users/${userId}/documents/${encodeURIComponent(key)}/history${run ? `#${runId(run)}` : ""}`;

export function DocumentCard({
  title,
  docKey,
  optional,
  files,
  historyCount,
  checkCount,
  historyHref,
  check,
  ratings,
  free,
}: {
  title: string;
  docKey: string;
  optional?: boolean;
  files: AdminFile[];
  /** Entries on its history page: uploads, removals, checks (failed ones too) and list changes. */
  historyCount: number;
  /** Checks that ran, failed ones too. */
  checkCount: number;
  historyHref: string;
  /** The item's check as the couple sees it; undefined for a document that left the list. */
  check?: ItemCheck;
  ratings: Record<CheckRating, string>;
  /** The free check (lib/checks/free.ts), for a case without Full file check; none for a document that left the list. */
  free?: FreeCheck;
}) {
  const result = check?.result;
  const checked = new Set(check?.fileIds);
  const uploaded = files.filter((f) => !f.deletedAt);

  return (
    // Collapsed by default: the header is enough to scan the list. The card a
    // link points to (#doc-…) is opened by OpenLinkedCard.
    <details id={cardId(docKey)} className="group scroll-mt-4 rounded-card border border-line-200 bg-white">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3 px-4 py-3 group-open:border-b group-open:border-line-200 sm:px-5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-start gap-2">
          <Icon
            name="chevron"
            className="mt-1 size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-90"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-navy-900">{title}</h3>
            <DocumentMeta docKey={docKey} optional={optional} check={check} />
          </div>
        </div>
        <CheckStatus check={check} files={files} ratings={ratings} events={historyCount} />
      </summary>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {uploaded.length > 0 ? (
          <ul className="divide-y divide-line-200 rounded-lg border border-line-200">
            {uploaded.map((file) => (
              <FileRow key={file.id} file={file} inLatestCheck={!!result && checked.has(file.id)} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No files uploaded.</p>
        )}

        {result && check.checkedAt && (
          <div>
            <p className="text-sm text-slate-500">
              {check.locked && <Pill tone="amber">Locked for the couple</Pill>}{" "}
              Latest result {formatDateTime(check.checkedAt)}
              {check.checkedByName ? `, run by ${check.checkedByName}` : check.free && ", the free check"}
              {!check.fresh &&
                ` · ${check.detailsFresh ? "files" : "details"} changed since, so the couple sees it as uploaded`}
            </p>
            <Findings kind={result.rating === "unreadable" ? "unreadable" : "issue"} findings={result.issues} />
            <Findings kind="recommendation" findings={result.recommendations} />
          </div>
        )}

        {free && check && <FreeCheckSection free={free} check={check} docKey={docKey} files={uploaded} ratings={ratings} />}

        {historyCount > 0 && (
          <Link
            href={historyHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
          >
            <Icon name="timeline" className="size-4" />
            Document history
            <span className="font-normal text-slate-500">
              ({historyCount} {historyCount === 1 ? "event" : "events"}
              {checkCount > 0 && ` · ${checkCount} ${checkCount === 1 ? "check" : "checks"}`})
            </span>
            <Icon name="chevron" className="size-4" />
          </Link>
        )}
      </div>
    </details>
  );
}

/** What the free check needs on a document's card. */
export type FreeCheck = {
  userId: string;
  /** The document the couple sees in full (their own free check, or the first approved), or null until then. */
  fullKey: string | null;
  /** The case's checks left: while its free check is, approving the first result uses it. */
  checksLeft: number;
  /** The document's runs the admin started, newest first. */
  runs: AdminCheckRun[];
};

/** What approving the pending result does for the couple. */
function approveNote(rating: CheckRating, docKey: string, fullKey: string | null, checksLeft: number) {
  if (rating === "unreadable") return "Approving shows it to the couple. It couldn’t read the files, so it doesn’t take the full place.";
  if (fullKey === null)
    return checksLeft > 0
      ? "Approving shows it to the couple in full, and uses their free check: they haven’t used it yet."
      : "Approving shows it to the couple in full: their one result in full.";
  if (fullKey === docKey) return "Approving shows it to the couple in full, in place of its current result.";
  return "Approving shows it to the couple locked: the rating only, the findings with Full file check.";
}

/**
 * The free check on a document's card: the result waiting for approval, with
 * what approving it does, and the buttons to check, approve and discard.
 */
function FreeCheckSection({
  free,
  check,
  docKey,
  files,
  ratings,
}: {
  free: FreeCheck;
  check: ItemCheck;
  docKey: string;
  files: AdminFile[];
  ratings: Record<CheckRating, string>;
}) {
  const pending = free.runs.filter((r) => r.approval === "pending");
  // A run past its time was cut off: it counts as failed, and Check starts a new one.
  const running = pending.some((r) => r.state === "running" && stillRunning(r.startedAt));
  const ready = pending.find((r) => r.state === "done" && r.rating) ?? null;
  // The newest check, when it didn't get a result: a result waiting from before it stays.
  const newest = free.runs[0];
  const failed = newest?.approval === "pending" && newest.state !== "done" && !running ? newest : null;
  const filesChanged = ready && !sameSet(ready.fileIds, files.map((f) => f.id));
  // As the couple would see it: without what the admin hid, its rating worked out again.
  const shown =
    ready &&
    activeResult(
      { rating: ready.rating!, issues: ready.issues ?? [], recommendations: ready.recommendations ?? [] },
      ready.hidden ?? [],
    );
  const hide = ready ? { userId: free.userId, runId: ready.id } : undefined;
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-line-200 bg-sand-50 px-3 py-3">
      <p className="text-sm font-semibold text-navy-900">Free check</p>
      {running && <Pill tone="navy">Checking now</Pill>}
      {failed && (
        <p className="text-sm text-terracotta-600">
          {failed.state === "running"
            ? "The last check didn’t finish."
            : `The last check failed: ${failed.error ?? "no error recorded"}`}
        </p>
      )}
      {ready && (
        <div>
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
            <Pill tone="amber">Waiting for approval</Pill>
            <Pill tone={ratingTone[shown!.rating]}>{ratings[shown!.rating]}</Pill>
            {shown!.rating !== ready.rating && (
              <span>(the checker said {ratings[ready.rating!].toLowerCase()}, before the hidden findings)</span>
            )}
            <span>checked {formatDateTime(ready.finishedAt ?? ready.startedAt)}</span>
            {filesChanged && <span className="text-terracotta-600">· the files changed since</span>}
          </div>
          <Findings
            kind={ready.rating === "unreadable" ? "unreadable" : "issue"}
            findings={ready.issues ?? []}
            hidden={ready.hidden ?? []}
            hide={hide}
          />
          <Findings kind="recommendation" findings={ready.recommendations ?? []} hidden={ready.hidden ?? []} hide={hide} />
          <p className="mt-2 text-sm text-slate-700">{approveNote(shown!.rating, docKey, free.fullKey, free.checksLeft)}</p>
        </div>
      )}
      <FreeCheckForm
        userId={free.userId}
        documentKey={docKey}
        approveRunId={ready?.id ?? null}
        // The result waiting, or else a failed check, which would otherwise wait forever.
        discardRunId={ready?.id ?? (failed?.state === "failed" ? failed.id : null)}
        canCheck={check.checkable && files.length > 0 && !running}
        checked={free.runs.length > 0}
      />
    </div>
  );
}

/** The document's key and what's special about it, under its title. */
export function DocumentMeta({ docKey, optional, check }: { docKey: string; optional?: boolean; check?: ItemCheck }) {
  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
      <code>{docKey}</code>
      {optional && <Pill>Optional</Pill>}
      {check && !check.checkable && <Pill tone="slate">No check written</Pill>}
    </div>
  );
}

/**
 * The document's status as the couple sees it now: a result shows only while
 * it still applies (components/app/documents-board.tsx freshResult); once the
 * files or details change, it's back to uploaded. With `events`, how many
 * entries its history has.
 */
export function CheckStatus({
  check,
  files,
  ratings,
  events,
}: {
  check?: ItemCheck;
  files: AdminFile[];
  ratings: Record<CheckRating, string>;
  events?: number;
}) {
  const result = check?.fresh ? check.result : undefined;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {check?.running && <Pill tone="navy">Checking now</Pill>}
      {result ? (
        <Pill tone={ratingTone[result.rating]}>{ratings[result.rating]}</Pill>
      ) : (
        <Pill tone="slate">{files.some((f) => !f.deletedAt) ? "Uploaded" : "Nothing uploaded"}</Pill>
      )}
      {!!events && (
        <span
          title={`${events} ${events === 1 ? "event" : "events"} in its history`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"
        >
          <Icon name="timeline" className="size-3.5" />
          {events}
          <span className="sr-only">{events === 1 ? "event" : "events"}</span>
        </span>
      )}
    </div>
  );
}

/** Each kind's box and icon, as the app's documents page has them (components/app/documents-board.tsx). */
const findingStyle = {
  issue: { icon: "alertCircle", box: "border-s-crimson-600 bg-crimson-100", color: "text-crimson-600", label: "Issues" },
  recommendation: { icon: "info", box: "border-s-blue-600 bg-blue-50", color: "text-blue-600", label: "Recommendations" },
  // What the checker couldn't read: the rating's grey, not an issue's red.
  unreadable: { icon: "eyeOff", box: "border-s-slate-500 bg-slate-300/30", color: "text-slate-500", label: "Couldn’t read" },
} as const;

/** The kind of finding each list holds, for hiding it; none for what couldn't be read. */
const findingKindOf = { issue: "issue", recommendation: "recommendation", unreadable: null } as const;

/**
 * A check's issues or recommendations, like the app shows them: a tinted box
 * each, its part and title over its detail. Findings the admin hid from the
 * couple (`hidden`, by kind and place) are crossed out; with `hide`, in a
 * result waiting for approval, each one can be hidden or put back.
 */
export function Findings({
  kind,
  findings,
  hidden = [],
  hide,
}: {
  kind: keyof typeof findingStyle;
  findings: CheckFinding[];
  hidden?: readonly { kind: FindingKind; index: number }[];
  hide?: { userId: string; runId: string };
}) {
  if (!findings.length) return null;
  const style = findingStyle[kind];
  const findingKind = findingKindOf[kind];
  return (
    <ul aria-label={style.label} className="mt-2 space-y-1.5">
      {findings.map((finding, i) => {
        const { title, detail } = findingText(finding, "en");
        const out = !!findingKind && hidden.some((h) => h.kind === findingKind && h.index === i);
        return (
          <li
            key={i}
            className={`flex gap-2 rounded-lg border-s-4 px-3 py-2.5 leading-normal ${style.box} ${out ? "opacity-60" : ""}`}
          >
            <Icon name={style.icon} className={`mt-px size-[18px] shrink-0 ${style.color}`} />
            <div className={`min-w-0 flex-1 ${out ? "line-through decoration-slate-500" : ""}`}>
              {finding.part && (
                <p className="text-xs font-semibold text-slate-600">{en.app.documentsPage.check.parts[finding.part]}</p>
              )}
              {title && <p className="text-[15px] font-semibold text-navy-900">{title}</p>}
              <p className="mt-0.5 text-sm text-slate-700">{detail}</p>
            </div>
            {out && !hide && (
              <span className="shrink-0 self-start">
                <Pill tone="slate">Hidden from the couple</Pill>
              </span>
            )}
            {hide && findingKind && <HideFindingButton {...hide} kind={findingKind} index={i} hidden={out} />}
          </li>
        );
      })}
    </ul>
  );
}

/** An uploaded file. Removed files are shown only in the document's history. */
export function FileRow({ file, inLatestCheck }: { file: AdminFile; inLatestCheck: boolean }) {
  const url = `/files/${file.id}`;
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line-200 bg-sand-50 text-slate-500"
        aria-label={`Open ${file.name}`}
      >
        {file.hasThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${url}?thumbnail`} alt="" loading="lazy" className="size-full object-cover object-top" />
        ) : (
          <Icon name="file" className="size-6" />
        )}
      </a>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="truncate font-medium text-navy-900 hover:underline"
          >
            {file.name}
          </a>
          {inLatestCheck && <Pill tone="teal">In latest check</Pill>}
        </div>
        <div className="text-[13px] text-slate-500">
          {typeLabel[file.contentType] ?? file.contentType} · {formatBytes(file.size)} · uploaded{" "}
          {formatDateTime(file.createdAt)}
          {file.uploadedByName && ` by ${file.uploadedByName}`}
        </div>
      </div>
    </li>
  );
}
