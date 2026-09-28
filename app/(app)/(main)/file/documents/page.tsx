import type { Metadata } from "next";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { locales } from "@/i18n/config";
import { regionName } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { caseDocuments, caseFiles } from "@/lib/case-documents";
import type { Owner } from "@/lib/documents/catalog";
import { fileView } from "@/lib/files/view";
import { requireCase } from "@/lib/session";
import { DocumentsBoard, type DocumentGroup } from "@/components/app/documents-board";

// finishUpload makes a thumbnail, which for a large scanned PDF takes a few seconds.
export const maxDuration = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.documents };
}

const groupOrder: Owner[] = ["couple", "israeli", "foreign", "children"];

// The case's documents, grouped by whose they are, with every text worked
// out here so the board gets plain strings.
export default async function DocumentsPage() {
  const { caseId } = await requireCase();
  const [{ people, list }, files, messages, locale] = await Promise.all([
    caseDocuments(caseId),
    caseFiles(caseId),
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

  const groups: DocumentGroup[] = groupOrder
    .map((owner) => ({
      owner,
      title: groupTitle[owner],
      items: list
        .filter((d) => d.owner === owner)
        .map((d) => {
          const text = catalog.items[d.id];
          const country = d.country ? regionName(d.country, locale) : "";
          const auth = d.certification?.authentication;
          return {
            key: d.key,
            title: format(text.title, { country }),
            description: format(text.description, { country }),
            badges: [
              d.copies && format(t.copies, { count: d.copies }),
              auth && auth !== "none" && t.authentication[auth],
              d.certification?.exemptIfIssuedUntil &&
                format(t.exemptUntil, { year: d.certification.exemptIfIssuedUntil }),
            ].filter((b): b is string => !!b),
            because: d.because.length
              ? format(t.because, { reasons: d.because.map((f) => catalog.because[f]).join(" · ") })
              : null,
            mayNeedTranslation: d.mayNeedTranslation,
            needsApostille: auth === "apostille" || auth === "utahApostille" || auth === "dependsOnCountry",
          };
        }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-[840px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <h1 className="font-display text-2xl font-semibold text-navy-900 sm:text-3xl">{messages.app.file.documents}</h1>
      <p className="mt-3 text-slate-700">{t.intro}</p>
      <DocumentsBoard t={t} groups={groups} files={files.map(fileView)} intlLocale={locales[locale].intlLocale} />
    </div>
  );
}
