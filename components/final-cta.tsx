import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { signupUrl } from "@/lib/site";
import { ButtonLink, Container } from "./ui";

export function FinalCta({ t, locale }: { t: Messages; locale: Locale }) {
  return (
    <section className="bg-sage-200 py-16 sm:py-20">
      <Container className="text-center">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight text-balance text-navy-900 sm:text-[40px]">
          {t.home.final.title}
        </h2>
        <ButtonLink href={signupUrl(locale)} className="mt-8">
          {t.common.ctaPrimary}
        </ButtonLink>
        <p className="mt-4 text-sm text-navy-900/70">{t.home.final.microcopy}</p>
      </Container>
    </section>
  );
}
