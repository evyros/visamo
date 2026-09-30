import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { regionName } from "@/i18n/format";
import { format, loadMessages } from "@/i18n/messages";
import { requireAdmin } from "@/lib/admin";
import { allCaseChecks, allCaseFiles, caseListChanges, listChangesFor } from "@/lib/admin-documents";
import { caseMembers, findUser } from "@/lib/admin-users";
import { caseDocuments } from "@/lib/case-documents";
import { caseChecks } from "@/lib/checks/store";
import type { Owner } from "@/lib/documents/catalog";
import { ownerOrder } from "@/lib/documents/progress";
import { documentTitle } from "@/lib/documents/titles";
import { BalanceFigure, PageHeading, planLabel, Stat } from "@/components/admin/admin-ui";
import { DocumentCard, historyHref } from "@/components/admin/document-card";
import { historyEntries } from "@/components/admin/document-history";

export async function generateMetadata({ params }: PageProps<"/admin/users/[id]/documents">): Promise<Metadata> {
  const user = await findUser((await params).id);
  return { title: user ? `${user.name}: documents` : "Documents" };
}

// The user's case's document list, as the couple sees it, plus what they
// don't: removed files, failed checks, and what each check cost.
export default async function AdminUserDocumentsPage({ params }: PageProps<"/admin/users/[id]/documents">) {
  await requireAdmin();
  const user = await findUser((await params).id);
  if (!user) notFound();

  if (!user.caseId) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeading title="Documents">
          {user.name} hasn’t finished onboarding, so there’s no case and no document list yet.
        </PageHeading>
      </div>
    );
  }

  const caseId = user.caseId;
  const [{ people, list }, files, runs, changes, current, members, messages] = await Promise.all([
    caseDocuments(caseId),
    allCaseFiles(caseId),
    allCaseChecks(caseId),
    caseListChanges(caseId),
    caseChecks(caseId),
    caseMembers(caseId),
    loadMessages("en"),
  ]);
  const catalog = messages.app.documents.items;
  const ratings = messages.app.documentsPage.check.ratings;
  const partner = members.find((m) => m.id !== user.id);
  const nameOf = (israeli: boolean) => people.find((p) => p.isIsraeli === israeli)?.name ?? "";
  const groupTitle: Record<Owner, string> = {
    couple: "The couple",
    israeli: `${nameOf(true)} (Israeli)`,
    foreign: `${nameOf(false)} (foreign partner)`,
    children: "Children",
  };

  const filesOf = (key: string) => files.filter((f) => f.documentKey === key);
  const runsOf = (key: string) => runs.filter((r) => r.documentKey === key);
  /** Entries on the document's history page. */
  const historyOf = (key: string) => historyEntries(filesOf(key), runsOf(key), listChangesFor(changes, key)).length;

  // Files and checks whose document left the list when the details changed.
  const listed = new Set(list.map((d) => d.key));
  const retired = [...new Set([...files.map((f) => f.documentKey), ...runs.map((r) => r.documentKey)])].filter(
    (key) => !listed.has(key),
  );

  const results = [...current.values()].map((c) => c.result).filter((r) => r !== null);
  const uploaded = list.filter((d) => filesOf(d.key).some((f) => !f.deletedAt)).length;
  const removed = files.filter((f) => f.deletedAt).length;
  const failed = runs.filter((r) => r.state === "failed").length;
  const cost = runs.reduce((total, r) => total + (r.costUsd ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading title="Documents">
        {partner ? (
          <>
            Shared case with{" "}
            <Link href={`/users/${partner.id}/documents`} className="font-semibold text-teal-700 hover:underline">
              {partner.name}
            </Link>{" "}
            ({partner.email}). {user.name} is the case’s {user.role}.
          </>
        ) : (
          <>The partner hasn’t joined the case.</>
        )}
      </PageHeading>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Uploaded"
          value={`${uploaded} / ${list.length}`}
          note={`${list.filter((d) => d.optional).length} of the documents optional`}
        />
        <Stat
          label="Checked"
          value={results.length}
          note={`${[...current.values()].filter((c) => c.fresh).length} up to date · ${results.filter((r) => r.rating === "needsFixing").length} ${ratings.needsFixing.toLowerCase()}`}
        />
        <Stat label="Files" value={files.length - removed} note={`${removed} removed`} />
        <Stat
          label="Check runs"
          value={runs.length}
          note={`${failed} failed · $${cost.toFixed(2)} spent`}
        />
        <Stat label="Checks" value={<BalanceFigure left={user.checksLeft!} totals={user.totals!.checks} />} />
        <Stat
          label="Messages"
          value={<BalanceFigure left={user.messagesLeft!} totals={user.totals!.messages} />}
          note={`Plan: ${planLabel[user.plan!] ?? user.plan}`}
        />
      </div>

      {ownerOrder.map((owner) => {
        const items = list.filter((d) => d.owner === owner);
        if (!items.length) return null;
        return (
          <section key={owner} className="mt-10">
            <h2 className="text-lg font-semibold text-navy-900">{groupTitle[owner]}</h2>
            <div className="mt-3 space-y-3">
              {items.map((d) => {
                const country = d.country ? regionName(d.country, "en") : "";
                return (
                  <DocumentCard
                    key={d.key}
                    title={format(catalog[d.id].title, { country })}
                    docKey={d.key}
                    optional={d.optional}
                    files={filesOf(d.key)}
                    historyCount={historyOf(d.key)}
                    checkCount={runsOf(d.key).length}
                    historyHref={historyHref(user.id, d.key)}
                    check={current.get(d.key)}
                    ratings={ratings}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      {retired.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-navy-900">No longer on the list</h2>
          <p className="mt-1 text-[15px] text-slate-500">
            Uploaded or checked before the case details changed and took them off the list.
          </p>
          <div className="mt-3 space-y-3">
            {retired.map((key) => (
              <DocumentCard
                key={key}
                title={documentTitle(key, catalog, "en") ?? key}
                docKey={key}
                files={filesOf(key)}
                historyCount={historyOf(key)}
                checkCount={runsOf(key).length}
                historyHref={historyHref(user.id, key)}
                ratings={ratings}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
