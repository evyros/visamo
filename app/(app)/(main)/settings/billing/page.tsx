import type { Metadata } from "next";
import Link from "next/link";
import { locales } from "@/i18n/config";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { formatDate, formatPrice } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { buyUrl } from "@/lib/buy-paths";
import { chatBalance } from "@/lib/chat/store";
import { checkBalance } from "@/lib/checks/store";
import { casePurchases } from "@/lib/purchases";
import { requireCase } from "@/lib/session";
import { prices } from "@/lib/site";
import { primaryButton, secondaryButton, SettingsCard, SettingsPage } from "@/components/app/settings-ui";

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
        <p className="text-slate-700">{checks.fileCheck ? t.fileCheckOn : t.fileCheckOff}</p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <Balance label={t.messagesLeft} value={count(chat.messagesLeft)} />
          {checks.fileCheck && <Balance label={t.checksLeft} value={count(checks.left)} />}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          {!checks.fileCheck && (
            <Link href={buyUrl("/settings/billing")} className={primaryButton}>
              {format(t.buyFileCheck, { price: formatPrice(prices.fileCheck, locale) })}
            </Link>
          )}
          <Link
            href={buyUrl("/settings/billing")}
            className={checks.fileCheck ? primaryButton : secondaryButton}
          >
            {format(t.buyPack, { price: formatPrice(prices.messagePack, locale) })}
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">{t.secure}</p>
      </SettingsCard>

      <SettingsCard title={t.historyTitle}>
        {purchases.length ? (
          <ul className="divide-y divide-line-200">
            {purchases.map((p) => (
              <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-semibold text-navy-900">{products[p.product].name}</p>
                  <p className="text-sm text-slate-500">
                    {formatDate(p.createdAt, locale)}
                    {p.buyerId !== user.id && p.buyerName && ` · ${format(t.boughtBy, { name: p.buyerName })}`}
                  </p>
                </div>
                {p.amount !== null && (
                  <bdi className="font-semibold text-navy-900 tabular-nums">
                    {formatPrice(p.amount, locale)}
                  </bdi>
                )}
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

function Balance({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-sand-50 px-4 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="font-display text-2xl font-semibold text-navy-900 tabular-nums">{value}</dd>
    </div>
  );
}
