import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { locales } from "@/i18n/config";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { regionName } from "@/i18n/format";
import { onboardingPaths } from "@/lib/app-paths";
import { branches, nationalities } from "@/lib/case-options";
import { getCaseId, requireUser } from "@/lib/session";
import { OnboardingWizard } from "@/components/app/onboarding-wizard";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.onboarding };
}

// A signed-in user without a case lands here from every app page. Finishing
// creates the case; a user who already has one (a partner who joined by
// invite, or a finished onboarding) goes straight into the app. One page for
// every step's URL: the wizard reads the step from the URL itself.
export default async function OnboardingPage({ params }: { params: Promise<{ step?: string[] }> }) {
  const { step } = await params;
  if (!onboardingPaths.includes(["/onboarding", ...(step ?? [])].join("/"))) notFound();
  const user = await requireUser();
  if (await getCaseId(user.id)) redirect("/");
  const locale = await getAppLocale();
  const t = (await getAppDictionary()).app.onboarding;

  const { compare } = new Intl.Collator(locales[locale].intlLocale);
  const byLabel = (a: { label: string }, b: { label: string }) => compare(a.label, b.label);
  const countryOptions = nationalities.map((code) => ({ value: code, label: regionName(code, locale) })).sort(byLabel);
  const branchOptions = branches.map((code) => ({ value: code, label: t.branches[code] })).sort(byLabel);

  return (
    <OnboardingWizard t={t} countries={countryOptions} branches={branchOptions} />
  );
}
