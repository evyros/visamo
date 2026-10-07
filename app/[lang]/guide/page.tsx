import type { Metadata } from "next";
import Link from "next/link";
import { getGuides, guideSlugs, readingMinutes } from "@/content/guides";
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

  return (
    <section className="py-16 sm:py-20">
      <Container narrow>
        <SectionTitle as="h1">{guides.index.title}</SectionTitle>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg lg:mx-0 lg:text-start">{guides.index.intro}</p>
        <ul className="mt-12 space-y-4">
          {guideSlugs.map((slug) => {
            const guide = guides.docs[slug];
            return (
              <li key={slug}>
                <Link
                  href={localePath(locale, `/guide/${slug}`)}
                  className="group flex items-start justify-between gap-4 rounded-2xl border border-line-200 bg-white p-6 hover:border-teal-600"
                >
                  <span>
                    <span className="block font-display text-xl font-semibold text-navy-900 group-hover:text-teal-700">
                      {guide.title}
                    </span>
                    <span className="mt-2 block text-[16px] leading-7 text-slate-700">{guide.description}</span>
                    <span className="mt-4 flex flex-wrap gap-2">
                      {guide.facts.map((fact) => (
                        <span key={fact} className="rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
                          {fact}
                        </span>
                      ))}
                    </span>
                    <span className="mt-4 block text-sm text-slate-500">
                      {format(guides.labels.readingTime, { minutes: readingMinutes(guide) })}
                    </span>
                  </span>
                  <Icon name="arrow" className="mt-1.5 size-5 shrink-0 text-teal-600" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
