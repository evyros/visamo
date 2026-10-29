import type { Metadata } from "next";
import Link from "next/link";
import { branchesPath, getBranchesTexts, surveyPath } from "@/content/branches";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { branches } from "@/lib/case-options";
import { pageMetadata } from "@/lib/metadata";
import { localePath } from "@/lib/site";
import { BranchSurvey } from "@/components/branch-survey";
import { Icon } from "@/components/icons";
import { Container } from "@/components/ui";

// The branches survey: a couple rates their branch and gives the waits they
// had. Its votes join the branches page's numbers once verified by email
// (lib/branch-reports.ts). Its own page, so its link can be shared.

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const { survey } = getBranchesTexts(locale);
  return pageMetadata({ locale, path: surveyPath, title: survey.metaTitle, description: survey.description });
}

export default async function SurveyPage({ searchParams }: PageProps<"/[lang]/branches/survey">) {
  const params = await searchParams;
  const param = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : null;
  };
  const locale = await getLocale();
  const t = await getDictionary();
  const texts = getBranchesTexts(locale);
  const { survey } = texts;
  const names = t.app.onboarding.branches;
  const options = [...branches]
    .map((code) => ({ code, name: names[code] }))
    .sort((a, b) => a.name.localeCompare(b.name, locales[locale].intlLocale));

  return (
    <article>
      <header className="border-b border-line-200 bg-white py-12 sm:py-14">
        <Container narrow>
          <nav aria-label={texts.labels.branches} className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
            <Link href={localePath(locale, branchesPath)} className="text-teal-700 hover:underline">
              {texts.labels.branches}
            </Link>
            <Icon name="chevron" className="size-3.5 text-slate-300" />
            <span aria-current="page" className="text-slate-500">
              {texts.share.button}
            </span>
          </nav>
          <h1 className="mt-3 font-display text-4xl leading-[1.15] font-semibold text-balance text-navy-900 sm:text-[44px]">
            {survey.title}
          </h1>
          <p className="mt-4 text-lg leading-8">{survey.intro}</p>
          <p className="mt-5 inline-flex items-start gap-2 rounded-xl bg-teal-100/60 px-4 py-3 text-[15px] leading-6 text-navy-900">
            <Icon name="shield" className="mt-0.5 size-5 shrink-0 text-teal-700" />
            {survey.anonymous}
          </p>
        </Container>
      </header>

      <Container narrow className="py-10 sm:py-14">
        <BranchSurvey
          texts={survey}
          lang={locale}
          branches={options}
          // From a branch card (?branch=), or the email's link (?vote=&code=).
          initial={{ branch: options.some((o) => o.code === param("branch")) ? param("branch")! : "", vote: param("vote"), code: param("code") }}
          privacyHref={localePath(locale, "/legal/privacy")}
          backHref={localePath(locale, branchesPath)}
        />
      </Container>
    </article>
  );
}
