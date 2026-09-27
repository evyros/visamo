import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { rich } from "@/i18n/rich";
import { signupUrl } from "@/lib/site";
import { Icon } from "../icons";
import { Badge, ButtonLink, Container, Eyebrow, SectionTitle, mobileCenter } from "../ui";

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
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <SectionTitle as="h1" className="mt-4">
            {hero.title} <span className="block text-teal-600">{hero.titleAccent}</span>
          </SectionTitle>
          <p className="mx-auto mt-6 max-w-[620px] text-lg leading-8 text-slate-700 lg:mx-0">{rich(hero.subtitle)}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            <ButtonLink href={signupUrl(locale)}>{t.common.ctaPrimary}</ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary">
              {hero.secondaryCta}
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-slate-500">{hero.microcopy}</p>
          <ul className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
            <li>
              <Badge icon="lock">{t.badges.encryption}</Badge>
            </li>
            <li>
              <Badge icon="globe">{t.badges.languages}</Badge>
            </li>
            <li>
              <Badge icon="building">{t.badges.independent}</Badge>
            </li>
          </ul>
        </div>
        <CheckMockup mockup={hero.mockup} />
      </Container>
    </section>
  );
}

type Mockup = Messages["home"]["hero"]["mockup"];

export function CheckMockup({ mockup }: { mockup: Mockup }) {
  return (
    <figure aria-label={mockup.label} className="relative mx-auto w-full max-w-[460px]">
      <div className="relative overflow-hidden rounded-2xl border border-line-200 bg-white p-5 shadow-soft sm:p-6">
        {/* Browser-window dots, pinned to the card's top corner. */}
        <span className="absolute end-4 top-3.5 flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-line-200" />
          <span className="size-2.5 rounded-full bg-line-200" />
          <span className="size-2.5 rounded-full bg-line-200" />
        </span>
        <div className="pe-16">
          <p className="font-semibold text-navy-900">{mockup.title}</p>
          <p className="text-xs text-slate-500">{mockup.checking}</p>
        </div>

        {/* Every document uses the same row; only the status changes its color. */}
        <div className="relative mt-5">
          <div aria-hidden="true" className="animate-scan absolute inset-x-0 top-0 z-10 h-0.5 bg-teal-600/70" />
          <ul className="space-y-2.5">
            {mockup.rows.map((row, i) => {
              const ok = row.status === "ok";
              return (
                <li
                  key={row.name}
                  className={`animate-rise flex items-start gap-3 rounded-xl border p-3.5 ${
                    ok ? "border-teal-600/25 bg-teal-100/50" : "border-amber-500/35 bg-amber-100/60"
                  }`}
                  style={{ animationDelay: `${2.2 + i * 0.25}s` }}
                >
                  <StatusBadge ok={ok} />
                  <div className="min-w-0 flex-1 text-sm leading-6">
                    <p className="flex items-center gap-2 font-semibold text-navy-900">
                      <Icon name="file" className="size-4 text-slate-500" />
                      <span className="truncate">{row.name}</span>
                    </p>
                    <p className="text-slate-700">{row.text}</p>
                    {/* The action always sits on its own line. */}
                    {"fix" in row && row.fix && (
                      <p className="flex items-center gap-1 font-semibold text-teal-700">
                        {row.fix}
                        <Icon name="arrow" className="size-3.5" />
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-sm font-medium text-slate-500">{mockup.caption}</figcaption>
    </figure>
  );
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
        ok ? "bg-teal-600" : "bg-amber-500"
      }`}
    >
      {ok ? (
        <Icon name="check" className="size-4" strokeWidth={2.6} />
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.8}
          strokeLinecap="round"
        >
          <path d="M12 6.5v7M12 17.5h.01" />
        </svg>
      )}
    </span>
  );
}
