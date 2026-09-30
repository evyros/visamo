import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { localePath } from "@/lib/site";
import { Icon } from "../icons";
import { Container, Eyebrow, TextLink, mobileCenter } from "../ui";

/** The gist only; the full story lives on /how-we-built. */
export function HowWeBuilt({ t, locale }: { t: Messages; locale: Locale }) {
  const b = t.home.howBuilt;
  return (
    <section id="how-we-built" className="pb-16 sm:pb-24">
      <Container>
        <div className="grid gap-6 rounded-2xl border border-line-200 bg-white p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-10">
          <div className={mobileCenter}>
            <Eyebrow>{b.eyebrow}</Eyebrow>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-snug text-balance text-navy-900 sm:text-3xl">
              {b.title}
            </h2>
            <p className="mt-3">{b.body}</p>
            <TextLink href={localePath(locale, "/how-we-built")} className="mt-4">
              {b.link}
            </TextLink>
          </div>
          <div className="flex gap-4 rounded-2xl border border-teal-600/25 bg-teal-100/50 p-5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
              <Icon name="sparkle" className="size-5" />
            </span>
            <div>
              <p className="font-semibold text-navy-900">{b.ai.title}</p>
              <p className="mt-1 text-[15px] leading-7">{b.ai.body}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
