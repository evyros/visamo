import type { Metadata } from "next";
import { sourcesPath } from "@/content/sources";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath, site } from "@/lib/site";
import { jsonLd, sourcesStructuredData } from "@/lib/structured-data";
import { FinalCta } from "@/components/final-cta";
import { Icon } from "@/components/icons";
import { SourceGlyph, sourceGlyphs, type SourceGlyphName } from "@/components/source-glyphs";
import { SourcesFigure } from "@/components/sources-figure";
import { Container, Eyebrow, SectionTitle, TextLink } from "@/components/ui";

// Where Visamo's knowledge comes from: a page for couples, restating
// lib/knowledge/sources.md (content/sources/sources.test.ts keeps them in step).
// It says what the chat and the check are built on, never how a document is
// checked: that's lib/documents/checks.ts, and it stays private.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getDictionary();
  return pageMetadata({
    locale,
    path: sourcesPath,
    title: t.meta.sources.title,
    description: t.meta.sources.description,
    image: { path: localePath(locale, `${sourcesPath}/opengraph-image/default`), alt: t.sources.hero.title },
  });
}

export default async function SourcesPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const s = t.sources;
  const structuredData = sourcesStructuredData({
    title: t.meta.sources.title,
    description: t.meta.sources.description,
    url: site.url + localePath(locale, sourcesPath),
    listName: s.list.title,
    sources: s.list.items,
    inLanguage: locale,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div aria-hidden="true" className="texture-dots pointer-events-none absolute inset-0" />
        <Container narrow className="relative text-center">
          <Eyebrow>{s.hero.eyebrow}</Eyebrow>
          <SectionTitle as="h1" align="center" className="mt-3">
            {s.hero.title}
          </SectionTitle>
          <p className="mx-auto mt-5 max-w-[560px] text-lg leading-8 text-pretty">{s.hero.subtitle}</p>
          <div className="mt-12 sm:mt-14">
            <SourcesFigure label={s.hero.figure} chat={s.hero.chat} check={s.hero.check} />
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container narrow>
          <SectionTitle align="center">{s.list.title}</SectionTitle>
          <ol className="mt-12 divide-y divide-line-200 border-y border-line-200">
            {s.list.items.map((item, i) => (
              <li key={item.title} className="grid grid-cols-[auto_1fr] gap-5 py-7 sm:gap-7 sm:py-8">
                <SourceTile name={sourceGlyphs[i]} />
                <div>
                  <p className="text-sm font-semibold text-teal-700 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-navy-900 sm:text-2xl">{item.title}</h3>
                  <p className="mt-2 text-[16px] leading-7 text-pretty">{item.body}</p>
                  {sourceGlyphs[i] === "firsthand" && (
                    <TextLink href={localePath(locale, "/about")} className="mt-3 text-[15px]">
                      {s.list.founderLink}
                    </TextLink>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-12 max-w-[600px] text-center font-display text-2xl leading-snug font-medium text-balance text-navy-900 sm:text-[28px]">
            {s.list.closing}
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container narrow>
          <SectionTitle align="center">{s.use.title}</SectionTitle>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            <UseCard glyph="chat" title={s.use.chat.title} body={s.use.chat.body} />
            <UseCard glyph="check" title={s.use.check.title} body={s.use.check.body} />
          </div>
          <p className="mt-6 flex items-start justify-center gap-2 text-center text-[15px] leading-6 text-slate-500">
            {/* Centered on the first line: (24px line − 16px icon) / 2. */}
            <Icon name="lock" className="mt-1 size-4 shrink-0" />
            {s.use.privacy}
          </p>
        </Container>
      </section>

      {/* Shares the section above's background: it closes it, with no gap of its own above. */}
      <section className="pb-16 sm:pb-24">
        <Container narrow>
          <div className="flex flex-col gap-4 rounded-2xl border border-line-200 bg-white p-6 sm:flex-row sm:items-start sm:p-8">
            <Icon name="scale" className="size-6 shrink-0 text-slate-500" />
            <div>
              <p className="text-[16px] leading-7">{s.limits.body}</p>
              <TextLink href={localePath(locale, "/how-we-built")} className="mt-3 text-[15px]">
                {s.limits.link}
              </TextLink>
            </div>
          </div>
        </Container>
      </section>

      <FinalCta t={t} locale={locale} />
    </>
  );
}

/** A source's glyph on its tile, beside its name. */
function SourceTile({ name }: { name: SourceGlyphName }) {
  return (
    <span className="inline-flex size-14 items-center justify-center rounded-2xl border border-line-200 bg-sand-50 text-navy-900 sm:size-16">
      <SourceGlyph name={name} className="size-8 sm:size-9" />
    </span>
  );
}

function UseCard({ glyph, title, body }: { glyph: SourceGlyphName; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line-200 bg-white p-6 sm:p-7">
      <span className="inline-flex size-14 items-center justify-center rounded-full border border-teal-600/30 bg-teal-100 text-teal-700">
        <SourceGlyph name={glyph} className="size-8" />
      </span>
      <h3 className="mt-5 font-display text-xl font-semibold text-navy-900">{title}</h3>
      <p className="mt-2 text-[16px] leading-7 text-pretty">{body}</p>
    </div>
  );
}
