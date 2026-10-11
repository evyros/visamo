import type { Metadata } from "next";
import Link from "next/link";
import {
  allAnswers,
  getProcessTexts,
  locations,
  processPath,
  processPublished,
  processUpdated,
  relationships,
  trackPath,
} from "@/content/process";
import { answersKey } from "@/content/process/types";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath, site } from "@/lib/site";
import { jsonLd, processLandingStructuredData } from "@/lib/structured-data";
import { FaqList } from "@/components/faq-list";
import { Icon } from "@/components/icons";
import { ProcessCta } from "@/components/process/parts";
import { SituationPicker, type SituationQuestion } from "@/components/process/situation-picker";
import { Container, Eyebrow, SectionTitle, mobileCenter } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { landing } = getProcessTexts(locale);
  return pageMetadata({
    locale,
    path: processPath,
    title: landing.metaTitle,
    description: landing.description,
    image: { path: localePath(locale, `${processPath}/opengraph-image/default`), alt: landing.metaTitle },
  });
}

export default async function ProcessLandingPage() {
  const locale = await getLocale();
  const texts = getProcessTexts(locale);
  // The closing section shows the home page's document check, as proof.
  const { mockup } = (await getDictionary()).home.hero;
  const { landing, answers } = texts;
  const { picker } = landing;

  const questions: SituationQuestion[] = [
    {
      id: "relationship",
      title: picker.questions.relationship,
      options: relationships.map((value) => ({ value, ...answers.relationship[value] })),
    },
    {
      id: "location",
      title: picker.questions.location,
      options: locations.map((value) => ({ value, ...answers.location[value] })),
    },
    {
      id: "lived",
      title: picker.questions.lived,
      options: (["yes", "no"] as const).map((value) => ({ value, ...answers.lived[value] })),
    },
  ];
  const paths = Object.fromEntries(
    allAnswers.map((a) => [
      answersKey(a.relationship, a.location, a.livedTogether ? "yes" : "no"),
      localePath(locale, trackPath(a)),
    ]),
  );

  const absolute = (path: string) => new URL(localePath(locale, path), site.url).toString();
  const structuredData = processLandingStructuredData({
    title: `${landing.title} ${landing.titleAccent}`,
    crumb: texts.labels.process,
    description: landing.description,
    url: absolute(processPath),
    image: absolute(`${processPath}/opengraph-image/default`),
    published: processPublished,
    updated: processUpdated,
    faq: landing.faq,
    indexUrl: absolute("/guide"),
    indexName: texts.labels.guides,
    inLanguage: locale,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <section className="relative overflow-hidden border-b border-line-200">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 end-[-10%] size-[640px] rounded-full bg-teal-600/10 blur-3xl"
        />
        <div aria-hidden="true" className="texture-dots pointer-events-none absolute inset-0" />
        <Container className="relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16 lg:py-24">
          <div className={mobileCenter}>
            <nav
              aria-label={texts.labels.guides}
              className="mb-4 flex items-center justify-center gap-1.5 text-sm font-semibold lg:justify-start"
            >
              <Link href={localePath(locale, "/guide")} className="text-teal-700 hover:underline">
                {texts.labels.guides}
              </Link>
              <Icon name="chevron" className="size-3.5 text-slate-300" />
              <span aria-current="page" className="text-slate-500">
                {texts.labels.process}
              </span>
            </nav>
            <Eyebrow>{landing.eyebrow}</Eyebrow>
            <SectionTitle as="h1" className="mt-4">
              {landing.title} <span className="block text-teal-600">{landing.titleAccent}</span>
            </SectionTitle>
            <p className="mx-auto mt-6 max-w-[560px] text-lg leading-8 text-slate-700 lg:mx-0">{landing.intro}</p>
            <ul className="mt-8 hidden gap-3 sm:flex sm:flex-wrap sm:justify-center lg:flex-col lg:justify-start">
              {landing.promises.map((promise) => (
                <li key={promise} className="flex items-center gap-3 font-medium text-navy-900">
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-sage-200">
                    <Icon name="check" className="size-4" strokeWidth={2.6} />
                  </span>
                  {promise}
                </li>
              ))}
            </ul>
          </div>
          <SituationPicker
            questions={questions}
            paths={paths}
            labels={{
              label: picker.label,
              progress: picker.progress,
              back: picker.back,
              opening: picker.opening,
              footnote: picker.footnote,
            }}
          />
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle>{landing.glance.title}</SectionTitle>
          <p className={`mx-auto mt-4 max-w-2xl text-lg leading-8 lg:mx-0 ${mobileCenter}`}>{landing.glance.intro}</p>
          <ol className="mt-12 grid gap-0 lg:grid-cols-5 lg:gap-6">
            {landing.glance.stages.map((stage, i) => {
              const last = i === landing.glance.stages.length - 1;
              return (
                <li key={stage.title} className="relative flex gap-5 pb-8 lg:flex-col lg:gap-0 lg:pb-0">
                  {/* The line to the next stage: down on a phone, across from lg up. */}
                  {!last && (
                    <span
                      aria-hidden="true"
                      className="absolute start-[19px] top-12 bottom-2 w-0.5 rounded-full bg-line-200 lg:start-14 lg:end-[-1.5rem] lg:top-5 lg:bottom-auto lg:h-0.5 lg:w-auto"
                    />
                  )}
                  <span className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-lg font-semibold text-white">
                    {(i + 1).toLocaleString(locale)}
                  </span>
                  <div className="pt-1.5 lg:pt-5">
                    <h3 className="text-lg font-semibold text-navy-900">{stage.title}</h3>
                    <p className="mt-1.5 text-[16px] leading-7">{stage.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionTitle>{landing.situations.title}</SectionTitle>
          <p className={`mx-auto mt-4 max-w-2xl text-lg leading-8 lg:mx-0 ${mobileCenter}`}>{landing.situations.intro}</p>
          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-8">
            {relationships.map((relationship) => (
              <div key={relationship}>
                <h3 className="font-display text-2xl font-semibold text-navy-900">{answers.relationship[relationship].label}</h3>
                <ul className="mt-4 grid gap-3">
                  {locations.map((location) => (
                    <li key={location}>
                      <Link
                        href={localePath(locale, trackPath({ relationship, location, livedTogether: true }))}
                        className="group flex items-center gap-4 rounded-2xl border border-line-200 bg-sand-50/60 p-4 transition-colors hover:border-teal-600 hover:bg-white sm:p-5"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-navy-900 group-hover:text-teal-700">
                            {answers.location[location].label}
                          </span>
                          <span className="mt-0.5 block text-[15px] leading-6 text-slate-500">{answers.location[location].hint}</span>
                        </span>
                        <Icon name="arrow" className="size-5 shrink-0 text-teal-600" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container narrow>
          <SectionTitle>{landing.faqTitle}</SectionTitle>
          <div className="mt-10">
            <FaqList items={landing.faq} locale={locale} />
          </div>
        </Container>
      </section>

      <ProcessCta texts={texts} locale={locale} mockup={mockup} />
    </>
  );
}
