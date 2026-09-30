import type { ReactNode } from "react";
import type { AdminCheckRun, AdminFile, ListChange } from "@/lib/admin-documents";
import type { CheckRating } from "@/lib/checks/result";
import { Icon, type IconName } from "@/components/icons";
import { formatDateTime, Pill } from "./admin-ui";
import { Findings, ratingTone, runId } from "./document-card";

// A document's history as a timeline, newest first: files uploaded and
// removed, every check with the files it saw and what it said, and the
// details changes that put the document on the case's list or took it off.

type Ratings = Record<CheckRating, string>;

/** Uploads or removals by the same person this close together are one entry: files added at once. */
const GROUP_WITHIN_MS = 5 * 60 * 1000;

type Entry =
  | { kind: "files"; action: "uploaded" | "removed"; at: Date; by: string | null; files: AdminFile[] }
  | { kind: "check"; at: Date; run: AdminCheckRun; previous?: AdminCheckRun }
  | ({ kind: "list"; at: Date } & ListChange);

/** Every upload and removal, grouped, oldest first. */
function fileEntries(files: AdminFile[]) {
  const events = files
    .flatMap((file) => [
      { action: "uploaded" as const, at: file.createdAt, by: file.uploadedByName, file },
      ...(file.deletedAt ? [{ action: "removed" as const, at: file.deletedAt, by: file.deletedByName, file }] : []),
    ])
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const entries: (Entry & { kind: "files" })[] = [];
  let lastAt = 0;
  for (const event of events) {
    const last = entries.at(-1);
    const at = event.at.getTime();
    if (last && last.action === event.action && last.by === event.by && at - lastAt < GROUP_WITHIN_MS) {
      last.files.push(event.file);
    } else {
      entries.push({ kind: "files", action: event.action, at: event.at, by: event.by, files: [event.file] });
    }
    lastAt = at;
  }
  return entries;
}

/** What changed between a run and the one before it. */
function changesSince(run: AdminCheckRun, previous: AdminCheckRun | undefined) {
  if (!previous) return null;
  const before = new Set(previous.fileIds);
  const now = new Set(run.fileIds);
  const added = run.fileIds.filter((id) => !before.has(id));
  const dropped = previous.fileIds.filter((id) => !now.has(id));
  const contextChanged = run.contextHash !== previous.contextHash;
  const sameInput = !added.length && !dropped.length && !contextChanged;
  return {
    added,
    dropped,
    contextChanged,
    sameInput,
    // The checker answering the same files and details differently.
    differentResult: sameInput && run.state === "done" && previous.state === "done" && run.rating !== previous.rating,
  };
}

const markerStyle: Record<CheckRating, { icon: IconName; color: string }> = {
  looksGood: { icon: "checkCircle", color: "bg-teal-600 text-white" },
  canImprove: { icon: "info", color: "bg-amber-500 text-white" },
  needsFixing: { icon: "alertCircle", color: "bg-crimson-600 text-white" },
  unreadable: { icon: "eyeOff", color: "bg-slate-500 text-white" },
};

function marker(entry: Entry): { icon: IconName; color: string } {
  if (entry.kind === "files") {
    return entry.action === "uploaded"
      ? { icon: "upload", color: "bg-white text-navy-900 ring-1 ring-line-200" }
      : { icon: "trash", color: "bg-terracotta-100 text-terracotta-600" };
  }
  if (entry.kind === "list") return { icon: "compose", color: "bg-navy-900 text-white" };
  const { run } = entry;
  if (run.state === "done" && run.rating) return markerStyle[run.rating];
  if (run.state === "failed") return { icon: "alert", color: "bg-terracotta-600 text-white" };
  return { icon: "clock", color: "bg-navy-900 text-white" };
}

/**
 * A document's history, newest first: what the timeline shows, and what the
 * documents page counts. `runs` newest first, as allCaseChecks returns them.
 */
export function historyEntries(files: AdminFile[], runs: AdminCheckRun[], listChanges: ListChange[]): Entry[] {
  return [
    ...fileEntries(files),
    ...runs.map((run, i) => ({ kind: "check" as const, at: run.startedAt, run, previous: runs[i + 1] })),
    ...listChanges.map((change) => ({ kind: "list" as const, at: change.createdAt, ...change })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
}

export function DocumentTimeline({
  files,
  runs,
  listChanges,
  currentRunId,
  ratings,
}: {
  /** The document's files, removed ones too. */
  files: AdminFile[];
  /** Newest first. */
  runs: AdminCheckRun[];
  listChanges: ListChange[];
  /** The run whose result the couple sees now. */
  currentRunId: string | null;
  ratings: Ratings;
}) {
  const byId = new Map(files.map((f) => [f.id, f]));
  const entries = historyEntries(files, runs, listChanges);

  if (!entries.length) return <p className="text-[15px] text-slate-500">Nothing has happened to this document yet.</p>;

  return (
    <ol className="relative ms-3.5 space-y-5 border-s-2 border-line-200 ps-8">
      {entries.map((entry) => {
        const { icon, color } = marker(entry);
        const key = entry.kind === "check" ? entry.run.id : `${entry.kind}-${entry.at.getTime()}`;
        return (
          <li key={key} className="relative">
            {/* Centered on the line: 32px of padding, the 2px line, half the 28px marker. */}
            <span
              aria-hidden="true"
              className={`absolute -start-[47px] top-2.5 flex size-7 items-center justify-center rounded-full ring-4 ring-sand-50 ${color}`}
            >
              <Icon name={icon} className="size-4" />
            </span>
            {entry.kind === "files" && <FilesEntry entry={entry} />}
            {entry.kind === "list" && <ListEntry entry={entry} />}
            {entry.kind === "check" && (
              <RunCard
                run={entry.run}
                changes={changesSince(entry.run, entry.previous)}
                byId={byId}
                current={entry.run.id === currentRunId}
                ratings={ratings}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** A line of the timeline that isn't a check: what happened, who did it, when. */
function EntryLine({ children, at, by }: { children: ReactNode; at: Date; by: string | null }) {
  return (
    <p className="pt-3 text-[15px] text-slate-700">
      {children}
      <span className="text-slate-500">
        {by && ` by ${by}`} · {formatDateTime(at)}
      </span>
    </p>
  );
}

function FilesEntry({ entry }: { entry: Entry & { kind: "files" } }) {
  const count = entry.files.length === 1 ? "a file" : `${entry.files.length} files`;
  return (
    <div>
      <EntryLine at={entry.at} by={entry.by}>
        <span className="font-semibold text-navy-900">{entry.action === "uploaded" ? "Uploaded" : "Removed"}</span> {count}
      </EntryLine>
      <ul className="mt-2 flex flex-wrap gap-3">
        {entry.files.map((file) => (
          <li key={file.id}>
            <FileTile id={file.id} file={file} added={false} markRemoved={entry.action === "uploaded"} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListEntry({ entry }: { entry: Entry & { kind: "list" } }) {
  return (
    <div>
      <EntryLine at={entry.at} by={entry.actorName}>
        <span className="font-semibold text-navy-900">
          {entry.change === "added" ? "Added to the list" : "Taken off the list"}
        </span>{" "}
        when the case details changed
      </EntryLine>
      {entry.fields.length > 0 && (
        <p className="mt-1 text-[13px] text-slate-500">
          Changed: <code>{entry.fields.join(", ")}</code>
        </p>
      )}
    </div>
  );
}

function RunCard({
  run,
  changes,
  byId,
  current,
  ratings,
}: {
  run: AdminCheckRun;
  changes: ReturnType<typeof changesSince>;
  byId: Map<string, AdminFile>;
  current: boolean;
  ratings: Ratings;
}) {
  const added = new Set(changes?.added);
  const facts = [
    run.pages != null && `${run.pages} ${run.pages === 1 ? "page" : "pages"}`,
    run.attempts != null && `${run.attempts} ${run.attempts === 1 ? "call" : "calls"}`,
    run.costUsd != null && `$${run.costUsd.toFixed(4)}`,
    run.durationMs != null && `${(run.durationMs / 1000).toFixed(1)}s`,
    run.model,
  ].filter(Boolean);

  return (
    <article
      id={runId(run.id)}
      className={`scroll-mt-4 rounded-card border bg-white target:ring-2 target:ring-amber-500 ${current ? "border-teal-600" : "border-line-200"}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-line-200 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-navy-900">{formatDateTime(run.startedAt)}</span>
          <RunResult run={run} ratings={ratings} />
          {current && <Pill tone="teal">Shown to the couple</Pill>}
          {run.checkedByName && <span className="text-sm text-slate-500">run by {run.checkedByName}</span>}
        </div>
        <div className="text-[13px] text-slate-500 tabular-nums">{facts.join(" · ")}</div>
      </header>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <Changes changes={changes} byId={byId} />

        <ul className="flex flex-wrap gap-3">
          {run.fileIds.map((id) => (
            <li key={id}>
              <FileTile id={id} file={byId.get(id)} added={added.has(id)} />
            </li>
          ))}
        </ul>

        {run.state === "failed" && run.error && (
          <p className="border-s-3 border-s-terracotta-600 ps-3 text-[15px] break-words text-terracotta-600">{run.error}</p>
        )}
        {run.state === "done" && (
          <div>
            <Findings kind={run.rating === "unreadable" ? "unreadable" : "issue"} findings={run.issues ?? []} />
            <Findings kind="recommendation" findings={run.recommendations ?? []} />
            {!run.issues?.length && !run.recommendations?.length && (
              <p className="text-sm text-slate-500">No issues or recommendations.</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Changes({ changes, byId }: { changes: ReturnType<typeof changesSince>; byId: Map<string, AdminFile> }) {
  if (!changes) return <p className="text-sm text-slate-500">First check of this document.</p>;
  const name = (id: string) => byId.get(id)?.name ?? `File ${id.slice(0, 8)}`;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <span className="text-slate-500">Since the previous run:</span>
      {changes.sameInput && <Pill>Same files and details</Pill>}
      {changes.differentResult && <Pill tone="amber">Different result from the same input</Pill>}
      {changes.added.map((id) => (
        <Pill key={id} tone="teal">
          + {name(id)}
        </Pill>
      ))}
      {changes.dropped.map((id) => (
        <span key={id} className="inline-flex rounded-full bg-slate-300/30 px-2 py-0.5 text-xs font-semibold text-slate-500">
          − <span className="ms-1 line-through">{name(id)}</span>
        </span>
      ))}
      {changes.contextChanged && <Pill tone="navy">Case details or guidance changed</Pill>}
    </div>
  );
}

/** A file a run checked, as a thumbnail with its name. Opens the file. */
function FileTile({
  id,
  file,
  added,
  markRemoved = true,
}: {
  id: string;
  file?: AdminFile;
  added: boolean;
  /** Say when the file was removed since; not in the entry that removes it. */
  markRemoved?: boolean;
}) {
  const url = `/files/${id}`;
  const removed = !!file?.deletedAt;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group block w-28" title={file?.name}>
      <span
        className={`flex h-32 w-28 items-center justify-center overflow-hidden rounded-lg border bg-sand-50 text-slate-500 ${
          added ? "border-teal-600 ring-2 ring-teal-600/30" : "border-line-200"
        } ${removed ? "opacity-60" : ""}`}
      >
        {file?.hasThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${url}?thumbnail`} alt="" loading="lazy" className="size-full object-cover object-top" />
        ) : (
          <Icon name="file" className="size-8" />
        )}
      </span>
      <span className="mt-1 block truncate text-[13px] font-medium text-navy-900 group-hover:underline">
        {file?.name ?? "Unknown file"}
      </span>
      {removed && markRemoved && <span className="block text-xs text-terracotta-600">Removed since</span>}
    </a>
  );
}

function RunResult({ run, ratings }: { run: AdminCheckRun; ratings: Ratings }) {
  if (run.state === "running") return <Pill tone="navy">Running</Pill>;
  if (run.state === "failed") return <Pill tone="terracotta">Failed</Pill>;
  if (!run.rating) return <Pill>Done</Pill>;
  return (
    <>
      <Pill tone={ratingTone[run.rating]}>{ratings[run.rating]}</Pill>
      {run.ratingCorrected && <span className="text-sm text-slate-500">(rating corrected)</span>}
    </>
  );
}
