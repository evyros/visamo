import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localePath } from "@/lib/site";
import { ButtonLink, Container, SectionTitle } from "@/components/ui";

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getDictionary();
  return (
    <section className="py-24">
      <Container narrow className="text-center">
        <SectionTitle as="h1" align="center">404</SectionTitle>
        <ButtonLink href={localePath(locale)} className="mt-8">
          {t.meta.siteName}
        </ButtonLink>
      </Container>
    </section>
  );
}
