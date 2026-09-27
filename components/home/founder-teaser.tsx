import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { localePath } from "@/lib/site";
import { FounderPhoto } from "../founder-photo";
import { Container, TextLink } from "../ui";

export function FounderTeaser({ t, locale }: { t: Messages; locale: Locale }) {
  const f = t.home.founder;
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <figure className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:flex-row sm:text-start">
          <FounderPhoto size="sm" alt={t.about.photoAlt} />
          <div>
            <blockquote className="font-display text-xl leading-snug text-navy-900 sm:text-2xl">{f.quote}</blockquote>
            <figcaption className="mt-3 text-sm text-slate-500">
              {f.name}, {f.role}
            </figcaption>
            <TextLink href={localePath(locale, "/about")} className="mt-4">
              {f.link}
            </TextLink>
          </div>
        </figure>
      </Container>
    </section>
  );
}
