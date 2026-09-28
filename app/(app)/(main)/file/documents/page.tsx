import type { Metadata } from "next";
import { getAppDictionary } from "@/i18n/app-locale";
import { PageSkeleton } from "@/components/app/page-skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.documents };
}

export default async function DocumentsPage() {
  const t = await getAppDictionary();
  return <PageSkeleton title={t.app.file.documents} />;
}
