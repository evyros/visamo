import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { localePath } from "@/lib/site";
import { Container, Eyebrow, SectionTitle, TextLink, mobileCenter } from "../ui";

/** The gist only; the full story lives on /how-we-built. */
export function HowWeBuilt({ t, locale }: { t: Messages; locale: Locale }) {
  const b = t.home.howBuilt;
  return (
    <section id="how-we-built" className="bg-white py-16 sm:py-24">
      <Container className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className={mobileCenter}>
          <Eyebrow>{b.eyebrow}</Eyebrow>
          <SectionTitle className="mt-3">{b.title}</SectionTitle>
        </div>
        <div className={mobileCenter}>
          <p className="text-lg leading-8">{b.body}</p>
          <TextLink href={localePath(locale, "/how-we-built")} className="mt-4">
            {b.link}
          </TextLink>
        </div>
      </Container>
    </section>
  );
}
