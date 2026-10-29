import type { Metadata } from "next";
import Link from "next/link";
import { branchesPath, getBranchesTexts, surveyPath, type BranchesStats, type BranchesTexts } from "@/content/branches";
import { locales, type Locale } from "@/i18n/config";
import { format, getDictionary, getLocale } from "@/i18n/dictionaries";
import { branchLoad, type BranchLoad } from "@/lib/branch-load";
import { getBranchStats } from "@/lib/branch-reports";
import { branches, type BranchCode } from "@/lib/case-options";
import { pageMetadata } from "@/lib/metadata";
import { localePath, signupUrl, site } from "@/lib/site";
import { branchesStructuredData, jsonLd } from "@/lib/structured-data";
import { BranchList, type BranchListItem } from "@/components/branch-list";
import { BusyGauge, BusyLevel, SentimentBar, SentimentLegend, StageChart, plural, stageWords } from "@/components/branch-stats";
import { Icon } from "@/components/icons";
import { ButtonLink, Container } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const texts = getBranchesTexts(locale);
  return pageMetadata({ locale, path: branchesPath, title: texts.metaTitle, description: texts.description });
}

const levels: BranchLoad[] = ["lessBusy", "typical", "busier", "unknown"];

/** "2026-04" and "2026-10" as "April" and "October 2026": the year once, when both share it. */
function months(from: string, to: string, locale: Locale) {
  const intl = locales[locale].intlLocale;
  const date = (ym: string) => new Date(`${ym}-01T00:00:00`);
  const monthOnly = new Intl.DateTimeFormat(intl, { month: "long" });
  const monthYear = new Intl.DateTimeFormat(intl, { month: "long", year: "numeric" });
  const sameYear = from.slice(0, 4) === to.slice(0, 4);
  return { from: (sameYear ? monthOnly : monthYear).format(date(from)), to: monthYear.format(date(to)) };
}

/** A branch's name as the app has it, "Hadera – David Shimoni": the city, then the street. */
function nameParts(name: string) {
  const at = Math.max(name.lastIndexOf(" – "), name.lastIndexOf(" - "));
  return at < 0 ? { city: name, street: "" } : { city: name.slice(0, at), street: name.slice(at + 3) };
}

export default async function BranchesPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const texts = getBranchesTexts(locale);
  // Every report counted so far: a verified survey vote shows on the next visit.
  const stats = await getBranchStats();
  const names = t.app.onboarding.branches;
  const intl = locales[locale].intlLocale;
  const posted = months(stats.posted.from, stats.posted.to, locale);
  const basis = format(texts.basis, { couples: stats.couples.toLocaleString(intl), ...posted });

  // The numbers as a Dataset, in the words the page shows them, without the
  // marks that keep a range's digits in order in Hebrew.
  const plain = (text: string) => text.replace(/[\u2066-\u2069]/g, "");
  const structuredData = branchesStructuredData({
    title: texts.title,
    description: `${texts.description} ${basis}.`,
    url: new URL(localePath(locale, branchesPath), site.url).toString(),
    temporalCoverage: `${stats.posted.from}/${stats.posted.to}`,
    // "Where the numbers come from".
    measurementTechnique: texts.method.items[0].body,
    variables: [
      ...stats.stages.map((s) => {
        const w = stageWords(s, texts, locale);
        return {
          name: w.title,
          description: plain(`${texts.stages.typical}: ${w.value}. ${texts.stages.usual}: ${w.range}. ${w.count}.`),
          days: s.median,
        };
      }),
      { name: texts.levels.title, description: texts.levels.intro },
      { name: texts.sentiment.title, description: Object.values(texts.sentiment.items).join(" / ") },
    ],
    inLanguage: locale,
  });

  const items: BranchListItem[] = [...branches]
    .map((code) => ({ code, couples: stats.branches[code]?.couples ?? 0, ...nameParts(names[code]) }))
    // The most reported first: their numbers are the most solid. Equal ones by name.
    .sort((a, b) => b.couples - a.couples || a.city.localeCompare(b.city, intl))
    .map(({ code, city, street }) => ({
      id: code,
      level: branchLoad[code],
      search: `${names[code]} ${code}`.toLowerCase().replace(/[\s\-–/'"״׳.,()]+/g, ""),
      card: <BranchCard code={code} city={city} street={street} stats={stats} texts={texts} locale={locale} />,
    }));

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <header className="border-b border-line-200 bg-white py-12 sm:py-16">
        <Container>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.15] font-semibold text-balance text-navy-900 sm:text-5xl">
            {texts.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8">{texts.intro}</p>
          {/* The icon on the first line when the sentence wraps. */}
          <p className="mt-5 flex items-start gap-1.5 text-sm text-slate-500">
            <Icon name="people" className="mt-0.5 size-4 shrink-0" />
            {basis}
          </p>
          <div className="relative mt-8 flex flex-col gap-5 overflow-hidden rounded-2xl bg-navy-900 p-6 text-white sm:p-8 md:flex-row md:items-center md:justify-between">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 end-[-10%] size-80 rounded-full bg-teal-600/30 blur-3xl"
            />
            <div className="relative max-w-2xl">
              <p className="text-sm font-semibold text-sage-200">{texts.share.eyebrow}</p>
              <h2 className="mt-1 font-display text-2xl font-semibold">{texts.share.title}</h2>
              <p className="mt-2 text-[16px] leading-7 text-white/80">{texts.share.body}</p>
            </div>
            <Link
              href={localePath(locale, surveyPath)}
              className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-white px-5 font-semibold text-navy-900 transition-colors hover:bg-sand-50"
            >
              {texts.share.button}
              <Icon name="arrow" className="size-4" />
            </Link>
          </div>
        </Container>
      </header>

      <section className="py-12 sm:py-16">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-line-200 bg-white p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-navy-900">{texts.stages.title}</h2>
              <p className="mt-2 text-[16px] leading-7 text-slate-700">{texts.stages.intro}</p>
              <div className="mt-8">
                <StageChart stages={stats.stages} t={texts} locale={locale} />
              </div>
            </div>
            <LevelsPanel texts={texts} locale={locale} />
          </div>
        </Container>
      </section>

      <section className="pb-12 sm:pb-16">
        <Container>
          <h2 className="font-display text-3xl font-semibold text-navy-900 sm:text-[34px]">{texts.list.title}</h2>
          <p className="mt-2 text-slate-700">{texts.list.intro}</p>
          <div className="mt-4">
            <SentimentLegend t={texts} />
          </div>
          <div className="mt-2">
            <BranchList
              items={items}
              labels={{
                search: texts.list.search,
                all: texts.list.all,
                levels: Object.fromEntries(levels.map((l) => [l, texts.levels.items[l].label])) as Record<BranchLoad, string>,
              }}
            />
          </div>
        </Container>
      </section>

      <section className="border-t border-line-200 bg-white py-12 sm:py-16">
        <Container>
          <h2 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{texts.method.title}</h2>
          <dl className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {texts.method.items.map((item) => (
              <div key={item.title} className="rounded-2xl bg-sand-50 p-5">
                <dt className="font-semibold text-navy-900">{item.title}</dt>
                <dd className="mt-1.5 text-[15px] leading-7">{item.body}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container narrow className="py-12 sm:py-16">
        <div className="rounded-2xl bg-navy-900 p-8 text-center text-white sm:p-10">
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

/** The three levels: what each means, and how many branches are at it. */
function LevelsPanel({ texts, locale }: { texts: BranchesTexts; locale: Locale }) {
  return (
    <div className="rounded-2xl border border-line-200 bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl font-semibold text-navy-900">{texts.levels.title}</h2>
      <p className="mt-2 text-[16px] leading-7 text-slate-700">{texts.levels.intro}</p>
      <ul className="mt-6 space-y-5">
        {levels.map((level) => {
          const count = branches.filter((code) => branchLoad[code] === level).length;
          return (
            <li key={level} className="flex items-center gap-4">
              <BusyGauge level={level} className="h-10 w-16" />
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold text-navy-900">{texts.levels.items[level].label}</span>
                  <span className="text-sm text-slate-500">{plural(texts.levels.count, count, locale)}</span>
                </p>
                <p className="text-[15px] leading-6 text-slate-700">{texts.levels.items[level].body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BranchCard({
  code,
  city,
  street,
  stats: all,
  texts,
  locale,
}: {
  code: BranchCode;
  city: string;
  street: string;
  stats: BranchesStats;
  texts: BranchesTexts;
  locale: Locale;
}) {
  const stats = all.branches[code] ?? { couples: 0, sentiment: null, waits: {} };
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line-200 bg-white p-5 shadow-soft sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-tight font-semibold text-navy-900">{city}</h3>
          {street && <p className="mt-0.5 text-sm text-slate-500">{street}</p>}
        </div>
        <div>
          <BusyLevel level={branchLoad[code]} t={texts} />
        </div>
      </header>

      {/* At the bottom, so the bars line up across a row whatever the names' length. */}
      <section className="mt-auto border-t border-line-200 pt-4">
        <h4 className="text-xs font-semibold tracking-wide text-teal-700 uppercase">{texts.sentiment.title}</h4>
        <div className="mt-3">
          <SentimentBar stats={stats} t={texts} locale={locale} />
        </div>
      </section>

      {/* The branch's own waits (BranchWaits, under texts.card.waits) are hidden: too few per branch to show yet. */}
    </article>
  );
}
