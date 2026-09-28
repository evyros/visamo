import type { Metadata } from "next";
import { getAppDictionary } from "@/i18n/app-locale";
import { PageSkeleton } from "@/components/app/page-skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.chat };
}

export default async function ChatPage() {
  const t = await getAppDictionary();
  return <PageSkeleton title={t.app.shell.chat} />;
}
