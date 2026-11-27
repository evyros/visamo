import type { Metadata } from "next";
import Link from "next/link";
import { sourcesPath } from "@/content/sources";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/site";
import { FinalCta } from "@/components/final-cta";
import { GapFigure, PrivacyFigure, SourcesWeb, StepFigure, isGapFigure, isStepFigure } from "@/components/how-we-built-figures";
import { Icon } from "@/components/icons";
import { Container, Eyebrow, SectionTitle, mobileCenter } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return pageMetadata({
    locale: await getLocale(),
    path: "/how-we-built",
    title: t.meta.howBuilt.title,
    description: t.meta.howBuilt.description,
  });
}

export default async function HowWeBuiltPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const h = t.howBuilt;

  return (
    <>
      <section className="relative overflow-hidden py-16 text-center sm:py-24">
        <div aria-hidden="true" className="texture-dots pointer-events-none absolute inset-0" />
        <Container narrow className="relative">
          <Eyebrow>{h.hero.eyebrow}</Eyebrow>
          <SectionTitle as="h1" align="center" className="mt-3">
            {h.hero.title}
          </SectionTitle>
          <p className="mx-auto mt-5 max-w-[600px] text-lg leading-8 text-pretty">{h.hero.subtitle}</p>
        </Container>
      </section>

      {/* The gaps: three drawings, no cards, so they read as one row of ideas. */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionTitle align="center">{h.gap.title}</SectionTitle>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-8 text-pretty">{h.gap.intro}</p>
          <ul className="mt-12 grid gap-12 sm:mt-14 md:grid-cols-3 md:gap-0">
            {h.gap.items.map((item) => (
              <li key={item.title} className="px-2 text-center md:border-s md:border-line-200 md:px-8 md:first:border-s-0 lg:px-10">
                {isGapFigure(item.icon) && <GapFigure name={item.icon} className="mx-auto w-44" />}
                <h3 className="mt-5 font-display text-xl font-semibold text-navy-900">{item.title}</h3>
                <p className="mx-auto mt-2 max-w-[300px] text-[16px] leading-7 text-pretty">{item.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle align="center">{h.steps.title}</SectionTitle>
          <ol className="mt-12 grid gap-14 sm:mt-14 md:grid-cols-3 md:gap-8 lg:gap-12">
            {h.steps.items.map((step, i) => (
              <li key={step.title} className="relative text-center">
                {/* Between the drawings, a chevron along the reading direction. */}
                {i > 0 && (
                  <Icon
                    name="chevron"
                    className="absolute top-[70px] -start-6 hidden size-5 -translate-y-1/2 text-teal-600/60 md:block lg:-start-8"
                  />
                )}
                {isStepFigure(step.icon) && <StepFigure name={step.icon} className="mx-auto w-full max-w-[260px]" />}
                <p className="mt-6 text-sm font-semibold text-teal-700 tabular-nums">
                  {(i + 1).toLocaleString(locale, { minimumIntegerDigits: 2 })}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-navy-900 sm:text-2xl">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-[320px] text-[16px] leading-7 text-pretty">{step.body}</p>
              </li>
            ))}
          </ol>

          {/* Where the knowledge comes from: the whole strip is the link, the seven sources' web its hint. */}
          <Link
            href={localePath(locale, sourcesPath)}
            className="group relative mt-16 block overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-teal-700 p-6 text-white shadow-float transition-shadow hover:shadow-soft focus-visible:outline-offset-4 sm:mt-20 sm:p-8 lg:p-10"
          >
            <span aria-hidden="true" className="pointer-events-none absolute -top-24 -end-24 size-72 rounded-full bg-white/10 blur-2xl" />
            <span className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
              <span className={`block ${mobileCenter}`}>
                <span className="block font-display text-2xl leading-tight font-semibold text-balance sm:text-3xl">
                  {h.steps.sourcesLink}
                </span>
                <span className="mt-2 block text-[16px] leading-7 text-pretty text-white/85">{t.sources.hero.subtitle}</span>
              </span>
              <span className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center lg:justify-end">
                <SourcesWeb className="w-full max-w-[380px] sm:w-[380px]" />
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  <Icon name="arrow" className="size-6" />
                </span>
              </span>
            </span>
          </Link>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionTitle align="center">{h.ai.title}</SectionTitle>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-8 text-pretty">{h.ai.intro}</p>
          <div className="mt-12 grid gap-12 sm:mt-14 md:grid-cols-2 md:gap-0 [&>*+*]:md:border-s [&>*+*]:md:border-line-200">
            <AiList title={h.ai.does.title} items={h.ai.does.items} tone="does" />
            <AiList title={h.ai.doesnt.title} items={h.ai.doesnt.items} tone="doesnt" />
          </div>
          <p className="mx-auto mt-12 flex max-w-3xl items-start justify-center gap-2.5 text-center text-[15px] leading-6 text-slate-500">
            <Icon name="scale" className="mt-0.5 size-5 shrink-0" />
            {h.ai.lawyer}
          </p>
        </Container>
      </section>

      {/* Privacy gets its own dark band, as on the home page and /security. */}
      <section className="relative overflow-hidden bg-navy-900 py-16 text-white sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-64 -start-40 size-[640px] rounded-full bg-teal-600/20 blur-3xl"
        />
        <Container className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
          <div className={mobileCenter}>
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-white/10 text-sage-200">
              <Icon name="lock" className="size-6" />
            </span>
            <h2 className="mt-5 font-display text-3xl leading-tight font-semibold text-balance sm:text-[40px]">
              {h.privacy.title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-pretty text-white/80 lg:mx-0">{h.privacy.body}</p>
            <Link
              href={localePath(locale, "/security")}
              className="mt-7 inline-flex items-center gap-1.5 font-semibold text-sage-200 underline-offset-4 hover:underline"
            >
              {h.privacy.link}
              <Icon name="arrow" className="size-4" />
            </Link>
          </div>
          <PrivacyFigure className="mx-auto w-full max-w-[360px] lg:max-w-none" />
        </Container>
      </section>

      <FinalCta t={t} locale={locale} />
    </>
  );
}

function AiList({ title, items, tone }: { title: string; items: string[]; tone: "does" | "doesnt" }) {
  const does = tone === "does";
  return (
    <div className="md:px-10 lg:px-14">
      <div className="flex items-center justify-center gap-3 md:justify-start">
        <span
          className={`inline-flex size-11 items-center justify-center rounded-xl ${
            does ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-soft" : "border border-line-200 bg-sand-50 text-slate-500"
          }`}
        >
          <Icon name={does ? "sparkle" : "info"} className="size-6" />
        </span>
        <h3 className="font-display text-2xl font-semibold text-navy-900">{title}</h3>
      </div>
      <ul className="mt-6 divide-y divide-line-200">
        {items.map((item) => (
          <li key={item} className="flex gap-3.5 py-4 text-[16px] leading-7">
            <span
              className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full ${
                does ? "bg-teal-100 text-teal-700" : "bg-sand-50 text-slate-500 ring-1 ring-line-200"
              }`}
            >
              <Icon name={does ? "check" : "minus"} className="size-4" />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
