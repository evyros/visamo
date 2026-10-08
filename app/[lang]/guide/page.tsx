import type { Metadata } from "next";
import Link from "next/link";
import { getGuides, guideIndex, readingMinutes, type Guide, type GuideSlug } from "@/content/guides";
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

  return (
    <section className="py-16 sm:py-20">
      <Container narrow>
        <SectionTitle as="h1">{index.title}</SectionTitle>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg lg:mx-0 lg:text-start">{index.intro}</p>

        <h2 className="mt-12 text-sm font-semibold tracking-wide text-teal-700 uppercase">{index.startHere}</h2>
        <GuideCard
          className="mt-3"
          locale={locale}
          slug={guideIndex.featured}
          guide={guides.docs[guideIndex.featured]}
          readingTime={readingTime(guides.docs[guideIndex.featured])}
          featured
        />

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
      </Container>
    </section>
  );
}

/** A guide's card: the featured one with its description, the grouped ones without. */
function GuideCard({
  locale,
  slug,
  guide,
  readingTime,
  featured = false,
  step,
  className = "",
}: {
  locale: Locale;
  slug: GuideSlug;
  guide: Guide;
  readingTime: string;
  featured?: boolean;
  step?: number;
  className?: string;
}) {
  return (
    <Link
      href={localePath(locale, `/guide/${slug}`)}
      className={`group flex flex-col rounded-2xl border bg-white hover:border-teal-600 ${
        featured ? "border-teal-600/40 p-6 sm:p-7" : "border-line-200 p-5"
      } ${className}`}
    >
      <span className="flex items-start justify-between gap-4">
        <span className={`font-display font-semibold text-navy-900 group-hover:text-teal-700 ${featured ? "text-2xl" : "text-lg"}`}>
          {step !== undefined && <span className="text-teal-600">{step} · </span>}
          {guide.title}
        </span>
        <Icon name="arrow" className="mt-1.5 size-5 shrink-0 text-teal-600" />
      </span>
      {featured && <span className="mt-2 block text-[16px] leading-7 text-slate-700">{guide.description}</span>}
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
