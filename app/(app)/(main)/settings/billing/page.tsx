import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { locales } from "@/i18n/config";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { formatAmount, formatDate, formatPrice } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { buyUrl } from "@/lib/buy-paths";
import { chatBalance } from "@/lib/chat/store";
import { checkBalance } from "@/lib/checks/store";
import { casePurchases } from "@/lib/purchases";
import { requireCase } from "@/lib/session";
import { checksRunningLow } from "@/lib/products";
import { prices } from "@/lib/site";
import { primaryButton, SettingsCard, SettingsPage } from "@/components/app/settings-ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.billing };
}

// What the case has (its balances, shared by both partners), buying more,
// and what either partner bought. Buying is on the buy page.
export default async function BillingPage() {
  const { user, caseId } = await requireCase();
  const [messages, locale, chat, checks, purchases] = await Promise.all([
    getAppDictionary(),
    getAppLocale(),
    chatBalance(caseId),
    checkBalance(caseId),
    casePurchases(caseId),
  ]);
  const t = messages.app.settings.billingPage;
  const products = messages.pricing;
  const count = (n: number) => new Intl.NumberFormat(locales[locale].intlLocale).format(n);

  return (
    <SettingsPage title={messages.app.settings.billing} intro={t.intro}>
      <SettingsCard title={t.fileTitle}>
        {/* Each balance with the purchase that adds to it. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Balance label={t.messagesLeft} value={count(chat.messagesLeft)}>
            <Link href={buyUrl("/settings/billing")} className={tileLink}>
              + {format(t.addPack, { price: formatPrice(prices.messagePack, locale) })}
            </Link>
          </Balance>
          {checks.fileCheck ? (
            // The count shows only once it runs low.
            checksRunningLow(checks) ? (
              <Balance label={t.checksLeft} value={count(checks.left)}>
                <Link href="/file/documents" className={tileLink}>
                  {t.checksHint}
                </Link>
              </Balance>
            ) : (
              <div className="flex flex-col rounded-[10px] bg-sand-50 px-4 py-3">
                <p className="text-sm text-slate-500">{t.checksTitle}</p>
                <p className="mt-1 text-slate-700">{t.checksIncluded}</p>
                <Link href="/file/documents" className={tileLink}>
                  {t.checksHint}
                </Link>
              </div>
            )
          ) : (
            <div className="flex flex-col rounded-[10px] border-[1.5px] border-dashed border-line-200 px-4 py-3">
              <p className="text-sm text-slate-500">{t.checksTitle}</p>
              <p className="mt-1 text-sm text-slate-700">{t.checksLockedBody}</p>
              <Link href={buyUrl("/settings/billing")} className={`${primaryButton} mt-4 self-start`}>
                {format(t.buyFileCheck, { price: formatPrice(prices.fileCheck, locale) })}
              </Link>
            </div>
          )}
        </div>
        <p className="mt-4 text-sm text-slate-500">{t.secure}</p>
      </SettingsCard>

      <SettingsCard title={t.historyTitle}>
        {purchases.length ? (
          <ul className="divide-y divide-line-200">
            {purchases.map((p) => (
              <li key={p.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-semibold text-navy-900">{products[p.product].name}</p>
                  <p className="text-sm text-slate-500">
                    {[
                      formatDate(p.createdAt, locale),
                      p.paymentMethod && (p.paymentMethod === "paypal" ? t.paidPaypal : t.paidCard),
                      p.buyerId !== user.id && p.buyerName && format(t.boughtBy, { name: p.buyerName }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="text-end">
                  {p.amount !== null && (
                    <p className="font-semibold text-navy-900 tabular-nums">
                      <bdi>{formatAmount(p.amount, p.currency, locale)}</bdi>
                    </p>
                  )}
                  {!!p.vat && (
                    <p className="text-sm text-slate-500">
                      {format(t.vatIncluded, { vat: formatAmount(p.vat, p.currency, locale) })}
                    </p>
                  )}
                  {p.hasInvoice && (
                    <a
                      href={`/api/purchases/${p.id}/invoice`}
                      target="_blank"
                      rel="noopener"
                      className="text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
                    >
                      {t.invoice}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-700">{t.historyEmpty}</p>
        )}
        <p className="mt-5 text-sm text-slate-700">
          {t.needHelp}{" "}
          <Link href="/support" className="font-semibold text-teal-700 underline-offset-4 hover:underline">
            {t.contactSupport}
          </Link>
        </p>
      </SettingsCard>
    </SettingsPage>
  );
}

const tileLink = "mt-3 self-start text-sm font-semibold text-teal-700 underline-offset-4 hover:underline";

function Balance({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col rounded-[10px] bg-sand-50 px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-display text-2xl font-semibold text-navy-900 tabular-nums">{value}</p>
      {children}
    </div>
  );
}
