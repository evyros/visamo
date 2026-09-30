import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/site";
import { FinalCta } from "@/components/final-cta";
import { Icon, isIconName } from "@/components/icons";
import { Container, Eyebrow, IconTile, SectionTitle, TextLink, mobileCenter } from "@/components/ui";

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
      <section className="py-16 text-center sm:py-24">
        <Container narrow>
          <Eyebrow>{h.hero.eyebrow}</Eyebrow>
          <SectionTitle as="h1" align="center" className="mt-3">
            {h.hero.title}
          </SectionTitle>
          <p className="mt-5 text-lg">{h.hero.subtitle}</p>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionTitle>{h.gap.title}</SectionTitle>
          <p className={`mt-3 max-w-3xl text-lg ${mobileCenter}`}>{h.gap.intro}</p>
          <ul className="mt-10 grid gap-5 lg:grid-cols-3">
            {h.gap.items.map((item) => (
              <li key={item.title} className="rounded-2xl border border-line-200 p-6">
                {isIconName(item.icon) && <IconTile name={item.icon} />}
                <p className="mt-4 font-semibold text-navy-900">{item.title}</p>
                <p className="mt-1 text-[15px] leading-7">{item.body}</p>
              </li>
            ))}
          </ul>
          <p className={`mt-6 text-slate-500 ${mobileCenter}`}>{h.gap.footnote}</p>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <SectionTitle>{h.steps.title}</SectionTitle>
          <ol className="mt-10 grid gap-8 lg:grid-cols-3">
            {h.steps.items.map((step, i) => (
              <li key={step.title}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-navy-900 font-semibold text-white">
                    {(i + 1).toLocaleString(locale)}
                  </span>
                  {isIconName(step.icon) && <Icon name={step.icon} className="size-6 text-teal-700" />}
                </div>
                <h3 className="mt-5 text-xl font-semibold text-navy-900">{step.title}</h3>
                <p className="mt-2 text-[16px] leading-7">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionTitle>{h.ai.title}</SectionTitle>
          <p className={`mt-3 max-w-3xl text-lg ${mobileCenter}`}>{h.ai.intro}</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <AiList title={h.ai.does.title} items={h.ai.does.items} tone="does" />
            <AiList title={h.ai.doesnt.title} items={h.ai.doesnt.items} tone="doesnt" />
          </div>
          <p className="mt-6 flex gap-2.5 rounded-2xl bg-sand-50 p-5 text-[15px] leading-7">
            <Icon name="scale" className="mt-1 size-5 text-slate-500" />
            {h.ai.lawyer}
          </p>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container narrow>
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-teal-600/25 bg-teal-100/50 p-6 text-center sm:flex-row sm:items-start sm:p-8 sm:text-start">
            <IconTile name="lock" />
            <div>
              <h2 className="text-xl font-semibold text-navy-900">{h.privacy.title}</h2>
              <p className="mt-2 text-[15px] leading-7">{h.privacy.body}</p>
              <TextLink href={localePath(locale, "/security")} className="mt-4">
                {h.privacy.link}
              </TextLink>
            </div>
          </div>
        </Container>
      </section>

      <FinalCta t={t} locale={locale} />
    </>
  );
}

function AiList({ title, items, tone }: { title: string; items: string[]; tone: "does" | "doesnt" }) {
  const does = tone === "does";
  return (
    <div className={`rounded-2xl border p-6 sm:p-8 ${does ? "border-teal-600/25 bg-teal-100/40" : "border-line-200 bg-sand-50"}`}>
      <p className="flex items-center gap-2.5 font-semibold text-navy-900">
        <Icon name={does ? "sparkle" : "info"} className={`size-5 ${does ? "text-teal-700" : "text-slate-500"}`} />
        {title}
      </p>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[15px] leading-7">
            <Icon
              name={does ? "check" : "minus"}
              className={`mt-1.5 size-4 ${does ? "text-teal-600" : "text-slate-500"}`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
