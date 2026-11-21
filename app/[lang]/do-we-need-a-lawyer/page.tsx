import type { Metadata } from "next";
import Link from "next/link";
import { getGuides } from "@/content/guides";
import { getLawyerTexts, lawyerPath, lawyerRelated, lawyerUpdated, type LawyerSection } from "@/content/lawyer";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath, signupUrl, site } from "@/lib/site";
import { articleStructuredData, jsonLd } from "@/lib/structured-data";
import { FaqList } from "@/components/faq-list";
import { GuideBlocks, GuideText } from "@/components/guide";
import { IconTile } from "@/components/guide-figures";
import { Icon } from "@/components/icons";
import { ButtonLink, Container, Eyebrow } from "@/components/ui";

// Whether a couple needs a lawyer for the partner visa (content/lawyer): a page
// for search and for couples deciding, with the guides' reading style below
// its opening.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const texts = getLawyerTexts(locale);
  return pageMetadata({ locale, path: lawyerPath, title: texts.metaTitle, description: texts.description });
}

export default async function LawyerPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const texts = getLawyerTexts(locale);
  const guides = getGuides(locale);
  const updated = new Intl.DateTimeFormat(locales[locale].intlLocale, { dateStyle: "long" }).format(
    new Date(`${lawyerUpdated}T00:00:00`),
  );
  const structuredData = articleStructuredData({
    title: texts.title,
    description: texts.description,
    updated: lawyerUpdated,
    faq: texts.faq.items,
    url: new URL(localePath(locale, lawyerPath), site.url).toString(),
    inLanguage: locale,
  });

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <header className="relative overflow-hidden border-b border-line-200 bg-white py-12 sm:py-16 lg:py-20">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 end-[-12%] size-[28rem] rounded-full bg-sage-200/50 blur-3xl"
        />
        <Container className="relative">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              <Eyebrow>{texts.eyebrow}</Eyebrow>
              <h1 className="mt-3 font-display text-4xl leading-[1.12] font-semibold text-balance text-navy-900 sm:text-5xl">
                {texts.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8">
                <GuideText text={texts.answer} locale={locale} />
              </p>
              <a
                href="#when-you-need-a-lawyer"
                className="mt-6 inline-flex items-center gap-1.5 font-semibold text-teal-700 underline-offset-4 hover:underline"
              >
                {texts.whenLink}
                <Icon name="arrowDown" className="size-4" />
              </a>
              <p className="mt-6 text-sm text-slate-500">
                {texts.updated}: <time dateTime={lawyerUpdated}>{updated}</time>
              </p>
            </div>

            <aside aria-label={texts.summary.title} className="rounded-2xl border border-line-200 bg-sand-50 p-6 shadow-soft sm:p-7">
              <p className="text-sm font-semibold tracking-wide text-teal-700">{texts.summary.title}</p>
              <ul className="mt-5 space-y-5">
                {texts.summary.points.map((point) => (
                  <li key={point.title} className="flex items-start gap-4">
                    <IconTile name={point.icon} className="size-12" />
                    <div className="min-w-0">
                      <p className="text-[17px] leading-6 font-semibold text-navy-900">{point.title}</p>
                      <p className="mt-1 text-[15px] leading-6 text-slate-500">{point.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Container>
      </header>

      <Container narrow className="py-12 sm:py-16">
        <div className="space-y-12 text-[17px] leading-8">
          {texts.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display text-2xl leading-tight font-semibold text-navy-900 sm:text-[28px]">
                {section.heading}
              </h2>
              <div className="mt-5">
                {"compare" in section ? (
                  <CompareTable compare={section.compare} locale={locale} />
                ) : (
                  <GuideBlocks blocks={section.body} locale={locale} />
                )}
              </div>
            </section>
          ))}

          <section id="faq" className="scroll-mt-24">
            <h2 className="font-display text-2xl leading-tight font-semibold text-navy-900 sm:text-[28px]">
              {texts.faq.title}
            </h2>
            <div className="mt-6">
              <FaqList items={texts.faq.items} locale={locale} />
            </div>
          </section>
        </div>

        <div className="mt-14 rounded-2xl bg-navy-900 p-8 text-center text-white sm:p-10">
          <h2 className="font-display text-2xl leading-tight font-semibold text-balance sm:text-[30px]">{texts.cta.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">{texts.cta.body}</p>
          <ButtonLink href={signupUrl(locale)} variant="inverse" className="mt-6">
            {t.common.ctaPrimary}
          </ButtonLink>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold text-navy-900">{texts.related}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {lawyerRelated.map((slug) => (
              <li key={slug}>
                <Link
                  href={localePath(locale, `/guide/${slug}`)}
                  className="group flex h-full items-start justify-between gap-3 rounded-xl border border-line-200 bg-white p-5 hover:border-teal-600"
                >
                  <span className="font-semibold text-navy-900 group-hover:text-teal-700">{guides.docs[slug].title}</span>
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

/**
 * A lawyer and Visamo, task by task, with Visamo's column marked. From sm up
 * a table; on a phone each task is a card, each answer under its column's
 * name, from data-label.
 */
function CompareTable({
  compare,
  locale,
}: {
  compare: Extract<LawyerSection, { compare: unknown }>["compare"];
  locale: Locale;
}) {
  const answer =
    "px-4 py-3.5 align-top max-sm:grid max-sm:grid-cols-[minmax(6rem,36%)_1fr] max-sm:gap-3 max-sm:py-2.5 max-sm:before:content-[attr(data-label)]";
  return (
    <table className="w-full border-collapse text-start text-[15px] leading-6 max-sm:block sm:overflow-hidden sm:rounded-xl sm:border sm:border-line-200 sm:bg-white">
      <thead className="max-sm:sr-only">
        <tr>
          <th scope="col" className="w-[34%] border-b border-line-200 bg-sand-50 px-4 py-3.5 text-start font-semibold text-navy-900">
            {compare.head.task}
          </th>
          <th scope="col" className="border-b border-line-200 bg-sand-50 px-4 py-3.5 text-start font-semibold text-slate-700">
            {compare.head.lawyer}
          </th>
          <th scope="col" className="border-b border-teal-700 bg-teal-700 px-4 py-3.5 text-start font-semibold text-white">
            {compare.head.visamo}
          </th>
        </tr>
      </thead>
      <tbody className="max-sm:block max-sm:space-y-3">
        {compare.rows.map((row) => (
          <tr
            key={row.task}
            className="border-b border-line-200 last:border-b-0 max-sm:block max-sm:overflow-hidden max-sm:rounded-xl max-sm:border max-sm:last:border-b max-sm:bg-white"
          >
            <th scope="row" className="px-4 py-3.5 text-start align-top font-semibold text-navy-900 max-sm:block max-sm:pt-4 max-sm:pb-2">
              {row.task}
            </th>
            <td
              data-label={compare.head.lawyer}
              className={`${answer} text-slate-700 max-sm:border-t max-sm:border-line-200 max-sm:before:text-slate-500`}
            >
              <span>
                <GuideText text={row.lawyer} locale={locale} />
              </span>
            </td>
            <td
              data-label={compare.head.visamo}
              className={`${answer} bg-teal-100/70 font-medium text-navy-900 max-sm:before:font-semibold max-sm:before:text-teal-700`}
            >
              <span>
                <GuideText text={row.visamo} locale={locale} />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
