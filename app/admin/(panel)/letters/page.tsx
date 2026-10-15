import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { funnelStages, letterFunnel, recentLetterRequests, type AdminLetterRequest, type FunnelStage } from "@/lib/letters/events";
import { formatDateTime, PageHeading, Pill, Stat } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Recommendation letters" };

// The recommendation letters tool (the website's /tools/recommendation-letter):
// how many couples made a link, how many friends opened it, downloaded and
// sent their letter, and each request's timeline with the writers' details. From the event log (lib/letters/events.ts); the letters
// themselves are never stored.

const stageLabels: Record<FunnelStage, string> = {
  opened: "Opened the link",
  downloaded: "Downloaded the letter",
  sent: "Sent it by email",
};

const eventLabels: Record<AdminLetterRequest["events"][number]["type"], string> = {
  "invite.sent": "Invite emailed",
  "page.opened": "Friend opened the link",
  "letter.downloaded": "Letter downloaded",
  "letter.sent": "Letter sent",
};

export default async function AdminLettersPage() {
  await requireAdmin();
  const [funnel, requests] = await Promise.all([letterFunnel(), recentLetterRequests()]);
  const opened = funnel.friends.opened.email + funnel.friends.opened.link;

  return (
    <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none">
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeading title="Recommendation letters">
          Couples who made a link on the website, how many friends opened it, downloaded and sent their letter, and
          each request’s timeline. Friends are counted by browser; the letters themselves aren’t stored.
        </PageHeading>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Requests" value={funnel.requests.total} note={`${funnel.requests.app} from the app`} />
          <Stat label="Invites emailed" value={funnel.invites} />
          <Stat label="Friends opened" value={opened} />
          <Stat label="Letters sent" value={funnel.sent} />
          <Stat label="Downloaded" value={funnel.downloaded} />
        </div>

        <h2 className="mt-10 text-lg font-semibold text-navy-900">Friends</h2>
        <div className="mt-3 overflow-x-auto rounded-card border border-line-200 bg-white">
          <table className="w-full min-w-[480px] text-start text-[15px]">
            <thead className="border-b border-line-200 bg-sand-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">Friends who</th>
                <th className="px-4 py-3 text-end">Via invite email</th>
                <th className="px-4 py-3 text-end">Via shared link</th>
                <th className="px-4 py-3 text-end">Total</th>
                <th className="px-4 py-3 text-end">Of opened</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-200 tabular-nums">
              {funnelStages.map((stage) => {
                const { email, link } = funnel.friends[stage];
                return (
                  <tr key={stage}>
                    <td className="px-4 py-2.5 text-navy-900">{stageLabels[stage]}</td>
                    <td className="px-4 py-2.5 text-end text-slate-700">{email}</td>
                    <td className="px-4 py-2.5 text-end text-slate-700">{link}</td>
                    <td className="px-4 py-2.5 text-end font-semibold text-navy-900">{email + link}</td>
                    <td className="px-4 py-2.5 text-end text-slate-500">
                      {opened ? `${Math.round(((email + link) / opened) * 100)}%` : "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-lg font-semibold text-navy-900">Requests</h2>
        <p className="mt-1 text-sm text-slate-500">The newest 100. Open one for its timeline.</p>
        <ul className="mt-3 space-y-2">
          {requests.map((request) => (
            <li key={request.id}>
              <RequestCard request={request} />
            </li>
          ))}
          {requests.length === 0 && (
            <li className="rounded-card border border-line-200 bg-white px-4 py-10 text-center text-slate-500">
              No requests yet.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}

function RequestCard({ request }: { request: AdminLetterRequest }) {
  const friends = new Set(request.events.filter((e) => e.visitor).map((e) => e.visitor)).size;
  // Friends who finished: downloaded their letter or sent it, each counted once.
  const finished = new Set(
    request.events
      .filter((e) => e.type === "letter.downloaded" || e.type === "letter.sent")
      .map((e) => e.visitor ?? e.id),
  ).size;
  return (
    <details className="group rounded-card border border-line-200 bg-white">
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
        <span className="font-semibold text-navy-900" dir="auto">
          {request.names.join(" & ")}
        </span>
        <span className="text-sm text-slate-500">{request.email ?? "No email: friends download"}</span>
        {request.source === "app" && <Pill tone="teal">From the app</Pill>}
        <span className="ms-auto flex items-center gap-3 text-sm text-slate-500 tabular-nums">
          <span>{request.invitesSent} invited</span>
          <span>{friends} friends</span>
          <span className={finished ? "font-semibold text-teal-700" : ""}>{finished} finished</span>
          <span>{formatDateTime(request.createdAt)}</span>
        </span>
      </summary>
      <ol className="space-y-1.5 border-t border-line-200 px-4 py-3 text-sm">
        {request.events.map((event) => (
          <li key={event.id} className="flex flex-wrap gap-x-3">
            <span className="w-40 shrink-0 text-slate-500 tabular-nums">{formatDateTime(event.createdAt)}</span>
            <span className="text-navy-900">
              {eventLabels[event.type]}
              {"idNumber" in event.data && (
                <>
                  {": "}
                  <bdi className="font-semibold">{event.data.name}</bdi>
                  {` · ID ${event.data.idNumber} · `}
                  <bdi>{event.data.phone}</bdi>
                </>
              )}
              {"email" in event.data && `: ${event.data.email}`}
            </span>
            {event.via && <Pill>{event.via === "email" ? "via email" : "via link"}</Pill>}
            {event.visitor && <span className="text-xs text-slate-500">friend {event.visitor.slice(0, 6)}</span>}
          </li>
        ))}
        {request.events.length === 0 && <li className="text-slate-500">Nothing yet.</li>}
      </ol>
    </details>
  );
}
