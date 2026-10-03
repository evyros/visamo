import type { Metadata } from "next";
import Link from "next/link";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { regionName } from "@/i18n/format";
import { caseOptions } from "@/i18n/options";
import { caseDetails } from "@/lib/case-documents";
import { countedEdits } from "@/lib/events";
import { contactUrl, newTab } from "@/lib/site";
import { requireCase } from "@/lib/session";
import { trackOf } from "@/lib/stages";
import { DetailsForm } from "@/components/app/details-form";
import { TextLink } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.details };
}

// Changing the case's answers, a few times (see saveDetails). Who the people
// are stays as it is; the form shows it but doesn't ask it.
export default async function DetailsPage() {
  const { user, caseId } = await requireCase();
  const [{ row, people, details }, edits, messages, locale] = await Promise.all([
    caseDetails(caseId),
    countedEdits(caseId),
    getAppDictionary(),
    getAppLocale(),
  ]);
  const t = messages.app.detailsPage;
  const o = messages.app.onboarding;
  const editsLeft = row.detailEditsAllowed - edits;
  const { israeli, foreign } = details;
  const country = (code: string | null) => (code ? regionName(code, locale) : "");

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link href="/file" className="text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline">
        {t.back}
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{t.title}</h1>
      {editsLeft > 0 ? (
        <>
          <p className="mt-3 text-slate-700">{t.intro}</p>
          <DetailsForm
            t={t}
            q={o}
            initial={details}
            selfIsIsraeli={people.find((p) => p.userId === user.id)?.isIsraeli ?? true}
            sections={{ couple: t.couple, israeli: israeli.name, foreign: foreign.name }}
            locked={{
              israeli: [israeli.name, israeli.israeliStatus ? o.israeliStatuses[israeli.israeliStatus] : ""],
              foreign: [
                foreign.name,
                country(foreign.nationality),
                ...(foreign.birthCountry !== foreign.nationality ? [country(foreign.birthCountry)] : []),
              ],
            }}
            {...caseOptions(locale, o)}
            steps={messages.app.overview.stage.steps}
            started={row.stage !== trackOf(details)[0]}
          />
        </>
      ) : (
        <div className="mt-6 rounded-card border border-line-200 bg-white p-5 sm:p-6">
          <p className="text-slate-700">{t.limit}</p>
          <TextLink href={contactUrl(locale)} {...newTab} className="mt-3">
            {t.contact}
          </TextLink>
        </div>
      )}
    </div>
  );
}
