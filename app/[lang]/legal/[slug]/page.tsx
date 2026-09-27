import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { getLegal, type LegalBlock, type LegalSlug } from "@/content/legal";
import { pageMetadata } from "@/lib/metadata";
import { Container, SectionTitle } from "@/components/ui";

const slugs: LegalSlug[] = ["privacy", "terms", "accessibility"];
const isSlug = (value: string): value is LegalSlug => (slugs as string[]).includes(value);

export const dynamicParams = false;

export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const t = await getDictionary();
  return pageMetadata({
    locale: await getLocale(),
    path: `/legal/${slug}`,
    title: t.meta.legal[slug].title,
    description: t.meta.legal[slug].description,
  });
}

export default async function LegalPage({ params }: PageProps<"/[lang]/legal/[slug]">) {
  const { slug } = await params;
  if (!isSlug(slug)) notFound();
  const locale = await getLocale();
  const legal = getLegal(locale);
  const doc = legal.docs[slug];
  const updated = new Intl.DateTimeFormat(locales[locale].intlLocale, { dateStyle: "long" }).format(
    new Date(`${legal.updated}T00:00:00`),
  );

  return (
    <article className="py-16 sm:py-20">
      <Container narrow>
        <SectionTitle as="h1">{doc.title}</SectionTitle>
        <p className="mt-3 text-sm text-slate-500">
          {legal.updatedLabel}: <time dateTime={legal.updated}>{updated}</time>
        </p>
        <div className="mt-8 space-y-4 text-[17px] leading-8">
          {doc.intro.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>
        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="text-xl font-semibold text-navy-900">{section.heading}</h2>
            <div className="mt-3 space-y-4 text-[17px] leading-8">
              {section.body.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
          </section>
        ))}
      </Container>
    </article>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === "string") return <p>{block}</p>;
  return (
    <ul className="list-disc space-y-2 ps-6 marker:text-teal-600">
      {block.list.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
