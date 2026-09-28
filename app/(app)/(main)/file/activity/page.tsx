import type { Metadata } from "next";
import Link from "next/link";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { recentEvents } from "@/lib/events";
import { requireCase } from "@/lib/session";
import { ActivityList } from "@/components/app/overview-cards";
import { activityItem } from "../activity-items";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.activity };
}

/** How far back the activity page goes. */
const ACTIVITY_LIMIT = 100;

// Everything either partner did lately, past the few the overview shows.
export default async function ActivityPage() {
  const { caseId } = await requireCase();
  const [events, messages, locale] = await Promise.all([
    recentEvents(caseId, ACTIVITY_LIMIT),
    getAppDictionary(),
    getAppLocale(),
  ]);
  const t = messages.app.overview.activity;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link href="/file" className="text-[15px] font-semibold text-teal-700 underline-offset-4 hover:underline">
        {t.back}
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{t.title}</h1>
      <p className="mt-3 text-slate-700">{t.pageIntro}</p>
      <div className="mt-6 rounded-card border border-line-200 bg-white p-5 sm:p-6">
        {events.length === 0 ? (
          <p className="text-[15px] text-slate-600">{t.empty}</p>
        ) : (
          <ActivityList items={events.map((e) => activityItem(e, messages, locale))} />
        )}
      </div>
    </div>
  );
}
