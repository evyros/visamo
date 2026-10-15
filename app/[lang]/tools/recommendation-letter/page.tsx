import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { FaqList } from "@/components/faq-list";
import { isIconName } from "@/components/icons";
import { RequestForm } from "@/components/letters/request-form";
import { Container, Eyebrow, IconTile, SectionTitle, mobileCenter } from "@/components/ui";

// The recommendation letters tool: a couple makes a link, their Israeli
// friends write and sign letters on it (app/[lang]/letter/[token]), and each
// letter is emailed to the couple as a PDF. Public, for search and for
// sharing, and also linked from the app's documents page.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return pageMetadata({
    locale: await getLocale(),
    path: "/tools/recommendation-letter",
    title: t.meta.letters.title,
    description: t.meta.letters.description,
  });
}

export default async function RecommendationLetterPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const l = t.letters.tool;

  return (
    <>
      <section className="py-16 sm:py-20">
        <Container>
          {/* On a phone the form comes right after the intro, before how it works. */}
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-x-16">
            <div className={mobileCenter}>
              <Eyebrow>{l.eyebrow}</Eyebrow>
              <SectionTitle as="h1" className="mt-3">
                {l.title}
              </SectionTitle>
              <p className="mt-5 text-lg">{l.intro}</p>
            </div>

            <div className="rounded-2xl border border-line-200 bg-white p-6 shadow-soft sm:p-8 lg:row-span-2">
              <RequestForm labels={l} lang={locale} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-navy-900">{l.how.title}</h2>
              <ol className="mt-5 space-y-5">
                {l.how.steps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-200 font-semibold text-navy-900">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-navy-900">{step.title}</h3>
                      <p className="mt-1 text-[16px]">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <Container>
          <SectionTitle>{l.benefits.title}</SectionTitle>
          <ul className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-3">
            {l.benefits.items.map((item) => (
              <li key={item.title}>
                {isIconName(item.icon) && <IconTile name={item.icon} />}
                <h3 className="mt-4 text-lg font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-[16px]">{item.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-14 flex flex-col gap-4 rounded-2xl bg-navy-900 p-6 text-slate-300 sm:flex-row sm:items-start sm:p-8">
            <IconTile name="lock" tone="dark" />
            <div>
              <h2 className="text-xl font-semibold text-white">{l.privacy.title}</h2>
              <p className="mt-2">{l.privacy.body}</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container narrow>
          <SectionTitle>{l.faq.title}</SectionTitle>
          <div className="mt-8">
            <FaqList items={l.faq.items} locale={locale} />
          </div>
        </Container>
      </section>
    </>
  );
}
