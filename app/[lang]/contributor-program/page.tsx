import type { Metadata } from "next";
import Link from "next/link";
import {
  contributorPath,
  contributorTermsPath,
  contributorTopic,
  getContributorTexts,
  type ContributorTexts,
} from "@/content/contributor-program";
import { getLocale } from "@/i18n/dictionaries";
import { formatPrice } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { pageMetadata } from "@/lib/metadata";
import { contributorProgramPrice, localePath, prices } from "@/lib/site";
import { Icon, type IconName } from "@/components/icons";
import { Badge, ButtonLink, Container, IconTile, SectionTitle, mobileCenter } from "@/components/ui";

// The Contributor program, for couples deciding whether to join: what they get,
// how to join, and what we promise. The details are on its terms page.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const texts = getContributorTexts(locale);
  const values = {
    price: formatPrice(contributorProgramPrice, locale),
    regular: formatPrice(prices.fileCheck, locale),
  };
  return pageMetadata({
    locale,
    path: contributorPath,
    title: format(texts.metaTitle, values),
    description: format(texts.description, values),
  });
}

export default async function ContributorProgramPage() {
  const locale = await getLocale();
  const texts = getContributorTexts(locale);
  const price = formatPrice(contributorProgramPrice, locale);
  const regular = formatPrice(prices.fileCheck, locale);
  const saving = formatPrice(prices.fileCheck - contributorProgramPrice, locale);
  const fill = (text: string) => format(text, { price, regular, saving });
  // The contact form, with joining the program chosen as the topic.
  const contactHref = localePath(locale, `/contact?topic=${contributorTopic}`);
  const termsHref = localePath(locale, contributorTermsPath);

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 end-[-10%] size-[640px] rounded-full bg-teal-600/10 blur-3xl"
        />
        <div aria-hidden="true" className="texture-dots pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="texture-grain pointer-events-none absolute inset-0" />
        <Container className="relative py-16 text-center sm:py-24">
          <Badge icon="sparkle">{texts.hero.eyebrow}</Badge>
          <SectionTitle as="h1" align="center" className="mt-5 max-w-4xl">
            {texts.hero.title} <span className="block text-teal-600">{fill(texts.hero.titleAccent)}</span>
          </SectionTitle>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-pretty text-slate-700">{fill(texts.hero.subtitle)}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <ButtonLink href={contactHref} icon="send">
              {texts.hero.cta}
            </ButtonLink>
            <ButtonLink href={termsHref} variant="secondary">
              {texts.hero.terms}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionTitle className="max-w-3xl">{texts.consent.title}</SectionTitle>
          <div className="mt-12 grid gap-5 lg:grid-cols-2 lg:gap-6">
            <ConsentCard card={texts.consent.without} icon="lock" fill={fill} />
            <ConsentCard card={texts.consent.with} icon="eye" fill={fill} highlighted />
          </div>
          <p className="mt-6 flex items-start gap-3 rounded-xl bg-sand-50 p-4 text-[16px] leading-7 font-medium text-navy-900 ring-1 ring-line-200 sm:px-5">
            <Icon name="info" className="mt-1 size-5 shrink-0 text-teal-700" />
            {texts.consent.note}
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle className="max-w-3xl">{texts.why.title}</SectionTitle>
          <ul className="mt-12 grid gap-5 lg:grid-cols-3 lg:gap-6">
            {texts.why.items.map((item) => (
              <li key={item.title} className="rounded-2xl border border-line-200 bg-white p-7 shadow-soft">
                <IconTile name={item.icon} />
                <h3 className="mt-5 text-xl font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-[16px] leading-7">{item.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionTitle className="max-w-3xl">{texts.steps.title}</SectionTitle>
          <ol className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
            {texts.steps.items.map((step, i) => (
              <li key={step.title}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-900 font-semibold text-white">
                    {(i + 1).toLocaleString(locale)}
                  </span>
                  {i < texts.steps.items.length - 1 && (
                    <span aria-hidden="true" className="hidden h-px flex-1 border-t-2 border-dotted border-line-200 lg:block" />
                  )}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-navy-900">{fill(step.title)}</h3>
                <p className="mt-2 text-[16px] leading-7">
                  <WithFormLink text={fill(step.body)} label={texts.steps.formLink} href={contactHref} />
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-navy-900 py-16 text-slate-300 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          <div className={mobileCenter}>
            <p className="text-sm font-semibold tracking-wide text-sage-200">{texts.promises.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-semibold text-balance text-white sm:text-[40px]">
              {texts.promises.title}
            </h2>
            <Link
              href={termsHref}
              className="mt-6 inline-flex items-center gap-1.5 font-semibold text-sage-200 underline-offset-4 hover:underline"
            >
              {texts.promises.link}
              <Icon name="arrow" className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {texts.promises.items.map((item) => (
              <li key={item.title} className="flex gap-4">
                <IconTile name={item.icon} tone="dark" />
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-[15px] leading-7">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="bg-sage-200 py-16 sm:py-20">
        <Container className="text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight font-semibold text-balance text-navy-900 sm:text-[40px]">
            {fill(texts.final.title)}
          </h2>
          <ButtonLink href={contactHref} icon="send" className="mt-8">
            {texts.hero.cta}
          </ButtonLink>
          <p className="mt-4 text-sm text-navy-900/70">{fill(texts.final.optional)}</p>
        </Container>
      </section>
    </>
  );
}

/** One side of the comparison: the program's side in teal, the other quiet. */
function ConsentCard({
  card,
  icon,
  fill,
  highlighted = false,
}: {
  card: ContributorTexts["consent"]["with"];
  icon: IconName;
  fill: (text: string) => string;
  highlighted?: boolean;
}) {
  return (
    <div
      // Both with a border, so their contents line up.
      className={`flex flex-col rounded-2xl border p-7 sm:p-8 ${
        highlighted ? "border-teal-700 bg-teal-700 text-white shadow-float" : "border-line-200 bg-sand-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex size-11 items-center justify-center rounded-xl ${
            highlighted ? "bg-white/15 text-white" : "bg-white text-navy-900 ring-1 ring-line-200"
          }`}
        >
          <Icon name={icon} className="size-5" />
        </span>
        <p className={`text-sm font-semibold tracking-wide ${highlighted ? "text-sage-200" : "text-slate-500"}`}>{card.label}</p>
      </div>
      <h3 className={`mt-6 font-display text-2xl leading-snug font-semibold sm:text-[28px] ${highlighted ? "text-white" : "text-navy-900"}`}>
        {card.title}
      </h3>
      <p className={`mt-3 mb-8 text-[17px] leading-7 ${highlighted ? "text-white/85" : ""}`}>{card.body}</p>
      <p
        className={`mt-auto border-t pt-5 font-semibold ${
          highlighted ? "border-white/20 text-white" : "border-line-200 text-navy-900"
        }`}
      >
        {fill(card.price)}
      </p>
    </div>
  );
}

/** Text with a {form} placeholder, made a link to the contact form. */
function WithFormLink({ text, label, href }: { text: string; label: string; href: string }) {
  const [before, after] = text.split("{form}");
  if (after === undefined) return text;
  return (
    <>
      {before}
      <Link href={href} className="font-semibold text-teal-700 underline-offset-4 hover:underline">
        {label}
      </Link>
      {after}
    </>
  );
}
