import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { formatPrice } from "@/i18n/format";
import { pageMetadata } from "@/lib/metadata";
import { prices } from "@/lib/site";
import { FaqList } from "@/components/faq-list";
import { FinalCta } from "@/components/final-cta";
import { Icon, isIconName } from "@/components/icons";
import { PricingCards } from "@/components/pricing-cards";
import { Container, SectionTitle } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return pageMetadata({
    locale: await getLocale(),
    path: "/pricing",
    title: t.meta.pricing.title,
    description: t.meta.pricing.description,
  });
}

export default async function PricingPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const p = t.pricing;
  const tierNames = [p.tiers.free.name, p.tiers.assistant.name, p.tiers.filePrep.name];

  return (
    <>
      <section className="py-16 sm:py-20">
        <Container className="text-center">
          <SectionTitle as="h1" align="center">
            {p.title}
          </SectionTitle>
          <p className="mx-auto mt-4 max-w-2xl text-lg">{p.subtitle}</p>
          {/* A typographic statement, not a box: the cost of a mistake, then the price. */}
          <div aria-hidden="true" className="mx-auto mt-10 h-0.5 w-10 rounded-full bg-teal-600" />
          <p className="mt-6 text-slate-500">{p.anchorLead}</p>
          <p className="mx-auto mt-2 max-w-2xl font-display text-2xl font-semibold leading-snug text-balance text-navy-900 sm:text-[28px]">
            <PriceSentence text={p.anchor} price={formatPrice(prices.filePrep, locale)} />
          </p>
        </Container>
        <Container className="mt-14">
          <div id="tiers">
            <PricingCards t={t} locale={locale} headingLevel="h2" />
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {p.trust.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-[15px] text-navy-900"
              >
                {isIconName(item.icon) && <Icon name={item.icon} className="size-5 text-teal-600" />}
                {item.text}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <Container>
          <SectionTitle>{p.compare.title}</SectionTitle>
          {/* Scrolls sideways on phones, so it takes focus for keyboard scrolling. */}
          <div
            role="region"
            aria-label={p.compare.title}
            tabIndex={0}
            className="mt-10 overflow-x-auto rounded-2xl border border-line-200"
          >
            <table className="w-full min-w-[640px] border-collapse text-start text-[15px]">
              <thead className="bg-sand-50">
                <tr>
                  <th scope="col" className="p-4 text-start font-semibold text-navy-900">
                    {p.compare.feature}
                  </th>
                  {tierNames.map((name) => (
                    <th key={name} scope="col" className="p-4 text-start font-semibold text-navy-900">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.compare.rows.map((row) => (
                  <tr key={row.feature} className="border-t border-line-200">
                    <th scope="row" className="p-4 text-start font-normal">
                      {row.feature}
                    </th>
                    {row.values.map((value, i) => (
                      <td key={i} className="p-4">
                        <CompareValue value={value} yes={t.common.included} no={t.common.notIncluded} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container narrow>
          <SectionTitle>{p.faq.title}</SectionTitle>
          <div className="mt-10">
            <FaqList items={p.faq.items} locale={locale} />
          </div>
        </Container>
      </section>

      <FinalCta t={t} locale={locale} />
    </>
  );
}

function CompareValue({ value, yes, no }: { value: string; yes: string; no: string }) {
  if (value === "yes")
    return (
      <span className="inline-flex text-teal-600">
        <Icon name="check" className="size-5" />
        <span className="sr-only">{yes}</span>
      </span>
    );
  if (value === "no")
    return (
      <span className="inline-flex text-slate-300">
        <Icon name="minus" className="size-5" />
        <span className="sr-only">{no}</span>
      </span>
    );
  return <span className="text-navy-900">{value}</span>;
}

function PriceSentence({ text, price }: { text: string; price: string }) {
  const [before, after] = text.split("{price}");
  return (
    <>
      {before}
      <bdi className="text-teal-600">{price}</bdi>
      {after}
    </>
  );
}
