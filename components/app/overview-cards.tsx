import Link from "next/link";
import type { ReactNode } from "react";
import type { Progress } from "@/lib/documents/progress";

// The overview's cards. The page works out every text; these only lay it out.

export function OverviewCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const linkClass = "text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline";

function Bar({ progress, label, thin = false }: { progress: Progress; label: string; thin?: boolean }) {
  const { done, total } = progress;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={label}
      className={`overflow-hidden rounded-full bg-line-200 ${thin ? "h-1.5" : "h-2"}`}
    >
      <div
        className="h-full rounded-full bg-teal-600 transition-[width]"
        style={{ width: `${total ? (done / total) * 100 : 0}%` }}
      />
    </div>
  );
}

export function ProgressCard({
  title,
  summary,
  allDone,
  open,
  progress,
  groups,
}: {
  title: string;
  summary: string;
  /** Shown once everything counted is uploaded. */
  allDone: string;
  open: string;
  progress: Progress;
  /** One row per whose documents they are, linking to that group on the documents page. */
  groups: { href: string; title: string; summary: string; progress: Progress }[];
}) {
  const complete = progress.total > 0 && progress.done === progress.total;
  return (
    <OverviewCard
      title={title}
      action={
        <Link href="/file/documents" className={linkClass}>
          {open}
        </Link>
      }
    >
      <p className="font-semibold text-navy-900">{summary}</p>
      <div className="mt-3">
        <Bar progress={progress} label={summary} />
      </div>
      {complete && <p className="mt-3 text-[15px] text-teal-700">{allDone}</p>}
      <ul className="mt-5 space-y-3">
        {groups.map((g) => (
          <li key={g.href}>
            <Link href={g.href} className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-teal-600">
              <span className="flex items-baseline justify-between gap-3 text-[15px]">
                <span className="text-navy-900 group-hover:underline">{g.title}</span>
                <span className="shrink-0 text-sm text-slate-600">{g.summary}</span>
              </span>
              <span className="mt-1.5 block">
                <Bar progress={g.progress} label={`${g.title}: ${g.summary}`} thin />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </OverviewCard>
  );
}

export type DetailsSection = { title: string; rows: { label: string; value: string }[] };

export function DetailsCard({
  title,
  intro,
  sections,
  action,
}: {
  title: string;
  intro: string;
  sections: DetailsSection[];
  /** Edit, with how many edits are left, or a way to contact support. */
  action: ReactNode;
}) {
  return (
    <OverviewCard title={title} action={action}>
      <p className="text-[15px] text-slate-700">{intro}</p>
      <div className="mt-5 grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="font-semibold text-navy-900">{section.title}</h3>
            <dl className="mt-2 space-y-2">
              {section.rows.map((row) => (
                <div key={row.label}>
                  <dt className="text-sm text-slate-500">{row.label}</dt>
                  <dd className="text-[15px] text-navy-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </OverviewCard>
  );
}

/**
 * The link to edit the details. Once no edits are left it stays in place,
 * disabled, and says why on hover or focus. It's aria-disabled rather than
 * disabled so it can still take focus, which is how the reason shows on a phone.
 */
export function DetailsAction({ canEdit, edit, noEditsLeft }: { canEdit: boolean; edit: string; noEditsLeft: string }) {
  if (canEdit) {
    return (
      <Link href="/file/details" className={linkClass}>
        {edit}
      </Link>
    );
  }
  return (
    <span className="group relative">
      <button
        type="button"
        aria-disabled
        aria-describedby="details-no-edits"
        className="cursor-not-allowed text-[15px] font-semibold text-slate-400"
      >
        {edit}
      </button>
      <span
        id="details-no-edits"
        role="tooltip"
        className="pointer-events-none invisible absolute end-0 top-full z-10 mt-2 w-56 rounded-lg bg-navy-900 px-3 py-2 text-sm text-white opacity-0 shadow-soft transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {noEditsLeft}
      </span>
    </span>
  );
}

export type ActivityItem = { id: string; text: string; detail: string | null; when: string; date: string };

export function ActivityCard({ title, empty, items }: { title: string; empty: string; items: ActivityItem[] }) {
  return (
    <OverviewCard title={title}>
      {items.length === 0 ? (
        <p className="text-[15px] text-slate-600">{empty}</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3">
              <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-teal-600" />
              <span className="min-w-0">
                <span className="block text-[15px] wrap-anywhere text-navy-900">{item.text}</span>
                {item.detail && <span className="block text-sm text-slate-600">{item.detail}</span>}
                <time dateTime={item.date} className="block text-sm text-slate-500">
                  {item.when}
                </time>
              </span>
            </li>
          ))}
        </ol>
      )}
    </OverviewCard>
  );
}
