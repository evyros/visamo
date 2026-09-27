import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { Icon } from "@/components/icons";
import { Container, SectionTitle, mobileCenter } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return pageMetadata({
    locale: await getLocale(),
    path: "/data-privacy",
    title: t.meta.dataPrivacy.title,
    description: t.meta.dataPrivacy.description,
  });
}

export default async function DataPrivacyPage() {
  const t = await getDictionary();
  const d = t.dataPrivacy;
  const parts = [
    { id: "protect", title: d.protect.title },
    { id: "control", title: d.control.title },
    { id: "never", title: d.never.title },
  ];

  return (
    <div className="py-16 sm:py-20">
      <Container className="grid gap-12 lg:grid-cols-[220px_minmax(0,680px)] lg:justify-center">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label={d.toc}>
            <p className="text-sm font-semibold text-slate-500">{d.toc}</p>
            <ol className="mt-3 space-y-2 border-s border-line-200 ps-4 text-[15px]">
              {parts.map((part) => (
                <li key={part.id}>
                  <a href={`#${part.id}`} className="text-navy-900 hover:text-teal-700">
                    {part.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article>
          <SectionTitle as="h1">{d.title}</SectionTitle>
          <p className={`mt-4 text-lg ${mobileCenter}`}>{d.intro}</p>

          <section id="protect" className="mt-14">
            <h2 className={`font-display text-2xl font-semibold text-navy-900 sm:text-3xl ${mobileCenter}`}>{d.protect.title}</h2>
            <div className="mt-6 divide-y divide-line-200 rounded-2xl border border-line-200 bg-white">
              {d.protect.items.map((item) => (
                <div key={item.area} className="p-6">
                  <h3 className="font-semibold text-navy-900">{item.area}</h3>
                  <p className="mt-1 text-[16px] leading-7">{item.plain}</p>
                  <details className="group mt-3">
                    <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-teal-700">
                      {d.technical}
                      <Icon name="chevronDown" className="size-4 transition-transform group-open:rotate-180" />
                    </summary>
                    {/* Technical details stay in English for now. */}
                    <p lang="en" dir="ltr" className="mt-2 rounded-lg bg-sand-50 p-3 text-start text-sm leading-6">
                      {item.technical}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </section>

          <section id="control" className="mt-14">
            <h2 className={`font-display text-2xl font-semibold text-navy-900 sm:text-3xl ${mobileCenter}`}>{d.control.title}</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {d.control.items.map((item) => (
                <div key={item.control} className="rounded-2xl border border-line-200 bg-white p-5">
                  <dt className="font-semibold text-navy-900">{item.control}</dt>
                  <dd className="mt-1 text-[15px] leading-7">{item.text}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="never" className="mt-14">
            <h2 className={`font-display text-2xl font-semibold text-navy-900 sm:text-3xl ${mobileCenter}`}>{d.never.title}</h2>
            <ul className="mt-6 space-y-3 rounded-2xl bg-sage-200 p-6">
              {d.never.items.map((item) => (
                <li key={item} className="flex gap-3 text-navy-900">
                  <Icon name="x" className="mt-1 size-5 text-teal-700" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-14 text-sm text-slate-500">{d.compliance}</p>
        </article>
      </Container>
    </div>
  );
}
