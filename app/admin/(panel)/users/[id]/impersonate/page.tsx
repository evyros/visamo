import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { findUser } from "@/lib/admin-users";
import { IMPERSONATION_TTL_MS, listImpersonations, type Impersonation } from "@/lib/impersonation";
import { hasSignInMethod } from "@/lib/session";
import { formatDateTime, PageHeading, Pill, type PillTone } from "@/components/admin/admin-ui";
import { impersonate } from "./actions";

export async function generateMetadata({ params }: PageProps<"/admin/users/[id]/impersonate">): Promise<Metadata> {
  const user = await findUser((await params).id);
  return { title: user ? `${user.name}: sign in as` : "Sign in as" };
}

type Status = "live" | "ended" | "expired" | "unused";

const statuses: Record<Status, { label: string; tone: PillTone }> = {
  live: { label: "Signed in", tone: "amber" },
  ended: { label: "Exited", tone: "slate" },
  expired: { label: "Expired", tone: "neutral" },
  unused: { label: "Link not used", tone: "neutral" },
};

// Signing in to the app as the user (lib/impersonation.ts), and every time
// it was done.
export default async function AdminUserImpersonatePage({ params }: PageProps<"/admin/users/[id]/impersonate">) {
  await requireAdmin();
  const user = await findUser((await params).id);
  if (!user) notFound();
  const [rows, canSignIn] = await Promise.all([listImpersonations(user.id), hasSignInMethod(user.id)]);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading title="Sign in as">
        Open the app as {user.name}, for an hour or until you close the browser. They stay signed in and get no
        email, and everything you do counts as theirs: messages, checks, uploads and settings.
      </PageHeading>

      <section className="mt-6 rounded-card border border-line-200 bg-white p-5 sm:p-6">
        {canSignIn ? (
          <form action={impersonate} className="flex flex-wrap items-center gap-4">
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-[10px] bg-teal-600 px-6 text-base font-semibold text-white shadow-soft transition-colors hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
            >
              Open the app as {user.name}
            </button>
            <p className="text-sm text-slate-500">
              It replaces any app session in this browser. Use the banner’s Exit button to come back.
            </p>
          </form>
        ) : (
          <p className="text-[15px] text-slate-700">{user.name} hasn’t finished sign-up, so there’s nothing to open yet.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy-900">History</h2>
        <p className="mt-1 text-[15px] text-slate-500">Newest first.</p>
        <ul className="mt-3 divide-y divide-line-200 rounded-card border border-line-200 bg-white">
          {rows.map(({ impersonation, live }) => (
            <Row key={impersonation.id} row={impersonation} status={statusOf(impersonation, live)} />
          ))}
          {rows.length === 0 && <li className="px-4 py-10 text-center text-slate-500">Never signed in as them.</li>}
        </ul>
      </section>
    </div>
  );
}

function statusOf(row: Impersonation, live: boolean): Status {
  if (!row.usedAt) return "unused";
  if (row.endedAt) return "ended";
  return live ? "live" : "expired";
}

function Row({ row, status }: { row: Impersonation; status: Status }) {
  const { label, tone } = statuses[status];
  const summary =
    status === "ended"
      ? `Exited ${formatDateTime(row.endedAt!)}`
      : status === "unused"
        ? null
        : `${status === "live" ? "Until" : "Ended"} ${formatDateTime(new Date(row.usedAt!.getTime() + IMPERSONATION_TTL_MS))}`;

  return (
    <li className="px-4 py-3.5 text-[15px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Pill tone={tone}>{label}</Pill>
        <span className="font-semibold text-navy-900">{formatDateTime(row.usedAt ?? row.createdAt)}</span>
        {summary && <span className="text-slate-500">{summary}</span>}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        By {row.adminEmail}
        {row.ipAddress && ` from ${row.ipAddress}`}
      </p>
      {row.userAgent && <p className="mt-0.5 text-sm break-all text-slate-500">{row.userAgent}</p>}
    </li>
  );
}
