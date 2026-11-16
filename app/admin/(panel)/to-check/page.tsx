import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { loadMessages } from "@/i18n/messages";
import { requireAdmin } from "@/lib/admin";
import { freeCheckQueue } from "@/lib/admin-free-checks";
import { stillRunning } from "@/lib/checks/store";
import { documentTitle } from "@/lib/documents/titles";
import { formatDateTime, PageHeading, Pill } from "@/components/admin/admin-ui";
import { documentsHref, ratingTone } from "@/components/admin/document-card";
import { FreeCheckForm } from "@/components/admin/free-check-form";

export const metadata: Metadata = { title: "To check" };

// For checking a document from the list (FreeCheckForm): a check can take minutes, as in app/api/documents/check.
export const maxDuration = 300;

// The free check's to-do list (lib/admin-free-checks.ts), across cases
// without Full file check: results waiting for approval, cases nobody has
// checked yet, and approved documents whose files changed since, which can
// be checked again right here. Approving and discarding are on the
// document's card, next to its findings.
export default async function AdminToCheckPage() {
  await requireAdmin();
  const [{ pending, waiting, changed }, messages] = await Promise.all([freeCheckQueue(), loadMessages("en")]);
  const title = (key: string) => documentTitle(key, messages.app.documents, "en") ?? key;
  const ratings = messages.app.documentsPage.check.ratings;

  return (
    <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none">
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeading title="To check">
          For cases without Full file check. Check a document here or from its card on the user’s documents page,
          then approve the result on the card. A case gets one result in full: the couple’s own free check, or the
          first one you approve, which uses up their free check. Every other one you approve is locked.
        </PageHeading>

        <Section title="Waiting for approval" empty="No results waiting.">
          {pending.map((p) => (
            <Row
              key={`${p.caseId}/${p.documentKey}`}
              href={documentsHref(p.owner.id, p.documentKey)}
              who={p.owner}
              what={title(p.documentKey)}
              when={`checked ${formatDateTime(p.startedAt)}`}
            >
              {p.state === "running" && stillRunning(p.startedAt) ? (
                <Pill tone="navy">Checking now</Pill>
              ) : p.state !== "done" ? (
                <Pill tone="terracotta">{p.state === "failed" ? "Check failed" : "Check didn’t finish"}</Pill>
              ) : (
                p.rating && <Pill tone={ratingTone[p.rating]}>{ratings[p.rating]}</Pill>
              )}
            </Row>
          ))}
        </Section>

        <Section title="Not checked yet" empty="Every case with uploads has a result shown in full.">
          {waiting.map((w) => (
            <Row
              key={w.caseId}
              href={documentsHref(w.owner.id, w.startWith ?? undefined)}
              who={w.owner}
              what={w.startWith ? `Start with: ${title(w.startWith)}` : "Nothing uploaded has a check written yet"}
              when={w.firstUploadAt ? `first upload ${formatDateTime(w.firstUploadAt)}` : ""}
            />
          ))}
        </Section>

        <Section title="New files since the approved result" empty="No approved document has changed.">
          {changed.map((c) => (
            <Row
              key={`${c.caseId}/${c.documentKey}`}
              href={documentsHref(c.owner.id, c.documentKey)}
              who={c.owner}
              what={title(c.documentKey)}
              when={`approved result from ${formatDateTime(c.startedAt)}`}
              action={
                <FreeCheckForm
                  userId={c.owner.id}
                  documentKey={c.documentKey}
                  approveRunId={null}
                  discardRunId={null}
                  canCheck
                  checked
                />
              }
            />
          ))}
        </Section>
      </div>
    </main>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-navy-900">
        {title} <span className="font-normal text-slate-500">({children.length})</span>
      </h2>
      <ul className="mt-3 divide-y divide-line-200 rounded-card border border-line-200 bg-white">
        {children.length ? children : <li className="px-4 py-8 text-center text-slate-500">{empty}</li>}
      </ul>
    </section>
  );
}

/** A row linking to the document's card, with `action` beside the link (a form can't sit inside one). */
function Row({
  href,
  who,
  what,
  when,
  action,
  children,
}: {
  href: string;
  who: { name: string; email: string };
  what: string;
  when: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="hover:bg-sand-50">
      <Link href={href} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-[15px]">
        <span className="font-semibold text-navy-900">{who.name || who.email}</span>
        <span className="text-slate-700">{what}</span>
        {children}
        <span className="ms-auto text-sm text-slate-500">{when}</span>
      </Link>
      {action && <div className="px-4 pb-3">{action}</div>}
    </li>
  );
}
