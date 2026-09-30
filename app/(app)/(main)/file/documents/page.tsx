import type { Metadata } from "next";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { locales } from "@/i18n/config";
import { regionName } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { caseDocuments, caseFiles } from "@/lib/case-documents";
import { caseChecks, checkBalance } from "@/lib/checks/store";
import { checkView } from "@/lib/checks/view";
import { ownerOrder } from "@/lib/documents/progress";
import { documentTitle } from "@/lib/documents/titles";
import { fileView } from "@/lib/files/view";
import { checksRunningLow } from "@/lib/products";
import { requireCase } from "@/lib/session";
import { contactUrl } from "@/lib/site";
import {
  DocumentsBoard,
  type DocumentGroup,
  type DocumentItem,
  type RetiredDocument,
} from "@/components/app/documents-board";

// finishUpload makes a thumbnail, which for a large scanned PDF takes a few seconds.
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.documents };
}

// The case's documents, grouped by whose they are, with every text worked
// out here so the board gets plain strings.
export default async function DocumentsPage() {
  const { caseId } = await requireCase();
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

  const groups: DocumentGroup[] = ownerOrder
    .map((owner) => ({
      owner,
      title: groupTitle[owner],
      items: list
        .filter((d) => d.owner === owner)
        .map((d) => {
          const text = catalog.items[d.id];
          const country = d.country ? regionName(d.country, locale) : "";
          const auth = d.certification?.authentication;
          const exemptUntil = d.certification?.exemptIfIssuedUntil;
          const check = checks.get(d.key);
          // What to prepare, in the order it takes time: certification, translation, copies.
          const requirements: DocumentItem["requirements"] = [];
          if (auth && auth !== "none") {
            const what = t.authentication[auth];
            requirements.push({
              icon: "shield",
              text: exemptUntil ? format(t.requirements.unlessIssuedUntil, { what, year: exemptUntil }) : what,
            });
          }
          if (d.mayNeedTranslation) requirements.push({ icon: "globe", text: t.requirements.translation });
          if (d.copies) requirements.push({ icon: "file", text: format(t.requirements.copies, { count: d.copies }) });
          return {
            key: d.key,
            title: format(text.title, { country }),
            description: format(text.description, { country }),
            requirements,
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
      title: documentTitle(key, catalog.items, locale) ?? files.find((f) => f.documentKey === key)!.name,
    }));

  return (
    <div className="mx-auto w-full max-w-[840px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{messages.app.file.documents}</h1>
      <p className="mt-3 text-slate-700">{t.intro}</p>
      <DocumentsBoard
        t={t}
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
