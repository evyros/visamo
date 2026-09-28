import type { Locale } from "@/i18n/config";
import { formatAgo, formatDay } from "@/i18n/format";
import { format, type Messages } from "@/i18n/messages";
import type { BranchCode, Stage } from "@/lib/case-options";
import { documentTitle } from "@/lib/documents/titles";
import type { CaseEvent, recentEvents } from "@/lib/events";
import type { ActivityItem } from "@/components/app/overview-cards";

// The activity feed's lines, shared by the overview's card and the activity page.

type RecentEvent = Awaited<ReturnType<typeof recentEvents>>[number];

/** One line of the activity card, in the actor's grammatical gender. */
export function activityItem(e: RecentEvent, messages: Messages, locale: Locale): ActivityItem {
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
