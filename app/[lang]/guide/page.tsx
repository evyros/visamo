import type { Metadata } from "next";
import Link from "next/link";
import { getGuides, guideIndex, readingMinutes, type Guide, type GuideSlug } from "@/content/guides";
import { getGlossaryTexts, glossaryPath, glossaryTerms } from "@/content/glossary";
import { getProcessTexts, processPath } from "@/content/process";
import type { Locale } from "@/i18n/config";
import { format, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/site";
import { Icon } from "@/components/icons";
import { Container, SectionTitle } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { index } = getGuides(locale);
  return pageMetadata({ locale, path: "/guide", title: index.metaTitle, description: index.description });
}

export default async function GuidesPage() {
  const locale = await getLocale();
  const guides = getGuides(locale);
  const { index } = guides;
  const readingTime = (guide: Guide) => format(guides.labels.readingTime, { minutes: readingMinutes(guide) });
  const process = getProcessTexts(locale);
  const glossary = getGlossaryTexts(locale);

  return (
    <section className="py-16 sm:py-20">
      <Container narrow>
        <SectionTitle as="h1">{index.title}</SectionTitle>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg lg:mx-0 lg:text-start">{index.intro}</p>


        <h2 className="mt-12 text-sm font-semibold tracking-wide text-teal-700 uppercase">{index.startHere}</h2>
        {/* The process guide: the steps for the couple's situation, for free. */}
        <Link
          href={localePath(locale, processPath)}
          className="group relative mt-3 flex flex-col gap-5 overflow-hidden rounded-2xl bg-navy-900 p-6 text-white sm:flex-row sm:items-center sm:p-7"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 end-[-15%] size-72 rounded-full bg-teal-600/30 blur-3xl"
          />
          <span className="relative min-w-0 flex-1">
            <span className="block text-sm font-semibold text-sage-200">{process.landing.eyebrow}</span>
            <span className="mt-1 block font-display text-2xl font-semibold">{process.labels.process}</span>
            <span className="mt-2 block text-[16px] leading-7 text-white/80">{process.landing.intro}</span>
          </span>
          <span className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-white px-5 font-semibold text-navy-900 group-hover:bg-sand-50">
            {process.landing.picker.label}
            <Icon name="arrow" className="size-4" />
          </span>
        </Link>

        {guideIndex.groups.map((group) => {
          const List = group.numbered ? "ol" : "ul";
          return (
            <section key={group.id} className="mt-14">
              <h2 className="font-display text-2xl font-semibold text-navy-900">{index.groups[group.id].title}</h2>
              <p className="mt-1 text-slate-500">{index.groups[group.id].intro}</p>
              <List className="mt-5 grid gap-4 sm:grid-cols-2">
                {group.slugs.map((slug, i) => (
                  <li key={slug}>
                    <GuideCard
                      className="h-full"
                      locale={locale}
                      slug={slug}
                      guide={guides.docs[slug]}
                      readingTime={readingTime(guides.docs[slug])}
                      step={group.numbered ? i + 1 : undefined}
                    />
                  </li>
                ))}
              </List>
            </section>
          );
        })}

        {/* The glossary: the words of the process, in English and Hebrew. */}
        <Link
          href={localePath(locale, glossaryPath)}
          className="group mt-14 flex items-center gap-5 rounded-2xl border border-line-200 bg-white p-5 hover:border-teal-600 sm:p-6"
        >
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-sage-200 font-display text-xl font-semibold text-navy-900">
            א
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-semibold text-navy-900 group-hover:text-teal-700">
              {glossary.card.title}
            </span>
            <span className="mt-1 block text-[16px] leading-7 text-slate-700">{glossary.card.body}</span>
            <span className="mt-2 block text-sm text-slate-500">
              {format(glossary.card.terms, { count: glossaryTerms.length })}
            </span>
          </span>
          <Icon name="arrow" className="size-5 shrink-0 text-teal-600" />
        </Link>
      </Container>
    </section>
  );
}

/** A guide's card, in its group. */
function GuideCard({
  locale,
  slug,
  guide,
  readingTime,
  step,
  className = "",
}: {
  locale: Locale;
  slug: GuideSlug;
  guide: Guide;
  readingTime: string;
  step?: number;
  className?: string;
}) {
  return (
    <Link
      href={localePath(locale, `/guide/${slug}`)}
      className={`group flex flex-col rounded-2xl border border-line-200 bg-white p-5 hover:border-teal-600 ${className}`}
    >
      <span className="flex items-start justify-between gap-4">
        <span className="font-display text-lg font-semibold text-navy-900 group-hover:text-teal-700">
          {step !== undefined && <span className="text-teal-600">{step} · </span>}
          {guide.title}
        </span>
        <Icon name="arrow" className="mt-1.5 size-5 shrink-0 text-teal-600" />
      </span>
      <span className="mt-4 flex flex-wrap gap-2">
        {guide.facts.map((fact) => (
          <span key={fact} className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
            {fact}
          </span>
        ))}
      </span>
      <span className="mt-auto block pt-4 text-sm text-slate-500">{readingTime}</span>
    </Link>
  );
}
