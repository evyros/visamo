import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localePath } from "@/lib/site";
import { ButtonLink, Container, SectionTitle } from "@/components/ui";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getDictionary();
  return (
    <section className="py-24">
      {/* not-found can't export metadata, so the page title is set here. */}
      <title>{`${t.notFound.title} | ${t.meta.siteName}`}</title>
      <Container narrow className="text-center">
        <SectionTitle as="h1" align="center">{t.notFound.title}</SectionTitle>
        <p className="mt-4 text-lg">{t.notFound.body}</p>
        <ButtonLink href={localePath(locale)} className="mt-8">
          {t.notFound.cta}
        </ButtonLink>
      </Container>
    </section>
  );
}
