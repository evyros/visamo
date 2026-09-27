import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/site";
import { FinalCta } from "@/components/final-cta";
import { Icon, isIconName } from "@/components/icons";
import { Badge, ButtonLink, Container, IconTile, SectionTitle, mobileCenter } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return pageMetadata({
    locale: await getLocale(),
    path: "/security",
    title: t.meta.security.title,
    description: t.meta.security.description,
  });
}

export default async function SecurityPage() {
  const locale = await getLocale();
  const t = await getDictionary();
  const s = t.security;
  const p = (path: string) => localePath(locale, path);

  const policies = [
    { href: p("/legal/privacy"), label: t.footer.trust.privacy },
    { href: p("/legal/terms"), label: t.footer.trust.terms },
    { href: p("/data-privacy"), label: t.footer.trust.dataPrivacy },
    { href: p("/legal/accessibility"), label: t.footer.trust.accessibility },
  ];

  return (
    <>
      <section className="bg-navy-900 py-16 text-center sm:py-24">
        <Container narrow>
          <h1 className="font-display text-4xl font-semibold leading-tight text-balance text-white sm:text-5xl">
            {s.hero.title}
          </h1>
          <p className="mt-5 text-lg text-slate-300">{s.hero.subtitle}</p>
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            <li>
              <Badge tone="dark" icon="lock">
                {t.badges.encryption}
              </Badge>
            </li>
            <li>
              <Badge tone="dark" icon="shield">
                {t.badges.ssl}
              </Badge>
            </li>
            <li>
              <Badge tone="dark" icon="eyeOff">
                {t.badges.noSale}
              </Badge>
            </li>
            <li>
              <Badge tone="dark" icon="building">
                {t.badges.independent}
              </Badge>
            </li>
          </ul>
        </Container>
      </section>

      {/* The only data section on this page; details live on /data-privacy. */}
      <section className="bg-white py-16 sm:py-24">
        <Container>
          <SectionTitle>{s.data.title}</SectionTitle>
          <p className={`mt-3 text-lg ${mobileCenter}`}>{s.data.intro}</p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {s.data.tiles.map((tile) => (
              <li key={tile.title} className="rounded-2xl border border-line-200 p-6">
                {isIconName(tile.icon) && <IconTile name={tile.icon} />}
                <p className="mt-4 font-semibold text-navy-900">{tile.title}</p>
                <p className="mt-1 text-[15px] leading-7">{tile.body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-center gap-5 rounded-2xl border border-teal-600/25 bg-teal-100/50 p-6 text-center sm:flex-row sm:p-8 sm:text-start">
            <IconTile name="shield" />
            <div className="flex-1">
              <p className="text-lg font-semibold text-navy-900">{s.data.linkLead}</p>
              <p className="mt-1 text-[15px] leading-7">{s.data.linkBody}</p>
            </div>
            <ButtonLink href={p("/data-privacy")} className="h-auto min-h-12 w-full shrink-0 py-3 text-center sm:w-auto">
              {s.data.link}
              <Icon name="arrow" className="size-4" />
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="border-t border-line-200 py-12">
        <Container>
          <div>
            <h2 className="text-xl font-semibold text-navy-900">{s.policies.title}</h2>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {policies.map((policy) => (
                <li key={policy.href}>
                  <Link href={policy.href} className="font-medium text-teal-700 underline-offset-4 hover:underline">
                    {policy.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <FinalCta t={t} locale={locale} />
    </>
  );
}
