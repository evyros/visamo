import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath, whatsappUrl } from "@/lib/site";
import { FaqList } from "@/components/faq-list";
import { FinalCta } from "@/components/final-cta";
import { Features } from "@/components/home/features";
import { FounderTeaser } from "@/components/home/founder-teaser";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { HowWeBuilt } from "@/components/home/how-we-built";
import { Problem } from "@/components/home/problem";
import { SecurityBand } from "@/components/home/security-band";
import { PricingCards } from "@/components/pricing-cards";
import { ButtonLink, Container, SectionTitle, TextLink } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return pageMetadata({
    locale: await getLocale(),
    path: "/",
    title: t.meta.home.title,
    description: t.meta.home.description,
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <>
      <Hero t={t} locale={locale} />
      <Problem t={t} />
      <HowWeBuilt t={t} locale={locale} />
      <Features t={t} />
      <HowItWorks t={t} locale={locale} />
      <SecurityBand t={t} locale={locale} />
      <FounderTeaser t={t} locale={locale} />

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionTitle>{t.home.pricingTeaser.title}</SectionTitle>
            <TextLink href={localePath(locale, "/pricing")}>{t.home.pricingTeaser.cta}</TextLink>
          </div>
          <div className="mt-12">
            <PricingCards t={t} locale={locale} compact />
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container narrow>
          <SectionTitle>{t.home.faq.title}</SectionTitle>
          <div className="mt-10">
            <FaqList items={t.home.faq.items} locale={locale} />
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <p className="font-medium text-navy-900">{t.home.faq.more}</p>
            <ButtonLink href={whatsappUrl()} variant="whatsapp" size="sm" icon="whatsapp">
              {t.home.faq.whatsapp}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <FinalCta t={t} locale={locale} />
    </>
  );
}
