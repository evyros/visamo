import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { FinalCta } from "@/components/final-cta";
import { FounderPhoto } from "@/components/founder-photo";
import { Container, Eyebrow, SectionTitle, mobileCenter } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return pageMetadata({
    locale: await getLocale(),
    path: "/about",
    title: t.meta.about.title,
    description: t.meta.about.description,
  });
}

export default async function AboutPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const a = t.about;

  return (
    <>
      <section className="py-16 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-16">
          <figure className="mx-auto w-3/5 max-w-[440px] lg:w-full">
            <FounderPhoto size="lg" alt={a.photoAlt} />
            {a.caption && <figcaption className="mt-3 text-sm text-slate-500">{a.caption}</figcaption>}
          </figure>
          <div className="max-w-[680px]">
            <Eyebrow className={mobileCenter}>{a.eyebrow}</Eyebrow>
            <SectionTitle as="h1" className="mt-3">
              {a.title}
            </SectionTitle>
            <div className="mt-6 space-y-5 text-lg leading-8">
              {a.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <p className="mt-6 font-semibold text-navy-900">{a.signature}</p>
          </div>
        </Container>
      </section>
      <FinalCta t={t} locale={locale} />
    </>
  );
}
