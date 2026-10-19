import type { Locale } from "@/i18n/config";
import { format, type Messages } from "@/i18n/dictionaries";
import { signupUrl } from "@/lib/site";
import { ButtonLink, Container, SectionTitle, mobileCenter } from "../ui";
import { DocumentDeck } from "./document-deck";

export function Hero({ t, locale }: { t: Messages; locale: Locale }) {
  const hero = t.home.hero;
  return (
    <section id="hero" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 end-[-10%] size-[640px] rounded-full bg-teal-600/10 blur-3xl"
      />
      {/* Texture over the gradient: a faint dot grid fading from the glow, and fine film grain. */}
      <div aria-hidden="true" className="texture-dots pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="texture-grain pointer-events-none absolute inset-0" />
      <Container className="relative grid items-center gap-12 py-16 lg:grid-cols-[1.2fr_1fr] lg:py-24">
        <div className={mobileCenter}>
          <SectionTitle as="h1">
            {hero.title} <span className="block text-teal-600">{hero.titleAccent}</span>
          </SectionTitle>
          <p className="mx-auto mt-6 max-w-[540px] text-lg leading-8 text-pretty text-slate-700 lg:mx-0">{hero.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <ButtonLink href={signupUrl(locale)}>{t.common.ctaPrimary}</ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary">
              {hero.secondaryCta}
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-slate-500">{hero.microcopy}</p>
        </div>
        <ExampleDocumentDeck visual={hero.visual} />
      </Container>
    </section>
  );
}

// An example file's progress, about the size of a real couple's list.
const documentsReady = 15;
const documentsTotal = 21;

/** The deck of an example couple's documents: here, and in the process guide's call to action. */
export function ExampleDocumentDeck({ visual }: { visual: Messages["home"]["hero"]["visual"] }) {
  return (
    <DocumentDeck
      visual={visual}
      progress={format(visual.progress, { ready: documentsReady, total: documentsTotal })}
      ratio={documentsReady / documentsTotal}
    />
  );
}
