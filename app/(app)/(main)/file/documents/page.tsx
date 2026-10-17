import type { Metadata } from "next";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { locales } from "@/i18n/config";
import { regionName } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { caseDocuments, caseFiles } from "@/lib/case-documents";
import { stepText } from "@/lib/document-steps";
import { caseChecks, checkBalance } from "@/lib/checks/store";
import { checkView } from "@/lib/checks/view";
import { formUrls, type Owner } from "@/lib/documents/catalog";
import { groupOf, ownerOrder } from "@/lib/documents/progress";
import { documentTitle } from "@/lib/documents/titles";
import { fileView } from "@/lib/files/view";
import { checksRunningLow } from "@/lib/products";
import { requireCase } from "@/lib/session";
import { contactUrl, localePath, site } from "@/lib/site";
import {
  DocumentsBoard,
  type BoardLabels,
  type DocumentGroup,
  type RetiredDocument,
} from "@/components/app/documents-board";

/** The object without these keys. */
function without<T extends object, K extends keyof T>(object: T, keys: readonly K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;
}

// finishUpload makes a thumbnail, which for a large scanned PDF takes a few seconds.
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.documents };
}

// The case's documents, grouped by whose they are, then the ones done once
// the foreign partner is in Israel, with every text worked out here so the
// board gets plain strings.
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
  const groupTitle: Record<Owner, string> = {
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

  const item = (d: (typeof list)[number], whose: boolean) => {
    const text = catalog.items[d.id];
    const country = d.country ? regionName(d.country, locale) : "";
    const check = checks.get(d.key);
    const title = format(text.shortTitle, { country });
    return {
      key: d.key,
      // The short title: the page groups the documents under each partner's name. Outside those
      // groups, with the partner's name for one of theirs.
      title: whose ? (documentTitle(d.key, catalog, locale, { israeli, foreign }) ?? title) : title,
      description: format(text.description, { country }),
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

  // Once the foreign partner is in Israel: after the owners' groups, under where the couple will be.
  const bothAbroad = details.israeli.residence === "abroad";
  const later = list.filter((d) => groupOf(d) === "afterArrival");
  const groups: DocumentGroup[] = [
    ...ownerOrder.map((owner) => ({
      id: owner,
      title: groupTitle[owner],
      items: list.filter((d) => groupOf(d) === owner).map((d) => item(d, false)),
    })),
    {
      id: "afterArrival" as const,
      title: bothAbroad ? t.groups.afterArrivalBoth : format(t.groups.afterArrival, { name: foreign }),
      intro: bothAbroad ? t.groups.afterArrivalBothIntro : format(t.groups.afterArrivalIntro, { name: foreign }),
      items: later.map((d) => item(d, true)),
    },
  ].filter((g) => g.items.length > 0);

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

  // Only what the board shows itself: every step's text is worked out above.
  const boardLabels: BoardLabels = {
    ...without(t, ["steps", "issuers", "affidavitInstead", "oneAffidavit"]),
    steps: { heading: t.steps.heading },
  };

  return (
    <div className="mx-auto w-full max-w-[840px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{messages.app.file.documents}</h1>
      <p className="mt-3 text-slate-700">{t.intro}</p>
      <DocumentsBoard
        t={boardLabels}
        groups={groups}
        retired={retired}
        files={files.map(fileView)}
        locale={locale}
        intlLocale={locales[locale].intlLocale}
        checks={{
          allowed: balance.fileCheck,
          notice: checksRunningLow(balance)
            ? format(t.check.checksLow, { used: balance.used, allowed: balance.granted })
            : null,
          supportUrl: contactUrl(locale),
        }}
      />
    </div>
  );
}
