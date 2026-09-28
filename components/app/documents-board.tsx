"use client";

import { upload } from "@vercel/blob/client";
import { useCallback, useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { deleteFile, finishUpload, startUpload, type UploadError } from "@/app/(app)/(main)/file/documents/actions";
import type { Messages } from "@/i18n/messages";
import { format } from "@/i18n/messages";
import type { Owner } from "@/lib/documents/catalog";
import { ACCEPTED_TYPES, MAX_FILE_BYTES, MAX_FILES_PER_SLOT, isAcceptedType, type FileSlot } from "@/lib/files/rules";
import type { FileView } from "@/lib/files/view";
import { Icon } from "@/components/icons";

// The documents page: the case's list, grouped by whose document it is, each
// document a card that opens to its uploads. A file goes through two phases:
// uploading (straight to the Blob store, with progress) and processing
// (finishUpload checks it, records it and makes its thumbnail). Then the
// server's thumbnail replaces the local preview.

type Labels = Messages["app"]["documentsPage"];

export type DocumentItem = {
  key: string;
  title: string;
  description: string;
  /** Copies, certification, exemption. */
  badges: string[];
  /** Why it's on the list; null for what every couple needs. */
  because: string | null;
  mayNeedTranslation: boolean;
};

export type DocumentGroup = { owner: Owner; title: string; items: DocumentItem[] };

/** A file on its way: not in the case's files until finishUpload succeeds. */
type Pending = {
  id: string;
  documentKey: string;
  slot: FileSlot;
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
  files: initialFiles,
  intlLocale,
}: {
  t: Labels;
  groups: DocumentGroup[];
  files: FileView[];
  intlLocale: string;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [pending, setPending] = useState<Pending[]>([]);
  // Per document and slot: an error about files that weren't added.
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});
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
        const started = await startUpload(item.documentKey, item.slot);
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
        slot: item.slot,
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

  function add(documentKey: string, slot: FileSlot, chosen: File[], replaces?: string) {
    const slotKey = `${documentKey}/${slot}`;
    const here =
      files.filter((f) => f.documentKey === documentKey && f.slot === slot && f.id !== replaces).length +
      pending.filter((p) => p.documentKey === documentKey && p.slot === slot).length;
    let error: string | undefined;
    const accepted = chosen.filter((file) => {
      if (!isAcceptedType(file.type)) error = t.errors.type;
      else if (file.size > MAX_FILE_BYTES) error = t.errors.size;
      else return true;
      return false;
    });
    const room = Math.max(0, MAX_FILES_PER_SLOT - here);
    if (accepted.length > room) error = t.errors.tooMany;
    setSlotErrors((errors) => ({ ...errors, [slotKey]: error ?? "" }));

    const items: Pending[] = accepted.slice(0, room).map((file) => ({
      id: crypto.randomUUID(),
      documentKey,
      slot,
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

  const items = groups.flatMap((g) => g.items);
  const ready = items.filter((i) => files.some((f) => f.documentKey === i.key && f.slot === "original")).length;

  return (
    <>
      <section className="mt-6 rounded-card border border-line-200 bg-white p-5">
        <p className="font-semibold text-navy-900">{format(t.progress, { done: ready, total: items.length })}</p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={ready}
          aria-label={format(t.progress, { done: ready, total: items.length })}
          className="mt-3 h-2 overflow-hidden rounded-full bg-line-200"
        >
          <div
            className="h-full rounded-full bg-teal-600 transition-[width]"
            style={{ width: `${items.length ? (ready / items.length) * 100 : 0}%` }}
          />
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.owner} className="mt-8">
          <h2 className="text-lg font-semibold text-navy-900">{group.title}</h2>
          <ul className="mt-3 space-y-3">
            {group.items.map((item) => (
              <li key={item.key}>
                <DocumentCard
                  t={t}
                  item={item}
                  intlLocale={intlLocale}
                  files={files.filter((f) => f.documentKey === item.key)}
                  pending={pending.filter((p) => p.documentKey === item.key)}
                  errors={{
                    original: slotErrors[`${item.key}/original`],
                    translation: slotErrors[`${item.key}/translation`],
                  }}
                  onAdd={(slot, chosen, replaces) => add(item.key, slot, chosen, replaces)}
                  onRemove={remove}
                  onRetry={retry}
                  onDismiss={dismiss}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

type SlotHandlers = {
  onAdd: (slot: FileSlot, files: File[], replaces?: string) => void;
  onRemove: (fileId: string) => Promise<void>;
  onRetry: (item: Pending) => void;
  onDismiss: (item: Pending) => void;
};

function DocumentCard({
  t,
  item,
  intlLocale,
  files,
  pending,
  errors,
  ...handlers
}: {
  t: Labels;
  item: DocumentItem;
  intlLocale: string;
  files: FileView[];
  pending: Pending[];
  errors: Partial<Record<FileSlot, string>>;
} & SlotHandlers) {
  const [open, setOpen] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const bodyId = useId();
  const of = (slot: FileSlot) => ({
    files: files.filter((f) => f.slot === slot),
    pending: pending.filter((p) => p.slot === slot),
  });
  const original = of("original");
  const translation = of("translation");
  const uploaded = original.files.length > 0;
  const hasTranslation = translation.files.length > 0;

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
            <Status t={t} uploaded={uploaded} translated={hasTranslation} />
          </span>
          {item.badges.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {item.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-sand-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-line-200"
                >
                  {badge}
                </span>
              ))}
            </span>
          )}
        </span>
        <Icon
          name="chevronDown"
          className={`mt-0.5 size-5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div id={bodyId} hidden={!open} className="border-t border-line-200 px-4 pt-4 pb-5 sm:px-5">
        <p className="text-[15px] text-slate-700">{item.description}</p>
        {item.because && <p className="mt-2 text-sm text-slate-500">{item.because}</p>}

        <UploadArea
          t={t}
          slot="original"
          label={t.document}
          hint={t.uploadHint}
          intlLocale={intlLocale}
          error={errors.original}
          {...original}
          {...handlers}
        />

        {item.mayNeedTranslation &&
          (showTranslation || hasTranslation || translation.pending.length > 0 ? (
            <UploadArea
              t={t}
              slot="translation"
              label={t.translation.title}
              hint={t.translation.note}
              intlLocale={intlLocale}
              error={errors.translation}
              {...translation}
              {...handlers}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowTranslation(true)}
              className="mt-4 text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline"
            >
              {t.translation.add}
            </button>
          ))}

        {/* Reserved for "Ask about this document": the chat about this card. */}
      </div>
    </div>
  );
}

function Status({ t, uploaded, translated }: { t: Labels; uploaded: boolean; translated: boolean }) {
  if (!uploaded) {
    return (
      <span className="rounded-full bg-sand-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
        {t.status.todo}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
      <Icon name="checkCircle" className="size-3.5" />
      {t.status.uploaded}
      {translated && <span className="font-medium"> {t.withTranslation}</span>}
    </span>
  );
}

const accept = ACCEPTED_TYPES.join(",");

function UploadArea({
  t,
  slot,
  label,
  hint,
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
  slot: FileSlot;
  label: string;
  hint: string;
  intlLocale: string;
  files: FileView[];
  pending: Pending[];
  error?: string;
} & SlotHandlers) {
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    onAdd(slot, [...event.dataTransfer.files]);
  }

  return (
    <div className="mt-5">
      <h3 className="text-[15px] font-semibold text-navy-900">{label}</h3>
      {(files.length > 0 || pending.length > 0) && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((file) => (
            <li key={file.id}>
              <FileTile
                t={t}
                file={file}
                intlLocale={intlLocale}
                onRemove={() => onRemove(file.id)}
                onReplace={(replacement) => onAdd(slot, [replacement], file.id)}
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
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-dashed px-4 py-5 text-center transition has-focus-visible:ring-2 has-focus-visible:ring-teal-600/40 ${
          dragging ? "border-teal-600 bg-teal-100/50" : "border-line-200 hover:border-teal-600"
        }`}
      >
        <Icon name="upload" className="size-6 text-teal-700" />
        <span className="text-[15px] font-semibold text-teal-700">{t.choose}</span>
        <span className="text-sm text-slate-500 max-sm:hidden">{t.drop}</span>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          onChange={(event) => {
            onAdd(slot, [...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
      </label>
      {error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-terracotta-600">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">{hint}</p>
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
    <div>
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
      <p className="mt-1.5 truncate text-sm text-slate-700">{item.file.name}</p>
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
  onReplace: (file: File) => void;
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
  onReplace: (file: File) => void;
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
    <div ref={ref} className="relative">
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
