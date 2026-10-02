"use client";

import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { useCallback, useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { deleteFile, finishUpload, startUpload, type UploadError } from "@/app/(app)/(main)/file/documents/actions";
import type { Locale } from "@/i18n/config";
import { formatAgo } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { format } from "@/i18n/messages";
import { buyUrl } from "@/lib/buy-paths";
import { newTab } from "@/lib/site";
import type { CheckRating, FindingText } from "@/lib/checks/result";
import type { CheckView } from "@/lib/checks/view";
import type { Owner } from "@/lib/documents/catalog";
import { progressOf, uploadedKeys } from "@/lib/documents/progress";
import { ACCEPTED_TYPES, MAX_FILE_BYTES, MAX_FILES_PER_DOCUMENT, isAcceptedType } from "@/lib/files/rules";
import type { FileView } from "@/lib/files/view";
import { Icon } from "@/components/icons";

// The documents page: the case's list, grouped by whose document it is, each
// document a card that opens to its uploads. A file goes through two phases:
// uploading (straight to the Blob store, with progress) and processing
// (finishUpload checks it, records it and makes its thumbnail). Then the
// server's thumbnail replaces the local preview.
//
// A document can be checked (api/documents/check): all its files together.
// The result shows while the files it checked are the ones there; once they
// change, the document can be checked again.

type Labels = Messages["app"]["documentsPage"];

export type DocumentItem = {
  key: string;
  title: string;
  description: string;
  /** What it has to show, by the couple's case, right under the description; empty for most documents. */
  points: string[];
  /** What to prepare before uploading: certification (with its exemption), translation, signing. */
  requirements: { icon: "shield" | "globe" | "file" | "info"; text: string }[];
  /** Only if it applies to the couple (the description says when). */
  optional: boolean;
  check: {
    /** Whether this document can be checked yet (its check is written). */
    checkable: boolean;
    running: boolean;
    last: CheckView | null;
  };
};

/** What the case's purchases allow for document checks. */
export type CheckSettings = {
  /** The case bought Full file check. */
  allowed: boolean;
  /** Shown near the fair-use limit. */
  notice: string | null;
  supportUrl: string;
};

type ItemCheck = { running: boolean; last: CheckView | null; error?: string };

const sameSet = (a: readonly string[], b: readonly string[]) => {
  const sorted = [...b].sort();
  return a.length === b.length && [...a].sort().every((id, i) => id === sorted[i]);
};

export type DocumentGroup = { owner: Owner; title: string; items: DocumentItem[] };

/** Files for a document no longer on the list: kept, shown, and only removable. */
export type RetiredDocument = { key: string; title: string };

/** A file on its way: not in the case's files until finishUpload succeeds. */
type Pending = {
  id: string;
  documentKey: string;
  file: File;
  /** A local preview of an image, shown until the server's thumbnail. */
  previewUrl: string | null;
  phase: "uploading" | "processing" | "failed";
  percent: number;
  /** Set once startUpload picked the path. */
  target?: { fileId: string; pathname: string };
  /** The upload reached the store: a retry only redoes processing. */
  uploaded: boolean;
  error?: UploadError;
  /** A file this one replaces, removed once it's done. */
  replaces?: string;
};

/** Runs at most `size` tasks at once, gentler on phones. */
function useLimiter(size: number) {
  const active = useRef(0);
  const waiting = useRef<(() => void)[]>([]);
  return useCallback(
    async (task: () => Promise<void>) => {
      if (active.current >= size) await new Promise<void>((resolve) => waiting.current.push(resolve));
      active.current++;
      try {
        await task();
      } finally {
        active.current--;
        waiting.current.shift()?.();
      }
    },
    [size],
  );
}

/** Multipart splits a large file into parts that retry on their own. */
const MULTIPART_FROM = 8 * 1024 * 1024;

export function DocumentsBoard({
  t,
  groups,
  retired,
  files: initialFiles,
  locale,
  intlLocale,
  checks: settings,
}: {
  t: Labels;
  groups: DocumentGroup[];
  retired: RetiredDocument[];
  files: FileView[];
  locale: Locale;
  intlLocale: string;
  checks: CheckSettings;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [checks, setChecks] = useState<Record<string, ItemCheck>>(() =>
    Object.fromEntries(
      groups.flatMap((g) => g.items).map((item) => [item.key, { running: item.check.running, last: item.check.last }]),
    ),
  );
  const [pending, setPending] = useState<Pending[]>([]);
  // Per document: an error about files that weren't added.
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const limit = useLimiter(2);
  // Local previews still open, revoked when done or when leaving the page.
  const previewUrls = useRef(new Set<string>());
  const revoke = (url: string | null) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    previewUrls.current.delete(url);
  };
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const change = (id: string, update: Partial<Pending>) =>
    setPending((list) => list.map((p) => (p.id === id ? { ...p, ...update } : p)));

  async function run(item: Pending) {
    let { target, uploaded } = item;
    try {
      if (!target) {
        const started = await startUpload(item.documentKey);
        if ("error" in started) return change(item.id, { phase: "failed", error: started.error });
        target = started;
        change(item.id, { target });
      }
      if (!uploaded) {
        change(item.id, { phase: "uploading", percent: 0, error: undefined });
        await upload(target.pathname, item.file, {
          access: "private",
          handleUploadUrl: "/api/files/upload",
          contentType: item.file.type,
          multipart: item.file.size >= MULTIPART_FROM,
          onUploadProgress: ({ percentage }) => change(item.id, { percent: Math.round(percentage) }),
        });
        uploaded = true;
        change(item.id, { uploaded });
      }
      change(item.id, { phase: "processing", error: undefined });
      const result = await finishUpload({
        fileId: target.fileId,
        documentKey: item.documentKey,
        name: item.file.name,
      });
      if ("error" in result) {
        // Missing, or rejected and deleted: the next try uploads again, to a new path.
        const again = result.error === "missing" || result.error === "type" || result.error === "size";
        return change(item.id, {
          phase: "failed",
          error: result.error,
          ...(again && { uploaded: false, target: undefined }),
        });
      }
      setFiles((list) => [...list, result.file]);
      setPending((list) => list.filter((p) => p.id !== item.id));
      revoke(item.previewUrl);
      if (item.replaces) void remove(item.replaces);
    } catch (error) {
      console.error("upload failed", error);
      change(item.id, { phase: "failed", error: "generic" });
    }
  }

  function add(documentKey: string, chosen: File[], replaces?: string) {
    const here =
      files.filter((f) => f.documentKey === documentKey && f.id !== replaces).length +
      pending.filter((p) => p.documentKey === documentKey).length;
    let error: string | undefined;
    const accepted = chosen.filter((file) => {
      if (!isAcceptedType(file.type)) error = t.errors.type;
      else if (file.size > MAX_FILE_BYTES) error = t.errors.size;
      else return true;
      return false;
    });
    const room = Math.max(0, MAX_FILES_PER_DOCUMENT - here);
    if (accepted.length > room) error = t.errors.tooMany;
    setAddErrors((errors) => ({ ...errors, [documentKey]: error ?? "" }));

    const items: Pending[] = accepted.slice(0, room).map((file) => ({
      id: crypto.randomUUID(),
      documentKey,
      file,
      previewUrl: file.type.startsWith("image/") ? preview(file) : null,
      phase: "uploading",
      percent: 0,
      uploaded: false,
      replaces,
    }));
    setPending((list) => [...list, ...items]);
    for (const item of items) void limit(() => run(item));
  }

  function preview(file: File) {
    const url = URL.createObjectURL(file);
    previewUrls.current.add(url);
    return url;
  }

  function retry(item: Pending) {
    change(item.id, { phase: item.uploaded ? "processing" : "uploading", error: undefined });
    void limit(() => run(item));
  }

  function dismiss(item: Pending) {
    revoke(item.previewUrl);
    setPending((list) => list.filter((p) => p.id !== item.id));
  }

  async function remove(fileId: string) {
    const result = await deleteFile(fileId);
    if (!result.error) setFiles((list) => list.filter((f) => f.id !== fileId));
  }

  const setCheck = (key: string, update: Partial<ItemCheck>) =>
    setChecks((all) => ({ ...all, [key]: { ...all[key], ...update } }));

  async function check(documentKey: string) {
    setCheck(documentKey, { running: true, error: undefined });
    const errors = t.check.errors;
    try {
      const response = await fetch("/api/documents/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentKey }),
      });
      const body = (await response.json().catch(() => ({}))) as { check?: CheckView; error?: string };
      if (response.ok && body.check) return setCheck(documentKey, { running: false, last: body.check });
      const error = errors[body.error as keyof typeof errors] ?? errors.generic;
      setCheck(documentKey, { running: false, error });
    } catch (error) {
      console.error("check failed", error);
      setCheck(documentKey, { running: false, error: errors.generic });
    }
  }

  const { done: ready, total } = progressOf(groups.flatMap((g) => g.items), uploadedKeys(files));
  // A retired document's files can only be removed; once they all are, it goes.
  const retiredLeft = retired.filter((r) => files.some((f) => f.documentKey === r.key));

  return (
    <>
      <section className="mt-6 rounded-card border border-line-200 bg-white p-5">
        <p className="font-semibold text-navy-900">{format(t.progress, { done: ready, total })}</p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={ready}
          aria-label={format(t.progress, { done: ready, total })}
          className="mt-3 h-2 overflow-hidden rounded-full bg-line-200"
        >
          <div
            className="h-full rounded-full bg-teal-600 transition-[width]"
            style={{ width: `${total ? (ready / total) * 100 : 0}%` }}
          />
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.owner} id={group.owner} className="mt-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-navy-900">{group.title}</h2>
          <ul className="mt-3 space-y-3">
            {group.items.map((item) => (
              <li key={item.key}>
                <DocumentCard
                  t={t}
                  item={item}
                  locale={locale}
                  intlLocale={intlLocale}
                  check={checks[item.key]}
                  settings={settings}
                  onCheck={() => check(item.key)}
                  files={files.filter((f) => f.documentKey === item.key)}
                  pending={pending.filter((p) => p.documentKey === item.key)}
                  error={addErrors[item.key]}
                  onAdd={(chosen, replaces) => add(item.key, chosen, replaces)}
                  onRemove={remove}
                  onRetry={retry}
                  onDismiss={dismiss}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {retiredLeft.length > 0 && (
        <section id="retired" className="mt-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-navy-900">{t.groups.retired}</h2>
          <p className="mt-1 text-[15px] text-slate-600">{t.retiredIntro}</p>
          <ul className="mt-3 space-y-3">
            {retiredLeft.map((r) => (
              <li key={r.key}>
                <RetiredCard
                  t={t}
                  title={r.title}
                  intlLocale={intlLocale}
                  files={files.filter((f) => f.documentKey === r.key)}
                  onRemove={remove}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** A document that left the list, with the files it had. Nothing can be added to it. */
function RetiredCard({
  t,
  title,
  intlLocale,
  files,
  onRemove,
}: {
  t: Labels;
  title: string;
  intlLocale: string;
  files: FileView[];
  onRemove: (fileId: string) => Promise<void>;
}) {
  return (
    <div className="rounded-card border border-line-200 bg-white p-4 sm:p-5">
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold text-navy-900">{title}</span>
        <span className="rounded-full bg-sand-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {t.status.retired}
        </span>
      </span>
      <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {files.map((file) => (
          <li key={file.id}>
            <FileTile t={t} file={file} intlLocale={intlLocale} onRemove={() => onRemove(file.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

type FileHandlers = {
  onAdd: (files: File[], replaces?: string) => void;
  onRemove: (fileId: string) => Promise<void>;
  onRetry: (item: Pending) => void;
  onDismiss: (item: Pending) => void;
};

function DocumentCard({
  t,
  item,
  locale,
  intlLocale,
  check,
  settings,
  onCheck,
  files,
  pending,
  error,
  ...handlers
}: {
  t: Labels;
  item: DocumentItem;
  locale: Locale;
  intlLocale: string;
  check: ItemCheck;
  settings: CheckSettings;
  onCheck: () => void;
  files: FileView[];
  pending: Pending[];
  error?: string;
} & FileHandlers) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const uploaded = files.length > 0;
  // The result applies while it was checked against these very files and the current details.
  const last = check.last;
  const fresh = !!last && last.contextFresh && sameSet(last.fileIds, files.map((f) => f.id));

  return (
    <div className="rounded-card border border-line-200 bg-white">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 rounded-card p-4 text-start focus-visible:outline-2 focus-visible:outline-teal-600 sm:p-5"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-navy-900">{item.title}</span>
            <Status t={t} uploaded={uploaded} optional={item.optional} />
          </span>
        </span>
        {/* At the row's end, so every card's rating lines up with the others'. Each sits
            in a box one text line tall, centered on the title's first line. */}
        {fresh && (
          <span className="flex h-[1lh] shrink-0 items-center">
            <CheckPill rating={last.rating} label={t.check.ratings[last.rating]} />
          </span>
        )}
        <span className="flex h-[1lh] shrink-0 items-center">
          <Icon
            name="chevronDown"
            className={`size-5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div id={bodyId} hidden={!open}>
        <div className="border-t border-line-200 px-4 pt-4 pb-5 sm:px-5">
          <p className="text-[15px] text-slate-700">{item.description}</p>
          {item.points.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 ps-5 text-[15px] text-slate-700">
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          )}
          {item.requirements.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {item.requirements.map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-2 text-[15px] text-slate-700">
                  <Icon name={icon} className="mt-1 size-4 shrink-0 text-teal-700" />
                  {text}
                </li>
              ))}
            </ul>
          )}
          <Uploads
            t={t}
            intlLocale={intlLocale}
            files={files}
            pending={pending}
            error={error}
            {...handlers}
          />
        </div>

        {item.check.checkable && (
          <CheckFooter
            t={t}
            locale={locale}
            check={check}
            fresh={fresh}
            settings={settings}
            uploaded={uploaded}
            uploading={pending.length > 0}
            onCheck={onCheck}
          />
        )}

        {/* Reserved for "Ask about this document": the chat about this card. */}
      </div>
    </div>
  );
}

/** Whether a drag carries files (not text or a link from the page). */
const dragsFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");

/** Per rating: its icon, its solid color, and its pale tint with the icon's color on it. */
const ratingStyle: Record<
  CheckRating,
  { icon: "checkCircle" | "info" | "alertCircle" | "eyeOff"; color: string; tint: string; text: string }
> = {
  looksGood: { icon: "checkCircle", color: "bg-teal-600", tint: "bg-teal-100", text: "text-teal-700" },
  canImprove: { icon: "info", color: "bg-amber-500", tint: "bg-amber-100", text: "text-amber-500" },
  needsFixing: { icon: "alertCircle", color: "bg-crimson-600", tint: "bg-crimson-100", text: "text-crimson-600" },
  unreadable: { icon: "eyeOff", color: "bg-slate-500", tint: "bg-slate-300/30", text: "text-slate-500" },
};

/** The check's rating as an icon alone: the shape tells them apart, not only the color. */
function CheckIcon({ rating, label }: { rating: CheckRating; label: string }) {
  const { icon, color } = ratingStyle[rating];
  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white ${color}`}
    >
      <Icon name={icon} className="size-4" />
    </span>
  );
}

/**
 * The rating in a card's header: its icon and label on its tint. The label
 * is dark on every tint: amber text on pale amber would be too faint to read.
 */
function CheckPill({ rating, label }: { rating: CheckRating; label: string }) {
  const { icon, tint, text } = ratingStyle[rating];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-navy-900 ${tint}`}
    >
      <Icon name={icon} className={`size-4 ${text}`} />
      {label}
    </span>
  );
}

/**
 * The card's footer: the document check. One row (the state, and the button
 * when there's something to check), then the findings when there's a result.
 */
function CheckFooter({
  t,
  locale,
  check,
  fresh,
  settings,
  uploaded,
  uploading,
  onCheck,
}: {
  t: Labels;
  locale: Locale;
  check: ItemCheck;
  fresh: boolean;
  settings: CheckSettings;
  uploaded: boolean;
  uploading: boolean;
  onCheck: () => void;
}) {
  const c = t.check;
  const last = check.last;
  const result = fresh && last ? last : null;
  const button =
    "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[15px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600";
  // "2 to fix, 1 tip", in the language's plural forms.
  const plural = new Intl.PluralRules(locale);
  const count = (forms: { one: string; other: string }, n: number) =>
    n > 0 && format(plural.select(n) === "one" ? forms.one : forms.other, { count: n });
  const counts = result && [count(c.counts.fix, result.issues.length), count(c.counts.tip, result.recommendations.length)];

  let state: ReactNode = null;
  let action: ReactNode = null;
  // A current result shows whether or not checks are included now: it was checked.
  if (result) {
    state = (
      // The texts share a baseline (they're different sizes); the icon is centered on them.
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="self-center">
          <CheckIcon rating={result.rating} label={c.ratings[result.rating]} />
        </span>
        <span className="font-semibold text-navy-900">{c.ratings[result.rating]}</span>
        {counts?.some(Boolean) && (
          <span className="text-slate-700">· {counts.filter(Boolean).join(", ")}</span>
        )}
        {/* At the row's end; on a phone, a line of its own. */}
        <span className="basis-full text-sm text-slate-500 sm:ms-auto sm:basis-auto">
          {format(result.checkedByName ? c.checkedBy : c.checkedOn, {
            when: formatAgo(new Date(result.checkedAt), locale),
            name: result.checkedByName ?? "",
          })}
        </span>
      </span>
    );
  } else if (check.running) {
    state = (
      <span aria-live="polite" className="flex items-center gap-2">
        <span className="size-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        {c.checking}
      </span>
    );
  } else if (!settings.allowed) {
    // Not bought: the button leads to the buy page.
    state = c.upgradeHint;
    action = (
      <Link href={buyUrl("/file/documents")} className={`${button} bg-navy-900 text-white hover:bg-navy-800`}>
        <Icon name="checkCircle" className="size-4" />
        {c.upgrade}
      </Link>
    );
  } else {
    state = uploaded ? (last ? c.stale : c.notChecked) : c.needsOriginal;
    action = (
      <button
        type="button"
        onClick={onCheck}
        disabled={!uploaded || uploading}
        className={`${button} bg-teal-600 text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-line-200 disabled:text-slate-500`}
      >
        <Icon name="checkCircle" className="size-4" />
        {last ? c.again : c.check}
      </button>
    );
  }

  return (
    <section aria-label={c.check} className="rounded-b-card border-t border-line-200 bg-white px-4 py-3 sm:px-5">
      {/* As tall as the button in every state, so starting a check doesn't make the card jump. */}
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {/* A text with a button sits by it; on a phone, it's a line of its own above it. */}
        <div className={`min-w-0 text-[15px] text-slate-700 ${action ? "basis-full sm:flex-1 sm:text-end" : "flex-1"}`}>
          {state}
        </div>
        {action}
      </div>

      {result && (
        <div aria-live="polite">
          {/* One gap between every box, across the issues and the tips. */}
          <div className="mt-2.5 space-y-1.5">
            <Findings
              kind={result.rating === "unreadable" ? "unreadable" : "issue"}
              label={c.issues}
              list={result.issues}
            />
            {result.rating === "unreadable" && <p className="text-[15px] text-slate-700">{c.unreadableHint}</p>}
            <Findings kind="tip" label={c.recommendations} list={result.recommendations} />
          </div>
          <p className="mt-3 text-xs text-slate-500">{c.disclaimer}</p>
        </div>
      )}
      {check.error && (
        <p role="alert" className="mt-2 text-sm font-medium text-terracotta-600">
          {check.error}
        </p>
      )}
      {settings.allowed && settings.notice && (
        <p className="mt-2 text-sm text-slate-600">
          {settings.notice}{" "}
          <a href={settings.supportUrl} {...newTab} className="font-semibold text-teal-700 hover:underline">
            {c.contactSupport}
          </a>
        </p>
      )}
    </section>
  );
}

const findingStyle = {
  issue: { icon: "alertCircle", box: "border-s-crimson-600 bg-crimson-100", color: "text-crimson-600" },
  tip: { icon: "info", box: "border-s-amber-500 bg-amber-100", color: "text-amber-500" },
  // What the checker couldn't read: the rating's grey, not an issue's red.
  unreadable: { icon: "eyeOff", box: "border-s-slate-500 bg-slate-300/30", color: "text-slate-500" },
} as const;

/**
 * A check's issues or recommendations, each in its own box, tinted and
 * edged by its kind, so there are no headings. `label` names the list for
 * screen readers.
 */
function Findings({
  kind,
  label,
  list,
}: {
  kind: keyof typeof findingStyle;
  label: string;
  list: FindingText[];
}) {
  if (list.length === 0) return null;
  const style = findingStyle[kind];
  return (
    <ul aria-label={label} className="space-y-1.5">
      {list.map(({ title, detail }) => (
        <li key={title + detail} className={`flex gap-2 rounded-lg border-s-4 px-3 py-2.5 leading-normal ${style.box}`}>
          <Icon name={style.icon} className={`mt-px size-[18px] shrink-0 ${style.color}`} />
          <div className="min-w-0">
            {title && <p className="text-[15px] font-semibold text-navy-900">{title}</p>}
            <p className="mt-0.5 text-sm text-slate-700">{detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Status({ t, uploaded, optional }: { t: Labels; uploaded: boolean; optional: boolean }) {
  if (!uploaded) {
    return (
      <span className="rounded-full bg-sand-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
        {optional ? t.status.optional : t.status.todo}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
      <Icon name="checkCircle" className="size-3.5" />
      {t.status.uploaded}
    </span>
  );
}

const accept = ACCEPTED_TYPES.join(",");

/**
 * The document's files, and one upload bar under them that looks the same
 * with or without files. Everything that goes with the document is uploaded
 * here: its pages, its apostille, its translation.
 */
function Uploads({
  t,
  intlLocale,
  files,
  pending,
  error,
  onAdd,
  onRemove,
  onRetry,
  onDismiss,
}: {
  t: Labels;
  intlLocale: string;
  files: FileView[];
  pending: Pending[];
  error?: string;
} & FileHandlers) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  // Entering the bar's own text fires enter and leave too: count them.
  const dragDepth = useRef(0);
  const endDrag = () => {
    dragDepth.current = 0;
    setDragging(false);
  };

  return (
    <div className="mt-4">
      {(files.length > 0 || pending.length > 0) && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((file) => (
            <li key={file.id}>
              <FileTile
                t={t}
                file={file}
                intlLocale={intlLocale}
                onRemove={() => onRemove(file.id)}
                onReplace={(replacement) => onAdd([replacement], file.id)}
              />
            </li>
          ))}
          {pending.map((item) => (
            <li key={item.id}>
              <PendingTile t={t} item={item} onRetry={() => onRetry(item)} onDismiss={() => onDismiss(item)} />
            </li>
          ))}
        </ul>
      )}

      <label
        htmlFor={inputId}
        onDragEnter={(event) => {
          if (!dragsFiles(event)) return;
          event.preventDefault();
          dragDepth.current++;
          setDragging(true);
        }}
        onDragOver={(event) => dragsFiles(event) && event.preventDefault()}
        onDragLeave={() => {
          if (--dragDepth.current <= 0) endDrag();
        }}
        onDrop={(event) => {
          if (!dragsFiles(event)) return;
          event.preventDefault();
          endDrag();
          onAdd([...event.dataTransfer.files]);
        }}
        className={`flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1 rounded-[10px] border-[1.5px] border-dashed px-4 py-5 text-[15px] transition has-focus-visible:border-teal-600 has-focus-visible:ring-2 has-focus-visible:ring-teal-600/40 ${
          dragging ? "border-teal-600 bg-teal-100/60" : "border-line-200 hover:border-teal-600 hover:bg-teal-100/40"
        }`}
      >
        <Icon name="upload" className="size-5 shrink-0 text-teal-700" />
        <span className="font-semibold text-teal-700">{t.choose}</span>
        <span className="text-slate-500 max-sm:hidden">{t.drop}</span>
        {/* What can be uploaded, at the bar's end; on a narrow screen it wraps under. */}
        <span className="ms-auto text-sm text-slate-500">{t.uploadHint}</span>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          onChange={(event) => {
            onAdd([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-terracotta-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** The square a file is shown in: its thumbnail, or its type. */
function Thumb({ src, isPdf, children }: { src: string | null; isPdf: boolean; children?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[10px] bg-sand-50 ring-1 ring-line-200">
      {src && !failed ? (
        // A private file through our own route: not for next/image, which would cache it.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setFailed(true)} className="size-full object-cover object-top" />
      ) : (
        <span className="flex flex-col items-center gap-1 text-slate-500">
          <Icon name="file" className="size-8" />
          <span className="text-xs font-semibold">{isPdf ? "PDF" : ""}</span>
        </span>
      )}
      {children}
    </span>
  );
}

function PendingTile({
  t,
  item,
  onRetry,
  onDismiss,
}: {
  t: Labels;
  item: Pending;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const failed = item.phase === "failed";
  return (
    <div className="relative">
      <Thumb src={item.previewUrl} isPdf={item.file.type === "application/pdf"}>
        {!failed && (
          <span className="absolute inset-0 flex flex-col items-center justify-end gap-2 bg-white/60 p-3">
            {item.phase === "uploading" ? (
              <>
                <span className="text-xs font-semibold text-navy-900">
                  {format(t.uploading, { percent: item.percent })}
                </span>
                <span className="h-1.5 w-full overflow-hidden rounded-full bg-line-200">
                  <span className="block h-full bg-teal-600 transition-[width]" style={{ width: `${item.percent}%` }} />
                </span>
              </>
            ) : (
              <span className="flex items-center gap-2 text-xs font-semibold text-navy-900">
                <span className="size-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                {t.processing}
              </span>
            )}
          </span>
        )}
      </Thumb>
      {/* The same row as a finished file's, the menu's place kept, so the name doesn't move when it's done. */}
      <div className="mt-1.5 flex items-center gap-1">
        <p className="min-w-0 flex-1 truncate text-sm text-slate-700">{item.file.name}</p>
        <span aria-hidden="true" className="size-8 shrink-0" />
      </div>
      <p aria-live="polite" className="sr-only">
        {item.phase === "processing" ? t.processing : ""}
      </p>
      {failed && (
        <div role="alert" className="mt-1">
          <p className="text-sm font-medium text-terracotta-600">{t.errors[item.error ?? "generic"]}</p>
          <div className="mt-1 flex gap-3 text-sm font-semibold">
            <button type="button" onClick={onRetry} className="text-teal-700 hover:underline">
              {t.retry}
            </button>
            <button type="button" onClick={onDismiss} className="text-slate-600 hover:underline">
              {t.dismiss}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function uploadedLine(t: Labels, file: FileView, intlLocale: string) {
  const date = new Intl.DateTimeFormat(intlLocale, { dateStyle: "medium" }).format(new Date(file.createdAt));
  return file.uploaderName
    ? format(t.file.uploadedBy, { name: file.uploaderName, date })
    : format(t.file.uploadedOn, { date });
}

function FileTile({
  t,
  file,
  intlLocale,
  onRemove,
  onReplace,
}: {
  t: Labels;
  file: FileView;
  intlLocale: string;
  onRemove: () => Promise<void>;
  /** Left out where nothing can be added. */
  onReplace?: (file: File) => void;
}) {
  const url = `/api/files/${file.id}`;
  const isPdf = file.contentType === "application/pdf";
  const dialogRef = useRef<HTMLDialogElement>(null);
  // The full file loads the first time the preview opens: it can be several MB.
  const [opened, setOpened] = useState(false);

  return (
    <div>
      <button
        type="button"
        aria-label={format(t.file.preview, { name: file.name })}
        onClick={() => {
          setOpened(true);
          dialogRef.current?.showModal();
        }}
        className="block w-full rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        <Thumb src={file.hasThumbnail ? `${url}?thumbnail` : null} isPdf={isPdf} />
      </button>
      <div className="mt-1.5 flex items-center gap-1">
        <p className="min-w-0 flex-1 truncate text-sm text-slate-700" title={file.name}>
          {file.name}
        </p>
        <FileMenu
          t={t}
          file={file}
          url={url}
          meta={uploadedLine(t, file, intlLocale)}
          onRemove={onRemove}
          onReplace={onReplace}
        />
      </div>

      <dialog
        ref={dialogRef}
        aria-label={file.name}
        onClick={(event) => event.target === dialogRef.current && dialogRef.current.close()}
        className="m-auto w-[min(92vw,720px)] rounded-card bg-white p-0 shadow-soft backdrop:bg-navy-900/50"
      >
        <div className="flex items-center gap-3 border-b border-line-200 px-4 py-3">
          <p className="min-w-0 flex-1 truncate font-semibold text-navy-900">{file.name}</p>
          <button
            type="button"
            aria-label={t.file.close}
            onClick={() => dialogRef.current?.close()}
            className="inline-flex size-9 items-center justify-center rounded-lg text-navy-900 hover:bg-navy-900/5"
          >
            <Icon name="x" className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto bg-sand-50 p-4">
          {opened && <PreviewImage src={isPdf ? (file.hasThumbnail ? `${url}?thumbnail` : null) : url} />}
        </div>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <p className="min-w-0 flex-1 text-sm text-slate-600">{uploadedLine(t, file, intlLocale)}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener"
            className="text-[15px] font-semibold text-teal-700 hover:underline"
          >
            {t.file.openFull}
          </a>
        </div>
      </dialog>
    </div>
  );
}

/** The preview's image: the file itself, or a PDF's first page. */
function PreviewImage({ src }: { src: string | null }) {
  if (!src) {
    return (
      <div className="flex justify-center py-10 text-slate-500">
        <Icon name="file" className="size-12" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="mx-auto max-w-full rounded-[6px] bg-white shadow-soft" />;
}

function FileMenu({
  t,
  file,
  url,
  meta,
  onRemove,
  onReplace,
}: {
  t: Labels;
  file: FileView;
  url: string;
  meta: string;
  onRemove: () => Promise<void>;
  onReplace?: (file: File) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const replaceId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center px-3 py-2 text-start text-[15px] text-navy-900 hover:bg-navy-900/5";

  return (
    <div ref={ref} className="relative flex">
      <button
        type="button"
        aria-label={format(t.file.menu, { name: file.name })}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setConfirming(false);
        }}
        className="inline-flex size-8 items-center justify-center rounded-lg text-slate-600 hover:bg-navy-900/5"
      >
        <Icon name="more" className="size-5" />
      </button>
      {open && (
        <div className="absolute end-0 top-9 z-20 w-60 overflow-hidden rounded-[10px] border border-line-200 bg-white py-1 shadow-soft">
          <p className="border-b border-line-200 px-3 pt-1 pb-2 text-xs text-slate-500">{meta}</p>
          {confirming ? (
            <div className="px-3 py-2">
              <p className="text-[15px] text-navy-900">{t.file.confirmRemove}</p>
              <div className="mt-2 flex gap-3 text-[15px] font-semibold">
                <button
                  type="button"
                  disabled={removing}
                  onClick={async () => {
                    setRemoving(true);
                    await onRemove();
                    setRemoving(false);
                    setOpen(false);
                  }}
                  className="text-terracotta-600 hover:underline"
                >
                  {t.file.remove}
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="text-slate-600 hover:underline">
                  {t.file.cancel}
                </button>
              </div>
            </div>
          ) : (
            <>
              <a href={url} target="_blank" rel="noopener" className={item} onClick={() => setOpen(false)}>
                {t.file.open}
              </a>
              {onReplace && (
                <>
                  <label htmlFor={replaceId} className={`${item} cursor-pointer`}>
                    {t.file.replace}
                  </label>
                  <input
                    id={replaceId}
                    type="file"
                    accept={accept}
                    className="sr-only"
                    onChange={(event) => {
                      const replacement = event.target.files?.[0];
                      if (replacement) onReplace(replacement);
                      event.target.value = "";
                      setOpen(false);
                    }}
                  />
                </>
              )}
              <button type="button" className={`${item} text-terracotta-600`} onClick={() => setConfirming(true)}>
                {t.file.remove}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
