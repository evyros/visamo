import type { Metadata } from "next";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { locales } from "@/i18n/config";
import { regionName } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { caseDocuments, caseFiles } from "@/lib/case-documents";
import { stepText } from "@/lib/document-steps";
import { caseChecks, checkBalance } from "@/lib/checks/store";
import { checkView } from "@/lib/checks/view";
import { formUrls } from "@/lib/documents/catalog";
import { ownerOrder } from "@/lib/documents/progress";
import { partOf, type StepPart } from "@/lib/documents/steps";
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

const stepParts: readonly StepPart[] = ["document", "children"];

/** The object without these keys. */
function without<T extends object, K extends keyof T>(object: T, keys: readonly K[]): Omit<T, K> {
  return Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key as K))) as Omit<T, K>;
}

// finishUpload makes a thumbnail, which for a large scanned PDF takes a few seconds.
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.documents };
}

// The case's documents, grouped by whose they are, with every text worked
// out here so the board gets plain strings.
export default async function DocumentsPage() {
  const { caseId, user } = await requireCase();
  const [{ people, list }, files, checks, balance, messages, locale] = await Promise.all([
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
  const groupTitle: Record<DocumentGroup["owner"], string> = {
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

  const groups: DocumentGroup[] = ownerOrder
    .map((owner) => ({
      owner,
      title: groupTitle[owner],
      items: list
        .filter((d) => d.owner === owner)
        .map((d) => {
          const text = catalog.items[d.id];
          const country = d.country ? regionName(d.country, locale) : "";
          const check = checks.get(d.key);
          return {
            key: d.key,
            // The short title: the page groups the documents under each partner's name.
            title: format(text.shortTitle, { country }),
            description: format(text.description, { country }),
            points: d.points.map((point) => catalog.points[point]),
            ...(d.form && { form: { name: t.formNames[d.form], url: formUrls[d.form] } }),
            ...(d.id === "recommendationLetters" && { tool: { label: t.askFriends, url: letterTool.toString() } }),
            // What to do to it, in the order it takes time: certification, sending, translation, signing.
            // By part, when it has more than one (the civil status, and the children's affidavit), each
            // with its heading; what can replace the document goes under the document's steps.
            stepGroups: stepParts.flatMap((part) => {
              const steps = d.steps.filter((step) => partOf(step) === part);
              if (!steps.length) return [];
              const titled = d.steps.some((step) => partOf(step) !== part);
              return [
                {
                  ...(titled && { title: t.steps.parts[part] }),
                  steps: steps.map((step) => ({ kind: step.kind, ...stepText(step, d.id, t, locale) })),
                  ...(part === "document" && d.affidavitInstead && { note: t.affidavitInstead }),
                },
              ];
            }),
            optional: d.optional,
            check: {
              checkable: check?.checkable ?? false,
              running: check?.running ?? false,
              last: check ? checkView(check, locale) : null,
            },
          };
        }),
    }))
    .filter((g) => g.items.length > 0);

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
    ...without(t, ["steps", "issuers", "affidavitInstead"]),
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
