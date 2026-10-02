import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { findUser } from "@/lib/admin-users";
import { chatHref, chatTitle } from "@/lib/admin-chats";
import { creditEntries, type CreditEntryRow, type CreditReason } from "@/lib/credits";
import { casePurchases } from "@/lib/purchases";
import {
  BalanceFigure,
  formatDateTime,
  PageHeading,
  Pill,
  productLabels,
  purchasesLabel,
  Stat,
  type PillTone,
} from "@/components/admin/admin-ui";
import { historyHref } from "@/components/admin/document-card";
import { GivePurchaseForm, RevokePurchaseForm } from "@/components/admin/purchase-forms";
import { TopUpForm } from "@/components/admin/top-up-form";
import { Icon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/admin/users/[id]/balance">): Promise<Metadata> {
  const user = await findUser((await params).id);
  return { title: user ? `${user.name}: balance` : "Balance" };
}

const reasons: Record<CreditReason, { label: string; tone: PillTone }> = {
  free: { label: "Free", tone: "neutral" },
  purchase: { label: "Purchase", tone: "teal" },
  revoked: { label: "Purchase taken back", tone: "terracotta" },
  support: { label: "Support", tone: "navy" },
  spend: { label: "Spent", tone: "slate" },
  refund: { label: "Refunded", tone: "amber" },
};

// The case's balances, every change to them (the ledger, lib/credits.ts),
// support top-ups, and its purchases: giving one without a payment, and
// taking back what one granted.
export default async function AdminUserBalancePage({ params }: PageProps<"/admin/users/[id]/balance">) {
  await requireAdmin();
  const user = await findUser((await params).id);
  if (!user) notFound();

  if (!user.caseId || !user.totals) {
    return (
      <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeading title="Balance">
          {user.name} hasn’t finished onboarding, so there’s no case and no balance yet.
        </PageHeading>
      </div>
    );
  }

  const [entries, purchases] = await Promise.all([creditEntries(user.caseId), casePurchases(user.caseId)]);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading title="Balance">
        The case’s, shared by both partners. Bought: {purchasesLabel(user)}.
      </PageHeading>

      <div className="mt-6 grid grid-cols-2 gap-3 md:max-w-[480px]">
        <Stat label="Checks" value={<BalanceFigure left={user.checksLeft!} totals={user.totals.checks} />} />
        <Stat label="Messages" value={<BalanceFigure left={user.messagesLeft!} totals={user.totals.messages} />} />
      </div>

      <section className="mt-8 rounded-card border border-line-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-navy-900">Top up</h2>
        <div className="mt-4">
          <TopUpForm userId={user.id} />
        </div>
      </section>

      <section className="mt-6 rounded-card border border-line-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-navy-900">Give a purchase</h2>
        <p className="mt-1 text-[15px] text-slate-500">
          As if they bought it: its messages and checks, and what it unlocks (longer messages, document checks).
        </p>
        <div className="mt-4">
          <GivePurchaseForm userId={user.id} hasFileCheck={!!user.fileCheck} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy-900">Purchases</h2>
        <p className="mt-1 text-[15px] text-slate-500">
          Bought or given, newest first. A refund or a lost chargeback in Freemius is taken back on its own.
        </p>
        <ul className="mt-3 divide-y divide-line-200 rounded-card border border-line-200 bg-white">
          {purchases.map((p) => (
            <li key={p.id} className="px-4 py-3.5 text-[15px]">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-semibold text-navy-900">{productLabels[p.product]}</span>
                <Pill tone={p.given ? "navy" : "teal"}>{p.given ? "Given" : "Bought"}</Pill>
                {p.refundedAt && <Pill tone="terracotta">Taken back {formatDateTime(p.refundedAt)}</Pill>}
                {p.amount !== null && (
                  <span className="ms-auto font-semibold tabular-nums text-slate-700">
                    {p.amount.toFixed(2)} {p.currency}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {formatDateTime(p.createdAt)} · {p.given ? `by ${p.adminEmail}` : `by ${p.buyerName ?? "—"}`}
              </p>
              {p.note && <p className="mt-1 max-w-[560px] text-sm break-words text-slate-700">{p.note}</p>}
              {!p.refundedAt && <RevokePurchaseForm userId={user.id} purchaseId={p.id} />}
            </li>
          ))}
          {purchases.length === 0 && <li className="px-4 py-10 text-center text-slate-500">No purchases yet.</li>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-navy-900">Ledger</h2>
        <p className="mt-1 text-[15px] text-slate-500">Every change to the balances, newest first.</p>
        <div className="mt-3 overflow-x-auto rounded-card border border-line-200 bg-white">
          <table className="w-full min-w-[760px] text-[15px]">
            <thead className="border-b border-line-200 bg-sand-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-start">When</th>
                <th className="px-4 py-3 text-start">What</th>
                <th className="px-4 py-3 text-end">Change</th>
                <th className="px-4 py-3 text-start">Why</th>
                <th className="px-4 py-3 text-start">By</th>
                <th className="px-4 py-3 text-start">For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-200 text-slate-700">
              {entries.map((row) => (
                <EntryRow key={row.entry.id} row={row} userId={user.id} />
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No changes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** The "For" column: what a spend or refund paid for, with an icon for a check or a chat message. */
const forLink = "inline-flex items-start gap-1.5 text-teal-700 hover:underline";
const forIcon = "mt-0.5 size-4 shrink-0";

function EntryRow({ row, userId }: { row: CreditEntryRow; userId: string }) {
  const { entry } = row;
  const reason = reasons[entry.reason];
  return (
    <tr className="align-top">
      <td className="whitespace-nowrap px-4 py-2.5">{formatDateTime(entry.createdAt)}</td>
      <td className="px-4 py-2.5">{entry.kind === "messages" ? "Messages" : "Checks"}</td>
      <td
        className={`px-4 py-2.5 text-end font-semibold tabular-nums ${entry.delta > 0 ? "text-teal-700" : "text-slate-500"}`}
      >
        {entry.delta > 0 ? `+${entry.delta}` : `−${-entry.delta}`}
      </td>
      <td className="px-4 py-2.5">
        <Pill tone={reason.tone}>{reason.label}</Pill>
        {entry.note && <div className="mt-1 max-w-[320px] text-sm break-words text-slate-700">{entry.note}</div>}
      </td>
      <td className="px-4 py-2.5 text-sm">{entry.adminEmail ?? row.userName ?? "—"}</td>
      <td className="px-4 py-2.5 text-sm">
        {row.documentKey ? (
          <Link href={historyHref(userId, row.documentKey, entry.refId!)} className={forLink}>
            <Icon name="checkCircle" className={forIcon} />
            <code>{row.documentKey}</code>
          </Link>
        ) : row.chatId ? (
          <Link href={chatHref(userId, row.chatId, entry.refId!)} className={forLink}>
            <Icon name="chat" className={forIcon} />
            <span dir="auto">{chatTitle({ title: row.chatTitle })}</span>
          </Link>
        ) : row.product ? (
          productLabels[row.product]
        ) : entry.kind === "messages" && (entry.reason === "spend" || entry.reason === "refund") ? (
          <span className="inline-flex items-start gap-1.5">
            <Icon name="chat" className={forIcon} />
            A message that got no answer
          </span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}
