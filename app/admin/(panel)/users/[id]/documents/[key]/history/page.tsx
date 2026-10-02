import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { regionName } from "@/i18n/format";
import { format, loadMessages, type Messages } from "@/i18n/messages";
import { requireAdmin } from "@/lib/admin";
import { allCaseChecks, allCaseFiles, caseListChanges, listChangesFor } from "@/lib/admin-documents";
import { findUser } from "@/lib/admin-users";
import { caseDocuments } from "@/lib/case-documents";
import { caseChecks } from "@/lib/checks/store";
import type { RequiredDocument } from "@/lib/documents/build";
import { documentTitle } from "@/lib/documents/titles";
import { PageHeading } from "@/components/admin/admin-ui";
import { DocumentTimeline } from "@/components/admin/document-history";
import { CheckStatus, DocumentMeta, documentsHref, FileRow } from "@/components/admin/document-card";
import { Icon } from "@/components/icons";

type Props = PageProps<"/admin/users/[id]/documents/[key]/history">;

/** The document key from the URL. Next passes the param still encoded (`id%3Acountry`). */
function keyOf(param: string) {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

function titleOf(key: string, item: RequiredDocument | undefined, messages: Messages) {
  const items = messages.app.documents.items;
  if (item) return format(items[item.id].title, { country: item.country ? regionName(item.country, "en") : "" });
  return documentTitle(key, messages.app.documents, "en") ?? key;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params;
  return { title: `Document history: ${keyOf(key)}` };
}

// One document of the user's case, and everything that happened to it:
// files uploaded and removed, every check that ran (with the files it saw),
// and the details changes that put it on the list or took it off.
export default async function AdminDocumentHistoryPage({ params }: Props) {
  await requireAdmin();
  const { id, key: param } = await params;
  const user = await findUser(id);
  if (!user?.caseId) notFound();
  const key = keyOf(param);

  const [{ list }, allFiles, runs, caseChanges, current, messages] = await Promise.all([
    caseDocuments(user.caseId),
    allCaseFiles(user.caseId),
    allCaseChecks(user.caseId, key),
    caseListChanges(user.caseId),
    caseChecks(user.caseId),
    loadMessages("en"),
  ]);
  const item = list.find((d) => d.key === key);
  const files = allFiles.filter((f) => f.documentKey === key);
  const changes = listChangesFor(caseChanges, key);
  // A key the case never had: nothing on the list, uploaded or checked under it.
  if (!item && !files.length && !runs.length && !changes.length) notFound();

  const check = current.get(key);
  const ratings = messages.app.documentsPage.check.ratings;
  // The couple's result is the latest finished run (lib/checks/store.ts caseChecks).
  const currentRunId = check?.result ? (runs.find((r) => r.state === "done" && r.rating)?.id ?? null) : null;
  const checked = new Set(check?.fileIds);
  // Removed files are in the timeline, where they were removed.
  const uploaded = files.filter((f) => !f.deletedAt);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href={documentsHref(user.id, key)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
      >
        <Icon name="arrow" className="size-4 rotate-180" />
        Documents
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading title={titleOf(key, item, messages)}>
          <DocumentMeta docKey={key} optional={item?.optional} check={check} />
          {!item && <p className="mt-1">No longer on the case’s list.</p>}
        </PageHeading>
        <CheckStatus check={check} files={files} ratings={ratings} />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-navy-900">Files now</h2>
        {uploaded.length > 0 ? (
          <ul className="mt-3 divide-y divide-line-200 rounded-card border border-line-200 bg-white">
            {uploaded.map((file) => (
              <FileRow key={file.id} file={file} inLatestCheck={!!check?.result && checked.has(file.id)} />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[15px] text-slate-500">No files uploaded.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy-900">History</h2>
        <p className="mt-1 text-[15px] text-slate-500">
          Newest first. {files.length} {files.length === 1 ? "file" : "files"} uploaded, {runs.length}{" "}
          {runs.length === 1 ? "check" : "checks"} run.
        </p>
        <div className="mt-5">
          <DocumentTimeline
            files={files}
            runs={runs}
            listChanges={changes}
            currentRunId={currentRunId}
            ratings={ratings}
          />
        </div>
      </section>
    </div>
  );
}
