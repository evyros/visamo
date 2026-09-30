import Link from "next/link";
import type { AdminFile } from "@/lib/admin-documents";
import type { ItemCheck } from "@/lib/checks/store";
import { findingText, type CheckFinding, type CheckRating } from "@/lib/checks/result";
import { Icon } from "@/components/icons";
import { formatBytes, formatDateTime, Pill, type PillTone } from "./admin-ui";

// One document on a case's list, as the admin sees it: its files as they are
// now, its latest result, and a link to everything that happened to it,
// removed files included (the document history page, users/[id]/documents/[key]/history).

export const ratingTone: Record<CheckRating, PillTone> = {
  looksGood: "teal",
  canImprove: "amber",
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
        <CheckStatus check={check} files={files} ratings={ratings} />
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
              Latest result {formatDateTime(check.checkedAt)}
              {check.checkedByName && `, run by ${check.checkedByName}`}
            </p>
            <Findings kind={result.rating === "unreadable" ? "unreadable" : "issue"} findings={result.issues} />
            <Findings kind="recommendation" findings={result.recommendations} />
          </div>
        )}

        {historyCount > 0 && (
          <Link
            href={historyHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
          >
            <Icon name="clock" className="size-4" />
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

/** The document's result as the couple sees it now, and whether it still applies. */
export function CheckStatus({
  check,
  files,
  ratings,
}: {
  check?: ItemCheck;
  files: AdminFile[];
  ratings: Record<CheckRating, string>;
}) {
  const result = check?.result;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {check?.running && <Pill tone="navy">Checking now</Pill>}
      {result ? (
        <>
          <Pill tone={ratingTone[result.rating]}>{ratings[result.rating]}</Pill>
          {!check.fresh && <Pill>{check.contextFresh ? "Files changed since" : "Details changed since"}</Pill>}
        </>
      ) : (
        <Pill tone="slate">{files.some((f) => !f.deletedAt) ? "Not checked" : "Nothing uploaded"}</Pill>
      )}
    </div>
  );
}

/** Each kind's box and icon, as the app's documents page has them (components/app/documents-board.tsx). */
const findingStyle = {
  issue: { icon: "alertCircle", box: "border-s-crimson-600 bg-crimson-100", color: "text-crimson-600", label: "Issues" },
  recommendation: { icon: "info", box: "border-s-amber-500 bg-amber-100", color: "text-amber-500", label: "Recommendations" },
  // What the checker couldn't read: the rating's grey, not an issue's red.
  unreadable: { icon: "eyeOff", box: "border-s-slate-500 bg-slate-300/30", color: "text-slate-500", label: "Couldn’t read" },
} as const;

/** A check's issues or recommendations, like the app shows them: a tinted box each, its title over its detail. */
export function Findings({ kind, findings }: { kind: keyof typeof findingStyle; findings: CheckFinding[] }) {
  if (!findings.length) return null;
  const style = findingStyle[kind];
  return (
    <ul aria-label={style.label} className="mt-2 space-y-1.5">
      {findings.map((finding, i) => {
        const { title, detail } = findingText(finding, "en");
        return (
          <li key={i} className={`flex gap-2 rounded-lg border-s-4 px-3 py-2.5 leading-normal ${style.box}`}>
            <Icon name={style.icon} className={`mt-px size-[18px] shrink-0 ${style.color}`} />
            <div className="min-w-0">
              {title && <p className="text-[15px] font-semibold text-navy-900">{title}</p>}
              <p className="mt-0.5 text-sm text-slate-700">{detail}</p>
            </div>
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
