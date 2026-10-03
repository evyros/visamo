import type { Metadata } from "next";
import Link from "next/link";
import { loadMessages } from "@/i18n/messages";
import { requireAdmin } from "@/lib/admin";
import { dismissalCounts, listDismissals, type AdminDismissal, type DismissalFilter } from "@/lib/admin-dismissals";
import { documentTitle } from "@/lib/documents/titles";
import { formatDateTime, PageHeading, Pill, reviewOutcomeLabels } from "@/components/admin/admin-ui";
import { historyHref } from "@/components/admin/document-card";
import { DismissalReviewForm } from "@/components/admin/dismissal-review-form";
import { reopen } from "./actions";

export const metadata: Metadata = { title: "Dismissed findings" };

type Messages = Awaited<ReturnType<typeof loadMessages>>;

// The findings couples dismissed from their document checks as wrong, to
// learn where the checker goes wrong: open ones to review, and the reviewed
// ones with what was concluded. The counts show which documents' checks
// to look at first (lib/documents/checks.ts).
export default async function AdminDismissalsPage({ searchParams }: PageProps<"/admin/dismissals">) {
  await requireAdmin();
  const filter: DismissalFilter = (await searchParams).status === "reviewed" ? "reviewed" : "open";
  const [rows, counts, messages] = await Promise.all([listDismissals(filter), dismissalCounts(), loadMessages("en")]);
  const title = (key: string) => documentTitle(key, messages.app.documents, "en") ?? key;
  const tab = (to: DismissalFilter, label: string) => (
    <Link
      href={to === "open" ? "/dismissals" : "/dismissals?status=reviewed"}
      aria-current={filter === to ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 text-[15px] font-semibold ${
        filter === to ? "bg-navy-900 text-white" : "text-navy-900 hover:bg-navy-900/5"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none">
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeading title="Dismissed findings">
          Findings couples dismissed from a document check as wrong, newest first. Each one is out of the couple’s
          result, and their next check of that document is asked to look at it again. Undone ones are here too.
        </PageHeading>

        {counts.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-card border border-line-200 bg-white">
            <table className="w-full min-w-[520px] text-start text-[15px]">
              <thead className="border-b border-line-200 bg-sand-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">Document</th>
                  <th className="px-4 py-3 text-end">Dismissed</th>
                  <th className="px-4 py-3 text-end">To review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-200 tabular-nums">
                {counts.map((c) => (
                  <tr key={c.documentKey}>
                    <td className="px-4 py-2.5 text-navy-900">{title(c.documentKey)}</td>
                    <td className="px-4 py-2.5 text-end text-slate-700">{c.total}</td>
                    <td className="px-4 py-2.5 text-end text-slate-700">{c.open}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav aria-label="Filter" className="mt-6 flex gap-2">
          {tab("open", "To review")}
          {tab("reviewed", "Reviewed")}
        </nav>

        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <DismissalCard row={row} title={title(row.documentKey)} messages={messages} />
            </li>
          ))}
          {rows.length === 0 && (
            <li className="rounded-card border border-line-200 bg-white px-4 py-10 text-center text-slate-500">
              {filter === "open" ? "Nothing to review." : "Nothing reviewed yet."}
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}

function DismissalCard({ row, title, messages }: { row: AdminDismissal; title: string; messages: Messages }) {
  const check = messages.app.documentsPage.check;
  const { title: findingTitle, detail } = row.finding.en;
  return (
    <article className="rounded-card border border-line-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-line-200 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          {row.userId ? (
            <Link href={historyHref(row.userId, row.documentKey, row.checkId)} className="font-semibold text-navy-900 hover:underline">
              {title}
            </Link>
          ) : (
            <span className="font-semibold text-navy-900">{title}</span>
          )}
          <Pill tone={row.kind === "issue" ? "crimson" : "amber"}>{row.kind === "issue" ? "Issue" : "Tip"}</Pill>
          {row.undoneAt && <Pill>Undone {formatDateTime(row.undoneAt)}</Pill>}
        </div>
        <span className="text-[13px] text-slate-500">
          {row.dismissedByName ?? "A deleted account"} · {formatDateTime(row.createdAt)}
        </span>
      </header>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        <div className="rounded-lg border-s-4 border-s-line-200 bg-sand-50 px-3 py-2.5">
          {row.finding.part && <p className="text-xs font-semibold text-slate-600">{check.parts[row.finding.part]}</p>}
          {findingTitle && <p className="text-[15px] font-semibold text-navy-900">{findingTitle}</p>}
          <p className="mt-0.5 text-sm text-slate-700">{detail}</p>
        </div>
        <p className="text-[15px] text-slate-700">
          <span className="font-semibold text-navy-900">{check.dismiss.reasons[row.reason]}</span>
          {row.note && <> · “{row.note}”</>}
        </p>

        {row.reviewedAt ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line-200 pt-3 text-sm text-slate-600">
            <Pill tone="teal">{row.reviewOutcome ? reviewOutcomeLabels[row.reviewOutcome] : "Reviewed"}</Pill>
            {row.reviewNote && <span>{row.reviewNote}</span>}
            <span className="text-slate-500">
              {row.reviewedBy} · {formatDateTime(row.reviewedAt)}
            </span>
            <form action={reopen} className="ms-auto">
              <input type="hidden" name="id" value={row.id} />
              <button type="submit" className="font-semibold text-teal-700 hover:underline">
                Reopen
              </button>
            </form>
          </div>
        ) : (
          <div className="border-t border-line-200 pt-3">
            <DismissalReviewForm id={row.id} />
          </div>
        )}
      </div>
    </article>
  );
}
