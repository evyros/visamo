import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { locales } from "@/i18n/config";
import { regionInSentence, regionName } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { caseDocuments, caseFiles } from "@/lib/case-documents";
import { stepText } from "@/lib/document-steps";
import { caseChecks, checkBalance } from "@/lib/checks/store";
import { checkView } from "@/lib/checks/view";
import { formUrls, type Owner } from "@/lib/documents/catalog";
import { groupOf, ownerOrder, typeGroupOf, typeOrder, type Group, type TypeGroup } from "@/lib/documents/progress";
import { documentTitle } from "@/lib/documents/titles";
import { fileView } from "@/lib/files/view";
import { checksRunningLow } from "@/lib/products";
import { requireCase } from "@/lib/session";
import { contactUrl, localePath, site } from "@/lib/site";
import { DOCUMENTS_VIEW_COOKIE } from "@/lib/device-flags";
import { procedures, sourcesPath } from "@/content/sources";
import type { IconName } from "@/components/icons";
import {
  DocumentsBoard,
  type BoardLabels,
  type DocumentGroup,
  type RetiredDocument,
} from "@/components/app/documents-board";

/** Each group's icon, by type or by person. Icons, not colors: color on the page means a document's status. */
const typeIcon: Record<TypeGroup, IconName> = {
  identity: "idCard",
  relationship: "heart",
  civilStatus: "certificate",
  centerOfLife: "home",
  finances: "wallet",
  forms: "form",
  children: "child",
  afterArrival: "plane",
};
const personIcon: Record<Group, IconName> = {
  couple: "people",
  israeli: "user",
  foreign: "user",
  children: "child",
  afterArrival: "plane",
};

/** The object without these keys. */
function without<T extends object, K extends keyof T>(object: T, keys: readonly K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;
}

/** One of the options, each as likely. Once per request: the page is drawn on the server. */
function oneOf<T>(options: readonly T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * When the page started grouping documents by type (midnight in Israel). Users who signed up
 * before it get a one-time note about the new look (components/app/documents-new-look.tsx).
 */
const GROUPED_BY_TYPE_SINCE = new Date("2026-11-22T00:00:00+02:00");

// finishUpload makes a thumbnail, which for a large scanned PDF takes a few seconds.
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.documents };
}

// The case's documents, grouped by type or by whose they are (the couple
// chooses), then the ones done once the foreign partner is in Israel, with
// every text worked out here so the board gets plain strings.
export default async function DocumentsPage() {
  const { caseId, user } = await requireCase();
  const [{ people, details, list }, files, checks, balance, messages, locale] = await Promise.all([
    caseDocuments(caseId),
    caseFiles(caseId),
    caseChecks(caseId),
    checkBalance(caseId),
    getAppDictionary(),
    getAppLocale(),
  ]);
  const t = messages.app.documentsPage;
  const catalog = messages.app.documents;
  const israeli = people.find((p) => p.isIsraeli)?.name ?? "";
  const foreign = people.find((p) => !p.isIsraeli)?.name ?? "";
  const ownerTitle: Record<Owner, string> = {
    couple: t.groups.couple,
    israeli: format(t.groups.israeli, { name: israeli }),
    foreign: format(t.groups.foreign, { name: foreign }),
    children: t.groups.children,
  };

  // The recommendation letters tool, on the website, with the couple's first names and email filled in.
  const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";
  const letterTool = new URL(localePath(locale, "/tools/recommendation-letter"), site.url);
  letterTool.searchParams.set("n1", firstName(israeli));
  letterTool.searchParams.set("n2", firstName(foreign));
  letterTool.searchParams.set("email", user.email);
  letterTool.searchParams.set("from", "app");

  // Whose a partner's document is, on the tab on its card's top edge: their name up to the first
  // space ("Mary-Jane Smith" is "Mary-Jane").
  const partners: Partial<Record<Owner, string>> = { israeli: firstName(israeli), foreign: firstName(foreign) };
  // Which partner, too: their badges are tinted apart.
  const whoseOf = (owner: Owner) => {
    if (owner !== "israeli" && owner !== "foreign") return {};
    const name = partners[owner];
    return name ? { whose: { name, partner: owner } } : {};
  };

  const item = (d: (typeof list)[number]) => {
    const text = catalog.items[d.id];
    const country = d.country ? regionName(d.country, locale) : "";
    const check = checks.get(d.key);
    const title = format(text.shortTitle, { country });
    return {
      key: d.key,
      // The short title, which never says whose it is: the tab on the card does, outside that partner's own group.
      title,
      ...whoseOf(d.owner),
      // Outside the groups (the free findings' list): with the partner's name for one of theirs.
      namedTitle: documentTitle(d.key, catalog, locale, { israeli, foreign }) ?? title,
      // In a sentence: "for the Philippines", where the title says "Philippines".
      description: format(text.description, { country: d.country ? regionInSentence(d.country, locale) : "" }),
      points: d.points.map((point) => catalog.points[point]),
      ...(d.form && { form: { name: t.formNames[d.form], url: formUrls[d.form] } }),
      ...(d.id === "recommendationLetters" && { tool: { label: t.askFriends, url: letterTool.toString() } }),
      // What to do to it, in the order it takes time: certification, sending, translation, signing.
      steps: d.steps.map((step) => ({ kind: step.kind, ...stepText(step, d.id, t, locale, { points: d.points, foreign, israeli }) })),
      // What can replace it, and where else one affidavit for the civil status and the children goes.
      notes: [
        ...(d.affidavitInstead ? [t.affidavitInstead] : []),
        ...(d.oneAffidavit && d.id === "foreignCivilStatus"
          ? [format(t.oneAffidavit.civilStatus, { document: catalog.items.previousChildrenAffidavit.shortTitle })]
          : []),
        ...(d.oneAffidavit && d.id === "previousChildrenAffidavit" ? [t.oneAffidavit.children] : []),
      ],
      optional: d.optional,
      check: {
        checkable: check?.checkable ?? false,
        running: check?.running ?? false,
        last: check ? checkView(check, locale) : null,
      },
    };
  };

  // Once the foreign partner is in Israel: last in either grouping, under where the couple will be.
  const bothAbroad = details.israeli.residence === "abroad";
  const afterArrival = {
    title: bothAbroad ? t.groups.afterArrivalBoth : format(t.groups.afterArrival, { name: foreign }),
    intro: bothAbroad ? t.groups.afterArrivalBothIntro : format(t.groups.afterArrivalIntro, { name: foreign }),
  };
  const keysOf = (inGroup: (d: (typeof list)[number]) => boolean) => list.filter(inGroup).map((d) => d.key);
  const byType: DocumentGroup[] = typeOrder.map((group) => ({
    id: group,
    ...(group === "afterArrival" ? afterArrival : { title: t.types[group] }),
    icon: typeIcon[group],
    keys: keysOf((d) => typeGroupOf(d) === group),
    showWhose: true,
  }));
  const byPerson: DocumentGroup[] = [...ownerOrder, "afterArrival" as const].map((group) => ({
    id: group,
    ...(group === "afterArrival" ? afterArrival : { title: ownerTitle[group] }),
    icon: personIcon[group],
    keys: keysOf((d) => groupOf(d) === group),
    // Under a partner's name, their initial would only repeat it.
    showWhose: group !== "israeli" && group !== "foreign",
  }));
  const shown = (groups: DocumentGroup[]) => groups.filter((g) => g.keys.length > 0);

  // Files whose document left the list when the details changed.
  const listed = new Set(list.map((d) => d.key));
  const retired: RetiredDocument[] = [...new Set(files.map((f) => f.documentKey))]
    .filter((key) => !listed.has(key))
    .map((key) => ({
      key,
      // Outside the groups: the short title with the partner's name.
      title:
        documentTitle(key, catalog, locale, { israeli, foreign }) ?? files.find((f) => f.documentKey === key)!.name,
    }));

  // The grouping chosen on this device, so the list is drawn in it from the start.
  const savedView = (await cookies()).get(DOCUMENTS_VIEW_COOKIE)?.value === "person" ? "person" : "type";

  // Only what the board shows itself: every step's text is worked out above.
  const boardLabels: BoardLabels = {
    ...without(t, ["steps", "issuers", "affidavitInstead", "oneAffidavit", "types", "progressHintDelay", "progressHintSmooth"]),
    // Under the uploads' progress, when no check found anything: one of three lines, a third of the
    // time each, picked here so it doesn't change once the page is in the browser.
    progressHint: oneOf([t.progressHint, t.progressHintDelay, t.progressHintSmooth]),
    steps: { heading: t.steps.heading },
  };

  return (
    <div className="mx-auto w-full max-w-[840px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {/* The board draws the title and intro: the grouping toggle shares the title's row. */}
      <DocumentsBoard
        title={messages.app.file.documents}
        newLook={user.createdAt < GROUPED_BY_TYPE_SINCE}
        savedView={savedView}
        t={boardLabels}
        items={list.map(item)}
        views={{ type: shown(byType), person: shown(byPerson) }}
        retired={retired}
        files={files.map(fileView)}
        locale={locale}
        intlLocale={locales[locale].intlLocale}
        checks={{
          bought: balance.fileCheck,
          left: balance.left,
          notice: checksRunningLow(balance)
            ? format(t.check.checksLow, { used: balance.used, allowed: balance.granted })
            : null,
          supportUrl: contactUrl(locale),
          // With what a check covered: the couple's own procedure.
          procedure: format(t.check.covered.procedure, { number: procedures[details.relationship.relationship] }),
          sourcesUrl: new URL(localePath(locale, sourcesPath), site.url).toString(),
        }}
      />
    </div>
  );
}
