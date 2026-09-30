import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { listUsers, USERS_PAGE_SIZE, type AdminUserRow } from "@/lib/admin-users";
import { secondaryButton } from "@/components/app/settings-ui";
import { inputClass } from "@/components/app/auth-ui";
import { BalanceFigure, CostFigure, formatDateTime, PageHeading, Pill, planLabel } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Users" };

/** A search param as one trimmed string. */
const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireAdmin();
  const query = await searchParams;
  const filters = { name: param(query.name).slice(0, 200), email: param(query.email).slice(0, 320) };
  const page = Math.max(1, Math.floor(Number(param(query.page))) || 1);
  const { rows, total } = await listUsers(filters, page);
  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const filtered = !!(filters.name || filters.email);

  /** This list's URL on another page, keeping the filters. */
  const pageHref = (to: number) => {
    const params = new URLSearchParams();
    if (filters.name) params.set("name", filters.name);
    if (filters.email) params.set("email", filters.email);
    if (to > 1) params.set("page", String(to));
    const search = params.toString();
    return search ? `/users?${search}` : "/users";
  };

  return (
    <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeading title="Users">
          {total} {filtered ? "matching" : "in all"}, newest first. Balances and cost are the case’s, shared by both partners. Cost is every model call: document checks and chat answers.
        </PageHeading>

        <form method="get" action="/users" className="mt-6 flex flex-wrap items-end gap-3">
          <label className="block min-w-[200px] flex-1 text-sm font-semibold text-navy-900">
            Name
            <input name="name" defaultValue={filters.name} className={inputClass} autoComplete="off" />
          </label>
          <label className="block min-w-[200px] flex-1 text-sm font-semibold text-navy-900">
            Email
            <input name="email" defaultValue={filters.email} className={inputClass} autoComplete="off" />
          </label>
          <button type="submit" className={secondaryButton}>
            Filter
          </button>
          {filtered && (
            <Link href="/users" className="inline-flex h-11 items-center px-2 text-[15px] font-semibold text-teal-700 hover:underline">
              Clear
            </Link>
          )}
        </form>

        <div className="mt-6 overflow-x-auto rounded-card border border-line-200 bg-white">
          <table className="w-full min-w-[920px] text-start text-[15px]">
            <thead className="border-b border-line-200 bg-sand-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">User</th>
                <th className="px-4 py-3 text-start">Created</th>
                <th className="px-4 py-3 text-start">Case</th>
                <th className="px-4 py-3 text-end">Messages</th>
                <th className="px-4 py-3 text-end">Checks</th>
                <th className="px-4 py-3 text-end">Case cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-200">
              {rows.map((row) => (
                <UserRow key={row.id} row={row} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    {filtered ? "No users match these filters." : "No users yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-[15px]">
            <span className="text-slate-500">
              Page {Math.min(page, pages)} of {pages}
            </span>
            <div className="flex gap-4 font-semibold text-teal-700">
              {page > 1 && <Link href={pageHref(page > pages ? pages : page - 1)}>Previous</Link>}
              {page < pages && <Link href={pageHref(page + 1)}>Next</Link>}
            </div>
          </nav>
        )}
      </div>
    </main>
  );
}

function UserRow({ row }: { row: AdminUserRow }) {
  return (
    // The name's link covers the row, so anywhere on it opens the user.
    <tr className="relative hover:bg-sand-50">
      <td className="px-4 py-3">
        <Link
          href={`/users/${row.id}`}
          className="font-semibold text-navy-900 after:absolute after:inset-0 after:content-[''] hover:underline"
        >
          {row.name}
        </Link>
        <div className="text-sm text-slate-500">
          {row.email}
          {!row.emailVerified && <span className="ms-2 text-amber-500">unverified</span>}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDateTime(row.createdAt)}</td>
      <td className="px-4 py-3">
        {row.caseId ? (
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={row.plan === "free" ? "neutral" : "teal"}>{planLabel[row.plan!] ?? row.plan}</Pill>
            {row.role === "partner" && <Pill>Partner</Pill>}
          </div>
        ) : (
          <Pill tone="slate">No case yet</Pill>
        )}
      </td>
      <td className="px-4 py-3 text-end text-slate-500">
        {row.totals ? <BalanceFigure left={row.messagesLeft!} totals={row.totals.messages} /> : "—"}
      </td>
      <td className="px-4 py-3 text-end text-slate-500">
        {row.totals ? <BalanceFigure left={row.checksLeft!} totals={row.totals.checks} /> : "—"}
      </td>
      <td className="px-4 py-3 text-end text-slate-500">{row.cost ? <CostFigure cost={row.cost} /> : "—"}</td>
    </tr>
  );
}
