import type { Metadata } from "next";
import Link from "next/link";
import { getGlossaryTexts, glossaryGroups, glossaryPath, glossaryUpdated } from "@/content/glossary";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath, signupUrl, site } from "@/lib/site";
import { glossaryStructuredData, jsonLd } from "@/lib/structured-data";
import { GlossaryList, type GlossarySection } from "@/components/glossary-list";
import { Icon } from "@/components/icons";
import { ButtonLink, Container } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const texts = getGlossaryTexts(locale);
  return pageMetadata({ locale, path: glossaryPath, title: texts.metaTitle, description: texts.description });
}

export default async function GlossaryPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const texts = getGlossaryTexts(locale);
  const { labels } = texts;
  const updated = new Intl.DateTimeFormat(locales[locale].intlLocale, { dateStyle: "long" }).format(
    new Date(`${glossaryUpdated}T00:00:00`),
  );

  // In English, a term is its English name, then its Hebrew and how it's said.
  // In Hebrew, it's the Hebrew, then the English: a Hebrew reader needs no transliteration.
  const hebrew = locale === "he";
  const sections: GlossarySection[] = glossaryGroups.map((group) => ({
    id: group.id,
    title: texts.groups[group.id].title,
    note: texts.groups[group.id].note,
    entries: group.terms.map((term) => ({
      id: term.id,
      name: hebrew ? term.hebrew : term.english,
      other: hebrew ? { text: term.english, lang: "en" } : { text: term.hebrew, lang: "he" },
      said: hebrew ? undefined : term.said,
      meaning: texts.meanings[term.id],
      guide: term.guide && { href: localePath(locale, `/guide/${term.guide}`), label: labels.readGuide },
    })),
  }));

  const absolute = (path: string) => new URL(localePath(locale, path), site.url).toString();
  const structuredData = glossaryStructuredData({
    title: texts.title,
    description: texts.description,
    url: absolute(glossaryPath),
    updated: glossaryUpdated,
    terms: sections.flatMap((section) =>
      section.entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        alternateName: [...new Set([entry.other.text, ...(entry.said ? [entry.said] : [])])],
        description: entry.meaning,
      })),
    ),
    indexUrl: absolute("/guide"),
    indexName: labels.guides,
    inLanguage: locale,
  });

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <header className="border-b border-line-200 bg-white py-12 sm:py-16">
        <Container narrow>
          <nav aria-label={labels.guides} className="flex items-center gap-1.5 text-sm font-semibold">
            <Link href={localePath(locale, "/guide")} className="text-teal-700 hover:underline">
              {labels.guides}
            </Link>
            <Icon name="chevron" className="size-3.5 text-slate-300" />
            <span aria-current="page" className="text-slate-500">
              {labels.glossary}
            </span>
          </nav>
          <h1 className="mt-3 font-display text-4xl leading-[1.15] font-semibold text-balance text-navy-900 sm:text-[44px]">
            {texts.title}
          </h1>
          <p className="mt-4 text-lg leading-8">{texts.intro}</p>
          <p className="mt-4 text-sm text-slate-500">
            {labels.updated}: <time dateTime={glossaryUpdated}>{updated}</time>
          </p>
        </Container>
      </header>

      <Container narrow className="pt-4 pb-12 sm:pb-16">
        <GlossaryList sections={sections} labels={texts.search} />

        <div className="mt-14 rounded-2xl bg-navy-900 p-8 text-center text-white sm:p-10">
          <h2 className="font-display text-2xl leading-tight font-semibold text-balance sm:text-[30px]">{texts.cta.title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">{texts.cta.body}</p>
          <ButtonLink href={signupUrl(locale)} variant="inverse" className="mt-6">
            {t.common.ctaPrimary}
          </ButtonLink>
        </div>
      </Container>
    </article>
  );
}
