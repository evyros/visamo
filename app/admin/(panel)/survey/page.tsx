import type { Metadata } from "next";
import { getBranchesTexts, stageIds } from "@/content/branches";
import { loadMessages } from "@/i18n/messages";
import { requireAdmin } from "@/lib/admin";
import { recentSurveyVotes, reportsBySource, votesLastDay, type AdminSurveyVote } from "@/lib/branch-reports";
import type { BranchCode } from "@/lib/case-options";
import { formatDateTime, PageHeading, Pill, Stat, type PillTone } from "@/components/admin/admin-ui";
import { voidVote } from "./actions";

export const metadata: Metadata = { title: "Branch survey" };

// The branches survey (the website's /branches/survey): what each
// source adds to the branches page, the newest votes with their answers and
// comments (never published), and a way to void a vote that shouldn't count.
// A branch getting many votes in a day is flagged, to check for a campaign.

const SPIKE = 5;

const sourceLabels: Record<string, string> = {
  facebook_post: "Facebook posts",
  facebook_comment: "Facebook comments",
  aic_comment: "AIC comments",
  interview: "Interviews",
  survey: "Survey votes",
};

const statusTones: Record<AdminSurveyVote["status"], PillTone> = { pending: "amber", verified: "teal", void: "slate" };
const experienceLabels: Record<string, string> = { positive: "Satisfied", neutral: "Neutral", negative: "Unsatisfied", mixed: "Mixed" };

export default async function AdminSurveyPage() {
  await requireAdmin();
  const [votes, sources, lastDay, messages] = await Promise.all([recentSurveyVotes(), reportsBySource(), votesLastDay(), loadMessages("en")]);
  const names = messages.app.onboarding.branches as Record<BranchCode, string>;
  const stages = getBranchesTexts("en").stages.items;
  const count = (status: AdminSurveyVote["status"]) => votes.filter((v) => v.status === status).length;

  const spikes = lastDay.filter((b) => b.votes >= SPIKE);

  return (
    <main id="main" tabIndex={-1} className="relative min-h-0 flex-1 overflow-y-auto focus:outline-none">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeading title="Branch survey">
          Votes on the website&apos;s branch survey, each counted once its emailed code is entered, and what every source
          adds to the branches page. Comments are only read here, never published.
        </PageHeading>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Verified" value={count("verified")} note="of the newest 200" />
          <Stat label="Pending" value={count("pending")} note="code not entered" />
          <Stat label="Void" value={count("void")} />
          <Stat label="Verified, last 24h" value={lastDay.reduce((a, b) => a + b.votes, 0)} />
        </div>

        {spikes.length > 0 && (
          <p role="alert" className="mt-6 rounded-card bg-amber-100 px-4 py-3 text-[15px] text-navy-900">
            <strong>Check these:</strong>{" "}
            {spikes.map((b) => `${names[b.branch as BranchCode] ?? b.branch} (${b.votes} votes in 24 hours)`).join(", ")}.
          </p>
        )}

        <h2 className="mt-10 text-lg font-semibold text-navy-900">What the page counts</h2>
        <div className="mt-3 overflow-x-auto rounded-card border border-line-200 bg-white">
          <table className="w-full min-w-[420px] text-[15px]">
            <thead className="border-b border-line-200 bg-sand-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">Source</th>
                <th className="px-4 py-3 text-end">Couples</th>
                <th className="px-4 py-3 text-end">Rows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-200 tabular-nums">
              {sources.map((s) => (
                <tr key={s.source}>
                  <td className="px-4 py-2.5 text-navy-900">{sourceLabels[s.source] ?? s.source}</td>
                  <td className="px-4 py-2.5 text-end">{s.couples}</td>
                  <td className="px-4 py-2.5 text-end text-slate-500">{s.rows}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-lg font-semibold text-navy-900">Votes</h2>
        <p className="mt-1 text-sm text-slate-500">The newest 200. On a branch, an email&apos;s newest verified vote is the one that counts: how it went, and each stage it gave.</p>
        {votes.length === 0 ? (
          <p className="mt-4 text-slate-500">No votes yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {votes.map((vote) => (
              <li key={vote.id} className="rounded-card border border-line-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-navy-900">{names[vote.branch as BranchCode] ?? vote.branch}</span>
                  <Pill tone={statusTones[vote.status]}>{vote.status}</Pill>
                  <span className="text-sm text-slate-500">{vote.email}</span>
                  <span className="text-sm text-slate-500">{formatDateTime(vote.createdAt)}</span>
                  {vote.status !== "void" && (
                    <form action={voidVote} className="ms-auto">
                      <input type="hidden" name="id" value={vote.id} />
                      <button type="submit" className="text-sm font-semibold text-terracotta-600 hover:underline">
                        Void
                      </button>
                    </form>
                  )}
                </div>
                <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                  {vote.experience && (
                    <li className="rounded-full bg-sand-50 px-2.5 py-0.5 font-semibold text-slate-700">
                      {experienceLabels[vote.experience] ?? vote.experience}
                    </li>
                  )}
                  {stageIds
                    .filter((id) => vote.stages?.[id].days != null)
                    .map((id) => (
                      <li key={id} className="rounded-full bg-sand-50 px-2.5 py-0.5 text-slate-700">
                        {stages[id].title} · {vote.stages![id].days} days{vote.stages![id].waiting ? ", still waiting" : ""}
                      </li>
                    ))}
                </ul>
                {vote.comment && <p className="mt-2 text-[15px] whitespace-pre-line text-navy-900" dir="auto">{vote.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
