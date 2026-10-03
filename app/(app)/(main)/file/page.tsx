import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import type { Locale } from "@/i18n/config";
import { formatDay, formatDaysUntil, regionName } from "@/i18n/format";
import { format, type Messages } from "@/i18n/messages";
import { caseOptions } from "@/i18n/options";
import type { BranchCode, CaseDetails, Stage } from "@/lib/case-options";
import { otherMembers, pendingInvite } from "@/lib/case";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import { INVITE_DISMISSED_COOKIE } from "@/lib/device-flags";
import { caseChecks } from "@/lib/checks/store";
import {
  checkedProgressByOwner,
  checkedProgressOf,
  ownerOrder,
  progressByOwner,
  progressOf,
  standingOf,
  uploadedKeys,
  type CheckedProgress,
} from "@/lib/documents/progress";
import { countedEdits, recentEvents } from "@/lib/events";
import { requireCase } from "@/lib/session";
import {
  ActivityCard,
  DetailsAction,
  DetailsCard,
  ProgressCard,
  type DetailsSection,
} from "@/components/app/overview-cards";
import { standingCounts, type ProgressValue } from "@/components/app/document-progress";
import { InviteBanner } from "@/components/app/invite-banner";
import { StageCard } from "@/components/app/stage-card";
import { activityItem } from "./activity-items";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.file };
}

/** How many events the activity card shows; the rest are on the activity page. */
const ACTIVITY_LIMIT = 2;

// The file at a glance: where the couple is in the process, how far along
// their documents are, the details their list is built from, and what
// either of them did lately.
export default async function FileOverviewPage() {
  const { user, caseId } = await requireCase();
  const [{ row, people, details }, files, events, edits, messages, locale, invite] = await Promise.all([
    caseDetails(caseId),
    caseFiles(caseId),
    // One more than shown, to know whether there are older ones to link to.
    recentEvents(caseId, ACTIVITY_LIMIT + 1),
    countedEdits(caseId),
    getAppDictionary(),
    getAppLocale(),
    askToInvite(caseId, user.id),
  ]);
  const t = messages.app.overview;
  const o = messages.app.onboarding;
  const stage = row.stage as Stage;
  const branch = row.branch as BranchCode | null;

  // Stage.
  const interview =
    row.interviewOn &&
    [
      format(t.stage.interviewOn, { date: formatDay(row.interviewOn, locale) }),
      stage === "interviewScheduled" && formatDaysUntil(row.interviewOn, locale),
    ]
      .filter(Boolean)
      .join(" · ");

  // Documents: counted by upload, or with Full file check, by where each stands, as on the documents page.
  const list = listOf(details);
  const uploaded = uploadedKeys(files);
  const groupTitle = {
    couple: messages.app.documentsPage.groups.couple,
    israeli: format(messages.app.documentsPage.groups.israeli, { name: details.israeli.name }),
    foreign: format(messages.app.documentsPage.groups.foreign, { name: details.foreign.name }),
    children: messages.app.documentsPage.groups.children,
  };
  const documents = row.fileCheck
    ? checkedDocuments(list, uploaded, await caseChecks(caseId), messages, locale)
    : uploadedDocuments(list, uploaded, messages);
  const groups = documents.groups.map(({ owner, ...g }) => ({
    href: `/file/documents#${owner}`,
    title: groupTitle[owner],
    ...g,
  }));

  // The partner the invite banner is about: the other person in the case.
  const partnerName = people.find((p) => p.userId !== user.id)?.name ?? "";

  // Details.
  const editsLeft = Math.max(0, row.detailEditsAllowed - edits);

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{messages.app.file.overview}</h1>

      {invite && (
        <InviteBanner
          title={t.invite.title}
          body={format(t.invite.body, { name: partnerName })}
          action={format(t.invite.action, { name: partnerName })}
          dismiss={t.invite.dismiss}
        />
      )}

      <div className="mt-8 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <StageCard
          t={t.stage}
          stage={stage}
          dates={{ filedOn: row.filedOn, interviewOn: row.interviewOn }}
          shown={{
            filedOn: row.filedOn && format(t.stage.filedOn, { date: formatDay(row.filedOn, locale) }),
            interviewOn: interview || null,
          }}
          branch={branch}
          branchName={branch && o.branches[branch]}
          branches={caseOptions(locale, o).branches}
        />
        <div className="grid grid-cols-1 gap-6">
          <ProgressCard
            title={t.progress.title}
            open={t.progress.open}
            value={documents.value}
            summary={documents.summary}
            counts={documents.counts}
            complete={documents.complete}
            groups={groups}
          />
          <ActivityCard
            title={t.activity.title}
            empty={t.activity.empty}
            items={events.slice(0, ACTIVITY_LIMIT).map((e) => activityItem(e, messages, locale, { israeli: details.israeli.name, foreign: details.foreign.name }))}
            all={events.length > ACTIVITY_LIMIT ? t.activity.all : undefined}
          />
        </div>
        <div className="lg:col-span-2">
          <DetailsCard
            title={t.details.title}
            intro={t.details.intro}
            sections={detailSections(details, messages, locale)}
            action={<DetailsAction canEdit={editsLeft > 0} edit={t.details.edit} noEditsLeft={t.details.noEditsLeft} />}
          />
        </div>
      </div>
    </div>
  );
}

type DocumentList = ReturnType<typeof listOf>;

/** The documents' progress, counting uploads: without Full file check. */
function uploadedDocuments(list: DocumentList, uploaded: ReadonlySet<string>, messages: Messages) {
  const t = messages.app.overview.progress;
  const progress = progressOf(list, uploaded);
  return {
    value: { kind: "uploads", progress } satisfies ProgressValue,
    summary: format(t.summary, progress),
    counts: undefined,
    complete: progress.total > 0 && progress.done === progress.total ? t.allDone : null,
    groups: progressByOwner(list, uploaded, ownerOrder).map((g) => ({
      owner: g.owner,
      summary: format(t.summary, g.progress),
      value: { kind: "uploads", progress: g.progress } satisfies ProgressValue,
    })),
  };
}

/** The documents' progress with Full file check: each document by where it stands, ready only once a check passed it. */
function checkedDocuments(
  list: DocumentList,
  uploaded: ReadonlySet<string>,
  checks: Awaited<ReturnType<typeof caseChecks>>,
  messages: Messages,
  locale: Locale,
) {
  const t = messages.app.overview.progress;
  const standing = new Map(
    list.map((d) => {
      const check = checks.get(d.key);
      const rating = check?.fresh && check.result ? check.result.rating : null;
      return [d.key, standingOf(uploaded.has(d.key), check?.checkable ?? false, rating)] as const;
    }),
  );
  const progress = checkedProgressOf(list, standing);
  const counts = standingCounts(progress, messages.app.documentsPage.progressChecked, locale);
  const readySummary = (p: CheckedProgress) => format(t.readySummary, { done: p.ready, total: p.total });
  return {
    value: { kind: "checks", progress } satisfies ProgressValue,
    summary: counts.map((c) => c.text).join(", "),
    counts,
    complete: progress.total > 0 && progress.ready === progress.total ? t.allReady : null,
    groups: checkedProgressByOwner(list, standing, ownerOrder).map((g) => ({
      owner: g.owner,
      summary: readySummary(g.progress),
      value: { kind: "checks", progress: g.progress } satisfies ProgressValue,
    })),
  };
}

/**
 * Whether to show the invite banner: the partner hasn't joined, no invite is
 * out, and it wasn't dismissed on this device.
 */
async function askToInvite(caseId: string, userId: string) {
  if ((await cookies()).has(INVITE_DISMISSED_COOKIE)) return false;
  const [members, invite] = await Promise.all([otherMembers(caseId, userId), pendingInvite(caseId)]);
  return members.length === 0 && !invite;
}

/** The answers the document list is built from, as short rows. */
function detailSections({ relationship: r, israeli, foreign }: CaseDetails, messages: Messages, locale: Locale) {
  const t = messages.app.overview.details;
  const o = messages.app.onboarding;
  const yesNo = (value: boolean | null) => (value ? t.yes : t.no);
  const country = (code: string) => regionName(code, locale);

  const place =
    r.marriagePlace === "abroad" && r.marriageCountry
      ? country(r.marriageCountry)
      : r.marriagePlace === "israel"
        ? country("IL")
        : r.marriagePlace && o.marriagePlaces[r.marriagePlace];
  const together = r.livingTogether ? format(t.livingSince, { year: r.togetherSince ?? "" }) : t.notLiving;

  const sections: DetailsSection[] = [
    {
      title: t.couple,
      rows: [
        {
          label: t.relationship,
          value: r.relationship === "married" ? `${t.married} · ${place} · ${together}` : `${t.commonLaw} · ${together}`,
        },
        { label: t.childrenTogether, value: yesNo(r.childrenTogether) },
      ],
    },
    {
      title: israeli.name,
      rows: [
        { label: t.status, value: israeli.israeliStatus ? o.israeliStatuses[israeli.israeliStatus] : "" },
        { label: t.previousMarriages, value: o.previousMarriageOptions[israeli.previousMarriages] },
        { label: t.residence, value: israeli.residence ? o.residences[israeli.residence] : "" },
      ],
    },
    {
      title: foreign.name,
      rows: [
        { label: t.nationality, value: foreign.nationality ? country(foreign.nationality) : "" },
        ...(foreign.birthCountry && foreign.birthCountry !== foreign.nationality
          ? [{ label: t.bornIn, value: country(foreign.birthCountry) }]
          : []),
        { label: t.location, value: foreign.location ? o.locations[foreign.location] : "" },
        {
          label: t.countriesLived,
          value: foreign.countriesLived?.length ? foreign.countriesLived.map(country).join(", ") : t.none,
        },
        { label: t.previousMarriages, value: o.previousMarriageOptions[foreign.previousMarriages] },
        { label: t.nameChanged, value: yesNo(foreign.nameChanged) },
        { label: t.childrenMoving, value: yesNo(foreign.childrenMoving) },
      ],
    },
  ];
  return sections;
}
