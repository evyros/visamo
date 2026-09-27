import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { signupUrl } from "@/lib/site";
import { ButtonLink, Container, SectionTitle, Tag, mobileCenter } from "../ui";

export function HowItWorks({ t, locale }: { t: Messages; locale: Locale }) {
  const how = t.home.how;
  return (
    <section id="how-it-works" className="py-16 sm:py-24">
      <Container>
        <SectionTitle className="max-w-3xl">{how.title}</SectionTitle>

        <ol className="mt-12 grid gap-8 lg:grid-cols-3">
          {how.steps.map((step, i) => (
            <li key={step.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-navy-900 font-semibold text-white">
                  {(i + 1).toLocaleString(locale)}
                </span>
                {"tag" in step && step.tag && <Tag>{step.tag}</Tag>}
                {i < how.steps.length - 1 && (
                  <span aria-hidden="true" className="hidden h-px flex-1 border-t-2 border-dotted border-line-200 lg:block" />
                )}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-navy-900">{step.title}</h3>
              <p className="mt-2 text-[16px] leading-7">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className={`mt-12 ${mobileCenter}`}>
          <ButtonLink href={signupUrl(locale)}>{t.common.ctaPrimary}</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
