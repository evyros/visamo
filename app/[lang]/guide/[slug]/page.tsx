import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuides, guideSlugs, type GuideSlug } from "@/content/guides";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath, signupUrl, site } from "@/lib/site";
import { guideStructuredData, jsonLd } from "@/lib/structured-data";
import { FaqList } from "@/components/faq-list";
import { GuideBlocks, GuideText } from "@/components/guide";
import { Icon } from "@/components/icons";
import { ButtonLink, Container } from "@/components/ui";

const isSlug = (value: string): value is GuideSlug => (guideSlugs as readonly string[]).includes(value);

export const dynamicParams = false;

export function generateStaticParams() {
  return guideSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/guide/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const locale = await getLocale();
  const guide = getGuides(locale).docs[slug];
  return pageMetadata({ locale, path: `/guide/${slug}`, title: guide.metaTitle, description: guide.description });
}

export default async function GuidePage({ params }: PageProps<"/[lang]/guide/[slug]">) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const locale = await getLocale();
  const t = await getDictionary();
  const guides = getGuides(locale);
  const { labels } = guides;
  const guide = guides.docs[slug];
  const updated = new Intl.DateTimeFormat(locales[locale].intlLocale, { dateStyle: "long" }).format(
    new Date(`${guide.updated}T00:00:00`),
  );
  const structuredData = guideStructuredData({
    guide,
    url: new URL(localePath(locale, `/guide/${slug}`), site.url).toString(),
    indexUrl: new URL(localePath(locale, "/guide"), site.url).toString(),
    indexName: labels.guides,
    inLanguage: locale,
  });

  const contents = (
    <ul className="mt-3 grid gap-x-6 gap-y-2 text-[15px] sm:grid-cols-2">
      {[...guide.sections, { id: "faq", heading: labels.faq }].map((section) => (
        <li key={section.id}>
          <a href={`#${section.id}`} className="text-slate-700 hover:text-teal-700 hover:underline">
            {section.heading}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <header className="border-b border-line-200 bg-white py-12 sm:py-16">
        <Container narrow>
          <nav aria-label={labels.guides}>
            <Link href={localePath(locale, "/guide")} className="text-sm font-semibold text-teal-700 hover:underline">
              {labels.guides}
            </Link>
          </nav>
          <h1 className="mt-3 font-display text-4xl leading-[1.15] font-semibold text-balance text-navy-900 sm:text-[44px]">
            {guide.title}
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            {labels.updated}: <time dateTime={guide.updated}>{updated}</time>
          </p>

          <div className="mt-8 rounded-2xl border border-line-200 bg-sand-50 p-6 sm:p-7">
            <p className="text-sm font-semibold tracking-wide text-teal-700">{labels.shortAnswer}</p>
            <p className="mt-2 text-[17px] leading-8">
              <GuideText text={guide.answer} locale={locale} />
            </p>
          </div>

          {/* Open from sm up; on a phone it folds away, so the guide starts right after the short answer. */}
          <nav aria-label={labels.onThisPage} className="mt-8 hidden sm:block">
            <p className="text-sm font-semibold text-navy-900">{labels.onThisPage}</p>
            {contents}
          </nav>
          <details className="group mt-6 border-y border-line-200 sm:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
              {labels.onThisPage}
              <Icon name="chevronDown" className="size-5 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <nav aria-label={labels.onThisPage} className="pb-4">
              {contents}
            </nav>
          </details>
        </Container>
      </header>

      <Container narrow className="py-12 sm:py-16">
        <div className="space-y-12 text-[17px] leading-8">
          {guide.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display text-2xl leading-tight font-semibold text-navy-900 sm:text-[28px]">
                {section.heading}
              </h2>
              <div className="mt-5">
                <GuideBlocks blocks={section.body} locale={locale} />
              </div>
            </section>
          ))}

          <section id="faq" className="scroll-mt-24">
            <h2 className="font-display text-2xl leading-tight font-semibold text-navy-900 sm:text-[28px]">{labels.faq}</h2>
            <div className="mt-6">
              <FaqList items={guide.faq} locale={locale} />
            </div>
          </section>
        </div>

        <div className="mt-14 rounded-2xl bg-navy-900 p-8 text-center text-white sm:p-10">
          <h2 className="font-display text-2xl leading-tight font-semibold text-balance sm:text-[30px]">{guide.cta.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">{guide.cta.body}</p>
          <ButtonLink href={signupUrl(locale)} variant="inverse" className="mt-6">
            {t.common.ctaPrimary}
          </ButtonLink>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-navy-900">{labels.related}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {guide.related.map((related) => (
              <li key={related}>
                <Link
                  href={localePath(locale, `/guide/${related}`)}
                  className="group flex h-full items-start justify-between gap-3 rounded-xl border border-line-200 bg-white p-5 hover:border-teal-600"
                >
                  <span className="font-semibold text-navy-900 group-hover:text-teal-700">{guides.docs[related].title}</span>
                  <Icon name="arrow" className="mt-1 size-4 shrink-0 text-teal-600" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </article>
  );
}
