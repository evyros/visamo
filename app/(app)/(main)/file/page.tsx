import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import type { Locale } from "@/i18n/config";
import { formatAgo, formatDay, formatDaysUntil, regionName } from "@/i18n/format";
import { format, type Messages } from "@/i18n/messages";
import { caseOptions } from "@/i18n/options";
import type { BranchCode, CaseDetails, Stage } from "@/lib/case-options";
import { otherMembers, pendingInvite } from "@/lib/case";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import { INVITE_DISMISSED_COOKIE } from "@/lib/device-flags";
import { ownerOrder, progressByOwner, progressOf, uploadedKeys } from "@/lib/documents/progress";
import { documentTitle } from "@/lib/documents/titles";
import { countedEdits, recentEvents, type CaseEvent } from "@/lib/events";
import { requireCase } from "@/lib/session";
import {
  ActivityCard,
  DetailsAction,
  DetailsCard,
  ProgressCard,
  type ActivityItem,
  type DetailsSection,
} from "@/components/app/overview-cards";
import { InviteBanner } from "@/components/app/invite-banner";
import { StageCard } from "@/components/app/stage-card";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.file };
}

/** How many events the activity card shows. */
const ACTIVITY_LIMIT = 12;

// The file at a glance: where the couple is in the process, how far along
// their documents are, the details their list is built from, and what
// either of them did lately.
export default async function FileOverviewPage() {
  const { user, caseId } = await requireCase();
  const [{ row, people, details }, files, events, edits, messages, locale, invite] = await Promise.all([
    caseDetails(caseId),
    caseFiles(caseId),
    recentEvents(caseId, ACTIVITY_LIMIT),
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

  // Documents.
  const list = listOf(details);
  const uploaded = uploadedKeys(files);
  const progress = progressOf(list, uploaded);
  const summary = (p: typeof progress) => format(t.progress.summary, p);
  const groupTitle = {
    couple: messages.app.documentsPage.groups.couple,
    israeli: format(messages.app.documentsPage.groups.israeli, { name: details.israeli.name }),
    foreign: format(messages.app.documentsPage.groups.foreign, { name: details.foreign.name }),
    children: messages.app.documentsPage.groups.children,
  };
  const groups = progressByOwner(list, uploaded, ownerOrder).map((g) => ({
    href: `/file/documents#${g.owner}`,
    title: groupTitle[g.owner],
    summary: summary(g.progress),
    progress: g.progress,
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
            summary={summary(progress)}
            allDone={t.progress.allDone}
            open={t.progress.open}
            progress={progress}
            groups={groups}
          />
          <ActivityCard
            title={t.activity.title}
            empty={t.activity.empty}
            items={events.map((e) => activityItem(e, messages, locale))}
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
          value: r.relationship === "married" ? `${t.married} · ${place}` : `${t.commonLaw} · ${together}`,
        },
        { label: t.childrenTogether, value: yesNo(r.childrenTogether) },
      ],
    },
    {
      title: israeli.name,
      rows: [
        { label: t.status, value: israeli.israeliStatus ? o.israeliStatuses[israeli.israeliStatus] : "" },
        { label: t.previousMarriages, value: o.previousMarriageOptions[israeli.previousMarriages] },
        { label: t.livedAbroad, value: yesNo(israeli.livedAbroad) },
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

type RecentEvent = Awaited<ReturnType<typeof recentEvents>>[number];

/** One line of the activity card, in the actor's grammatical gender. */
function activityItem(e: RecentEvent, messages: Messages, locale: Locale): ActivityItem {
  const t = messages.app.overview.activity;
  const name = e.actorName ?? t.someone;
  const say = (type: keyof typeof t.events, values: Record<string, string | number> = {}) =>
    format(t.events[type][e.actorGender === "female" ? "female" : "male"], { name, ...values });
  const document = (key: string) => documentTitle(key, messages.app.documents.items, locale) ?? t.aDocument;

  const line = (event: CaseEvent): { text: string; detail?: string } => {
    switch (event.type) {
      case "file.uploaded": {
        const title = document(event.data.documentKey);
        return {
          text: say(event.type, {
            document: event.data.slot === "translation" ? format(t.translationOf, { document: title }) : title,
          }),
        };
      }
      case "file.deleted":
        return { text: say(event.type, { document: document(event.data.documentKey) }) };
      case "partner.invited":
      case "invite.resent":
      case "invite.cancelled":
        return { text: say(event.type, { email: event.data.email }) };
      case "details.changed":
        return {
          text: say(event.type),
          detail: event.data.counted
            ? format(t.listChanged, { added: event.data.added.length, removed: event.data.removed.length })
            : undefined,
        };
      case "stage.changed": {
        const { from, to, date } = event.data;
        if (from === to && to === "interviewScheduled" && date) {
          return { text: say("interview.moved", { date: formatDay(date, locale) }) };
        }
        const steps = messages.app.overview.stage.steps;
        return { text: say(event.type, { stage: steps[to as Stage] ?? to }) };
      }
      case "branch.changed": {
        const to = event.data.to as BranchCode | null;
        return {
          text: say(event.type, {
            branch: to ? messages.app.onboarding.branches[to] : messages.app.overview.stage.branchUnknown,
          }),
        };
      }
      default:
        return { text: say(event.type) };
    }
  };

  const { text, detail } = line(e.event);
  return { id: e.id, text, detail: detail ?? null, when: formatAgo(e.createdAt, locale), date: e.createdAt.toISOString() };
}
