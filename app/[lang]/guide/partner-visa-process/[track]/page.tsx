import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuides } from "@/content/guides";
import {
  answersOf,
  canonicalAnswers,
  getProcessTexts,
  processGuide,
  processPath,
  processPublished,
  processUpdated,
  relatedGuides,
  trackPath,
  trackSlugs,
  type Answers,
} from "@/content/process";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath, site } from "@/lib/site";
import { jsonLd, processStructuredData } from "@/lib/structured-data";
import { GuideText } from "@/components/guide";
import { Icon } from "@/components/icons";
import {
  AboutGuide,
  DocumentList,
  ProcessCta,
  ProcessStep,
  SituationBar,
} from "@/components/process/parts";
import { StepNav } from "@/components/process/step-nav";
import { TrackFlow } from "@/components/process/track-flow";
import { Container } from "@/components/ui";

type Props = PageProps<"/[lang]/guide/partner-visa-process/[track]">;

export const dynamicParams = false;

export function generateStaticParams() {
  return trackSlugs.map((track) => ({ track }));
}

async function answersFrom(params: Props["params"]) {
  const answers = answersOf((await params).track);
  if (!answers) notFound();
  return answers;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const answers = await answersFrom(params);
  const locale = await getLocale();
  const guide = processGuide(locale, answers);
  // The versions for couples who haven't lived together point to their sibling (canonicalAnswers).
  return pageMetadata({
    locale,
    path: trackPath(canonicalAnswers(answers)),
    title: guide.metaTitle,
    description: guide.description,
    image: { path: shareImage(locale, answers), alt: guide.metaTitle },
    article: { published: processPublished, modified: processUpdated },
  });
}

const DOCUMENTS_ID = "documents";

/** The situation's share image: the canonical one's, as its other metadata. */
const shareImage = (locale: Locale, answers: Answers) =>
  localePath(locale, `${trackPath(canonicalAnswers(answers))}/opengraph-image`);

export default async function ProcessGuidePage({ params }: Props) {
  const answers = await answersFrom(params);
  const locale = await getLocale();
  const texts = getProcessTexts(locale);
  // The closing section shows the home page's document check, as proof.
  const { mockup } = (await getDictionary()).home.hero;
  const { labels } = texts;
  const guide = processGuide(locale, answers);
  const guides = getGuides(locale);
  const lengths = texts.track.lengths(answers);
  const details = texts.track.details(answers);

  const absolute = (path: string) => new URL(localePath(locale, path), site.url).toString();
  const structuredData = processStructuredData({
    guide,
    updated: processUpdated,
    published: processPublished,
    url: absolute(trackPath(answers)),
    image: new URL(shareImage(locale, answers), site.url).toString(),
    crumbs: [
      { name: labels.guides, url: absolute("/guide") },
      { name: labels.process, url: absolute(processPath) },
    ],
    inLanguage: locale,
  });
  const updated = new Intl.DateTimeFormat(locales[locale].intlLocale, { dateStyle: "long" }).format(
    new Date(`${processUpdated}T00:00:00`),
  );

  const navItems: { id: string; number?: string; label: string }[] = [
    ...guide.steps.map((step, i) => ({ id: `step-${step.id}`, number: (i + 1).toLocaleString(locale), label: step.short })),
  ];

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <header className="border-b border-line-200 bg-white">
        <Container className="py-10 sm:py-14">
          {/* Lined up with the steps below, which sit beside the list of steps from lg up. */}
          <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
            <div aria-hidden="true" className="hidden lg:block" />
            <div className="max-w-[760px]">
              <nav aria-label={labels.guides} className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                <Link href={localePath(locale, "/guide")} className="text-teal-700 hover:underline">
                  {labels.guides}
                </Link>
                <Icon name="chevron" className="size-3.5 text-slate-300" />
                <Link href={localePath(locale, processPath)} className="text-teal-700 hover:underline">
                  {labels.process}
                </Link>
              </nav>
              <h1 className="mt-4 font-display text-[34px] leading-[1.12] font-semibold text-balance text-navy-900 sm:text-[46px]">
                {guide.title}
              </h1>
              <p className="mt-3 text-sm text-slate-500">
                {labels.updated}: <time dateTime={processUpdated}>{updated}</time>
              </p>

              <SituationBar answers={answers} texts={texts} locale={locale} />

              <div className="mt-8 rounded-2xl border border-line-200 bg-sand-50 p-5 sm:p-7">
                <p className="text-sm font-semibold tracking-wide text-teal-700">{labels.shortVersion}</p>
                <p className="mt-2 text-[17px] leading-8">
                  <GuideText text={guide.answer} locale={locale} />
                </p>
              </div>

              <TrackFlow
                title={texts.track.title}
                stages={[
                  { name: texts.track.b1, length: lengths.b1, details: details.b1 },
                  { name: texts.track.a5, length: lengths.a5, details: details.a5 },
                  { name: texts.track.end, length: lengths.end, details: details.end },
                ]}
                locale={locale}
              />
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-12 sm:py-16">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <aside className="hidden lg:block">
            <StepNav label={labels.stepsNav} items={navItems} />
          </aside>

          <div className="min-w-0 max-w-[760px]">
            <details className="group mb-10 rounded-2xl border border-line-200 bg-white lg:hidden">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-sm font-semibold text-navy-900">
                {labels.jumpToStep}
                <Icon name="chevronDown" className="size-5 text-slate-500 transition-transform group-open:rotate-180" />
              </summary>
              <ol className="grid gap-0.5 px-4 pb-4 text-[15px]">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="flex gap-3 py-1.5 text-slate-700 hover:text-teal-700">
                      <span className="w-4 shrink-0 text-slate-500 tabular-nums">{item.number}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <ol className="space-y-16">
              {guide.steps.map((step, i) => (
                <ProcessStep
                  key={step.id}
                  step={step}
                  number={i + 1}
                  last={i === guide.steps.length - 1}
                  texts={texts}
                  locale={locale}
                >
                  {step.id === "file" && (
                    <DocumentList id={DOCUMENTS_ID} documents={guide.documents} texts={texts} locale={locale} />
                  )}
                </ProcessStep>
              ))}
            </ol>
          </div>
        </div>
      </Container>

      <ProcessCta texts={texts} locale={locale} mockup={mockup} />

      {/* After the call to action, so the last step leads straight into it. */}
      <Container narrow className="py-14 sm:py-16">
        <AboutGuide answers={answers} texts={texts} locale={locale} />

        <h2 className="mt-14 font-display text-xl font-semibold text-navy-900">{labels.related}</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {relatedGuides(answers).map((slug) => (
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
      </Container>
    </article>
  );
}
