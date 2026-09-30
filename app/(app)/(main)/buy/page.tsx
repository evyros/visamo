import type { Metadata } from "next";
import Link from "next/link";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { formatPrice } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { returnPath } from "@/lib/buy-paths";
import { checkBalance } from "@/lib/checks/store";
import type { ProductId } from "@/lib/products";
import { requireCase } from "@/lib/session";
import { prices } from "@/lib/site";
import { BuyButton } from "@/components/app/purchase";
import { primaryButton, secondaryButton } from "@/components/app/settings-ui";
import { Icon, type IconName } from "@/components/icons";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.buy };
}

// What there is to buy, and what each includes; what the file already has is
// marked on it. Every buy button in the app comes here (lib/buy-paths.ts),
// with ?from=, the page to go back to after paying. Only the buttons here open
// the checkout.
export default async function BuyPage({ searchParams }: PageProps<"/buy">) {
  const { caseId } = await requireCase();
  const params = await searchParams;
  const [messages, locale, checks] = await Promise.all([getAppDictionary(), getAppLocale(), checkBalance(caseId)]);
  const t = messages.app.buy;
  const pricing = messages.pricing;

  const from = returnPath(params.from) ?? undefined;
  // Full file check is recommended, as on the pricing page. Once it's bought,
  // only the message pack is left to buy. Smaller first; on a phone, the
  // featured one moves to the top.
  const featured: ProductId = checks.fileCheck ? "messagePack" : "fileCheck";

  return (
    <div className="mx-auto w-full max-w-[840px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {from && (
        <Link
          href={from}
          className="mb-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          <Icon name="arrow" className="flip-rtl size-4 rotate-180" />
          {t.back}
        </Link>
      )}
      <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{t.title}</h1>
      <p className="mt-3 text-slate-700">{t.intro}</p>

      <div className="mt-6 grid items-stretch gap-6 md:grid-cols-2">
        <ProductCard
          featured={featured === "messagePack"}
          badge={null}
          name={pricing.messagePack.name}
          tagline={t.packTagline}
          price={formatPrice(prices.messagePack, locale)}
          priceNote={pricing.messagePack.priceNote}
          footnote={pricing.messagePack.footnote}
        >
          <p className="mt-6 text-[15px] text-slate-700">{pricing.messagePack.body}</p>
          {!checks.fileCheck && <p className="mt-3 text-[15px] text-slate-700">{t.packVsFileCheck}</p>}
          <div className="mt-auto pt-8">
            <BuyButton
              product="messagePack"
              from={from}
              className={`w-full ${featured === "messagePack" ? primaryButton : secondaryButton}`}
            >
              {format(t.buy, { price: formatPrice(prices.messagePack, locale) })}
            </BuyButton>
          </div>
        </ProductCard>

        <ProductCard
          featured={featured === "fileCheck"}
          badge={checks.fileCheck ? t.active : pricing.recommended}
          name={pricing.fileCheck.name}
          tagline={pricing.fileCheck.tagline}
          price={formatPrice(prices.fileCheck, locale)}
          priceNote={pricing.fileCheck.priceNote}
          footnote={pricing.fileCheck.footnote}
        >
          <ul className="mt-6 space-y-3 text-[15px]">
            {pricing.fileCheck.includes.map((item) => (
              <li key={item} className="flex gap-2.5">
                <Icon name="check" className="mt-1 size-4 shrink-0 text-teal-600" />
                {item}
              </li>
            ))}
          </ul>
          {checks.fileCheck ? (
            <p className="mt-auto flex items-center justify-center gap-2 pt-8 font-semibold text-teal-700">
              <Icon name="checkCircle" className="size-5" />
              {t.activeNote}
            </p>
          ) : (
            <div className="mt-auto pt-8">
              <BuyButton
                product="fileCheck"
                from={from}
                className={`w-full ${featured === "fileCheck" ? primaryButton : secondaryButton}`}
              >
                {format(t.buy, { price: formatPrice(prices.fileCheck, locale) })}
              </BuyButton>
            </div>
          )}
        </ProductCard>
      </div>

      <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
        {pricing.trust.map((item) => (
          <li key={item.text} className="flex items-center gap-1.5">
            <Icon name={item.icon as IconName} className="size-4" />
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A product, as on the pricing page. `children` is what it includes, and then its button, pinned to the bottom. */
function ProductCard({
  featured,
  badge,
  name,
  tagline,
  price,
  priceNote,
  footnote,
  children,
}: {
  featured: boolean;
  badge: string | null;
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  footnote: string;
  children: React.ReactNode;
}) {
  return (
    <article
      // The featured card's 2px border is offset by 1px less padding, so text lines up.
      className={`relative flex flex-col rounded-2xl bg-white ${
        featured ? "order-first border-2 border-navy-900 p-[23px] shadow-soft sm:p-[31px] md:order-none" : "border border-line-200 p-6 sm:p-8"
      }`}
    >
      {badge && (
        <span className="absolute -top-3 start-6 rounded-full bg-sage-200 px-3 py-1 text-xs font-semibold text-navy-900 sm:start-8">
          {badge}
        </span>
      )}
      <h2 className="text-lg font-semibold text-navy-900">{name}</h2>
      <p className="mt-1 text-[15px] text-slate-500">{tagline}</p>
      <p className="mt-6 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-4xl font-semibold text-navy-900">
          <bdi>{price}</bdi>
        </span>
        <span className="text-sm text-slate-500">{priceNote}</span>
      </p>
      {children}
      <p className="mt-3 text-center text-xs text-slate-500">{footnote}</p>
    </article>
  );
}
