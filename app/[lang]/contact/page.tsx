import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { locales } from "@/i18n/config";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";
import { ContactForm } from "@/components/contact-form";
import { Icon } from "@/components/icons";
import { Container, SectionTitle, mobileCenter } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return pageMetadata({
    locale: await getLocale(),
    path: "/contact",
    title: t.meta.contact.title,
    description: t.meta.contact.description,
  });
}

export default async function ContactPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const c = t.contact;

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className={`mx-auto max-w-2xl lg:mx-0 ${mobileCenter}`}>
          <SectionTitle as="h1">{c.title}</SectionTitle>
          <p className="mt-4 text-lg">{c.intro}</p>
        </div>

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-line-200 bg-white p-6 shadow-soft sm:p-10">
            <ContactForm labels={c.form} lang={locale} locale={locales[locale].intlLocale} supportEmail={site.supportEmail} />
            <p className="mt-6 text-xs text-slate-500">{c.form.privacy}</p>
          </div>

          <aside className="rounded-2xl bg-navy-900 p-6 text-slate-300 sm:p-8">
            <h2 className="text-lg font-semibold text-white">{c.side.title}</h2>
            <dl className="mt-6 space-y-6">
              <div>
                <dt className="flex items-center gap-2 text-sm font-semibold text-sage-200">
                  <Icon name="mail" className="size-4" />
                  {c.side.email}
                </dt>
                <dd className="mt-2">
                  <a href={`mailto:${site.supportEmail}`} className="font-medium text-white hover:underline">
                    <bdi>{site.supportEmail}</bdi>
                  </a>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-sm font-semibold text-sage-200">
                  <Icon name="clock" className="size-4" />
                  {c.side.hours}
                </dt>
                <dd className="mt-2 whitespace-pre-line text-white">{t.footer.support.hours}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </Container>
    </section>
  );
}
