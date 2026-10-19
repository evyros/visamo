import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath, signupUrl } from "@/lib/site";
import { homeStructuredData, jsonLd } from "@/lib/structured-data";
import { FaqList } from "@/components/faq-list";
import { FinalCta } from "@/components/final-cta";
import { Features } from "@/components/home/features";
import { FounderTeaser } from "@/components/home/founder-teaser";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { HowWeBuilt } from "@/components/home/how-we-built";
import { Problem } from "@/components/home/problem";
import { SecurityBand } from "@/components/home/security-band";
import { ButtonLink, Container, SectionTitle } from "@/components/ui";

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(homeStructuredData()) }} />
      <Hero t={t} locale={locale} />
      <Problem t={t} />
      <HowItWorks t={t} locale={locale} />
      <Features t={t} />
      {/* What it does first, then why to trust it: how it's built, security, the founder. */}
      <HowWeBuilt t={t} locale={locale} />
      <SecurityBand t={t} locale={locale} />
      <FounderTeaser t={t} locale={locale} />

      {/* Free first, prices on /pricing: a full price card here read as a paid product. */}
      <section className="bg-white py-16 sm:py-24">
        <Container narrow className="text-center">
          <SectionTitle align="center">{t.home.pricingTeaser.title}</SectionTitle>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-slate-700">{t.home.pricingTeaser.body}</p>
          <ButtonLink href={signupUrl(locale)} className="mt-8">
            {t.nav.startFree}
          </ButtonLink>
          <p className="mt-4 text-sm text-slate-500">{t.home.pricingTeaser.microcopy}</p>
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
            <ButtonLink href={localePath(locale, "/contact")} variant="secondary" size="sm">
              {t.home.faq.contact}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <FinalCta t={t} locale={locale} />
    </>
  );
}
