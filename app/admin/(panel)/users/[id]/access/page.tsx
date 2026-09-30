import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { caseMembers, findUser } from "@/lib/admin-users";
import { accessStatus, listAccessRequests, type AccessStatus, type SupportAccess } from "@/lib/support-access";
import { durationLabels, reasonLabels } from "@/lib/support-access-options";
import { formatDateTime, PageHeading, Pill, type PillTone } from "@/components/admin/admin-ui";
import { AccessRequestForm } from "@/components/admin/access-request-form";
import { cancelRequest } from "./actions";

export async function generateMetadata({ params }: PageProps<"/admin/users/[id]/access">): Promise<Metadata> {
  const user = await findUser((await params).id);
  return { title: user ? `${user.name}: access` : "Access" };
}

const statuses: Record<AccessStatus, { label: string; tone: PillTone }> = {
  pending: { label: "Waiting", tone: "amber" },
  consented: { label: "Agreed", tone: "teal" },
  cancelled: { label: "Cancelled", tone: "slate" },
  expired: { label: "Expired", tone: "neutral" },
};

// Asking the couple's OK before looking into their file for support, and the
// consents they gave (lib/support-access.ts). It's a record only: the other
// pages show the file with or without it.
export default async function AdminUserAccessPage({ params }: PageProps<"/admin/users/[id]/access">) {
  await requireAdmin();
  const user = await findUser((await params).id);
  if (!user) notFound();

  if (!user.caseId) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeading title="Access">{user.name} hasn’t finished onboarding, so there’s no file to ask about yet.</PageHeading>
      </div>
    );
  }

  const [requests, members] = await Promise.all([listAccessRequests(user.caseId), caseMembers(user.caseId)]);
  const now = new Date();

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading title="Access">
        Ask for the couple’s OK before looking into their file. Either partner can agree; the link works once, for 72
        hours.
      </PageHeading>

      <section className="mt-6 rounded-card border border-line-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-navy-900">Request access</h2>
        <div className="mt-4">
          <AccessRequestForm userId={user.id} members={members} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy-900">Requests</h2>
        <p className="mt-1 text-[15px] text-slate-500">Newest first, with what they agreed to.</p>
        <ul className="mt-3 divide-y divide-line-200 rounded-card border border-line-200 bg-white">
          {requests.map((request) => (
            <RequestRow key={request.id} request={request} status={accessStatus(request, now)} userId={user.id} now={now} />
          ))}
          {requests.length === 0 && <li className="px-4 py-10 text-center text-slate-500">No requests yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function RequestRow({ request, status, userId, now }: { request: SupportAccess; status: AccessStatus; userId: string; now: Date }) {
  const { label, tone } = statuses[status];
  const summary =
    status === "consented"
      ? `${request.accessEndsAt! > now ? "Until" : "Ended"} ${formatDateTime(request.accessEndsAt!)}`
      : status === "pending"
        ? `Link works until ${formatDateTime(request.linkExpiresAt)}`
        : status === "cancelled"
          ? `Cancelled ${formatDateTime(request.cancelledAt!)}`
          : `Expired ${formatDateTime(request.linkExpiresAt)}`;

  return (
    <li className="px-4 py-3.5 text-[15px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Pill tone={tone}>{label}</Pill>
        <span className="font-semibold text-navy-900">{durationLabels[request.durationHours]}</span>
        <span className="text-slate-500">{summary}</span>
        {status === "pending" && (
          <form action={cancelRequest} className="ms-auto">
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="requestId" value={request.id} />
            <button type="submit" className="text-sm font-semibold text-terracotta-600 hover:underline">
              Cancel link
            </button>
          </form>
        )}
      </div>
      {request.reason && <p className="mt-1.5 text-slate-700">{reasonLabels[request.reason]}</p>}
      <p className="mt-1 text-sm text-slate-500">
        Sent {formatDateTime(request.createdAt)} by {request.adminEmail}
      </p>

      {request.consentedAt && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold text-teal-700">Consent record</summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-[10px] bg-sand-50 p-3 text-sm">
            <dt className="text-slate-500">Agreed</dt>
            <dd>{formatDateTime(request.consentedAt)}</dd>
            <dt className="text-slate-500">By</dt>
            <dd className="break-all">
              {request.consentedByName} &lt;{request.consentedByEmail}&gt;
            </dd>
            <dt className="text-slate-500">Language</dt>
            <dd>{request.consentLocale}</dd>
            <dt className="text-slate-500">IP</dt>
            <dd>{request.consentIp ?? "—"}</dd>
            <dt className="text-slate-500">Browser</dt>
            <dd className="break-all">{request.consentUserAgent ?? "—"}</dd>
          </dl>
        </details>
      )}
    </li>
  );
}
