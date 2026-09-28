import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { caseOptions } from "@/i18n/options";
import { onboardingPaths } from "@/lib/app-paths";
import { getOrClaimCaseId, requireUser } from "@/lib/session";
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
  if (await getOrClaimCaseId(user)) redirect("/");
  const locale = await getAppLocale();
  const t = (await getAppDictionary()).app.onboarding;

  return <OnboardingWizard t={t} {...caseOptions(locale, t)} />;
}
