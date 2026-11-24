import type { Metadata } from "next";
import Link from "next/link";
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
import { contactUrl, newTab, prices } from "@/lib/site";
import { SettingsPage } from "@/components/app/settings-ui";
import {
  BalanceCard,
  BalanceMeter,
  BalanceNumber,
  BalanceTile,
  BillingSection,
  FileCheckGlyph,
  MessagesGlyph,
  PurchaseBadge,
  PurchaseList,
  PurchaseRow,
  PurchasesEmpty,
  invoiceButton,
  tileLink,
  tilePrimaryButton,
  tileSecondaryButton,
} from "@/components/app/billing-ui";
import { Icon } from "@/components/icons";

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
  const back = buyUrl("/settings/billing");

  const toDocuments = (
    <Link href="/file/documents" className={tileLink}>
      {t.checksHint}
      <Icon
        name="arrow"
        className="ms-1.5 inline-block size-4 align-[-0.15em] transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
      />
    </Link>
  );

  return (
    <SettingsPage title={messages.app.settings.billing} intro={t.intro}>
      <div className="space-y-10">
        <BillingSection title={t.fileTitle}>
          {/* Each balance with the purchase that adds to it. */}
          <BalanceCard
            footnote={
              <>
                <Icon name="lock" className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <p className="whitespace-pre-line">{t.secure}</p>
              </>
            }
          >
            <BalanceTile
              glyph={<MessagesGlyph />}
              label={t.messagesLeft}
              action={
                <Link href={back} className={tileSecondaryButton}>
                  {format(t.addPack, { price: formatPrice(prices.messagePack, locale) })}
                </Link>
              }
            >
              <BalanceNumber>{count(chat.messagesLeft)}</BalanceNumber>
            </BalanceTile>

            {checks.fileCheck ? (
              // The count shows only once it runs low.
              checksRunningLow(checks) ? (
                <BalanceTile glyph={<FileCheckGlyph />} label={t.checksLeft} action={toDocuments}>
                  <BalanceNumber>{count(checks.left)}</BalanceNumber>
                  <BalanceMeter left={checks.left} granted={checks.granted} />
                </BalanceTile>
              ) : (
                <BalanceTile glyph={<FileCheckGlyph />} label={t.checksTitle} action={toDocuments}>
                  <p className="flex items-start gap-2 font-display text-xl leading-snug font-semibold text-navy-900">
                    <Icon name="checkCircle" className="mt-0.5 size-6 shrink-0 text-teal-600" />
                    {t.checksIncluded}
                  </p>
                </BalanceTile>
              )
            ) : (
              // Without Full file check: the free check, until it's used.
              <BalanceTile
                offer
                glyph={<FileCheckGlyph open />}
                label={t.checksTitle}
                action={
                  <Link href={back} className={tilePrimaryButton}>
                    {format(t.buyFileCheck, { price: formatPrice(prices.fileCheck, locale) })}
                  </Link>
                }
              >
                <p className="text-[15px] leading-relaxed text-slate-700">
                  {checks.left > 0 ? t.checksFreeBody : t.checksLockedBody}
                </p>
              </BalanceTile>
            )}
          </BalanceCard>
        </BillingSection>

        <BillingSection title={t.historyTitle}>
          <div className="overflow-hidden rounded-card border border-line-200 bg-white shadow-soft">
            {purchases.length ? (
              <PurchaseList>
                {purchases.map((p) => (
                  <PurchaseRow
                    key={p.id}
                    faded={!!p.refundedAt}
                    glyph={
                      p.product === "messagePack" ? (
                        <MessagesGlyph className="size-10" />
                      ) : (
                        <FileCheckGlyph className="size-10" />
                      )
                    }
                    title={
                      <>
                        {products[p.product].name}
                        {p.refundedAt && <PurchaseBadge>{p.given ? t.cancelled : t.refunded}</PurchaseBadge>}
                      </>
                    }
                    details={[
                      formatDate(p.createdAt, locale),
                      p.given && t.given,
                      p.paymentMethod && (p.paymentMethod === "paypal" ? t.paidPaypal : t.paidCard),
                      !p.given && p.buyerId !== user.id && p.buyerName && format(t.boughtBy, { name: p.buyerName }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    amount={
                      <>
                        {p.amount !== null && (
                          <p
                            className={`text-[15px] font-semibold tabular-nums ${p.refundedAt ? "text-slate-500 line-through decoration-slate-300" : "text-navy-900"}`}
                          >
                            <bdi>{formatAmount(p.amount, p.currency, locale)}</bdi>
                          </p>
                        )}
                        {!!p.vat && (
                          <p className="text-xs text-slate-500">
                            {format(t.vatIncluded, { vat: formatAmount(p.vat, p.currency, locale) })}
                          </p>
                        )}
                      </>
                    }
                    invoice={
                      p.hasInvoice && (
                        <a href={`/api/purchases/${p.id}/invoice`} target="_blank" rel="noopener" className={invoiceButton}>
                          <Icon name="receipt" className="size-4" />
                          {t.invoice}
                        </a>
                      )
                    }
                  />
                ))}
              </PurchaseList>
            ) : (
              <PurchasesEmpty>{t.historyEmpty}</PurchasesEmpty>
            )}
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Icon name="help" className="size-4 shrink-0" />
            <span>
              {t.needHelp}{" "}
              <a href={contactUrl(locale)} {...newTab} className="font-semibold text-teal-700 underline-offset-4 hover:underline">
                {t.contactSupport}
              </a>
            </span>
          </p>
        </BillingSection>
      </div>
    </SettingsPage>
  );
}
