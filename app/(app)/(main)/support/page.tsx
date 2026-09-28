import type { Metadata } from "next";
import { getAppDictionary } from "@/i18n/app-locale";
import { PageSkeleton } from "@/components/app/page-skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.support };
}

export default async function SupportPage() {
  const t = await getAppDictionary();
  return <PageSkeleton title={t.app.shell.support} />;
}
