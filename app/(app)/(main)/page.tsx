import type { Metadata } from "next";
import { getAppDictionary } from "@/i18n/app-locale";
import { format } from "@/i18n/messages";
import { rich } from "@/i18n/rich";
import { requireUser } from "@/lib/session";
import { Container } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.home };
}

// Placeholder home until the workspace exists.
export default async function AppHome() {
  const user = await requireUser();
  const t = (await getAppDictionary()).app.home;
  return (
    <Container className="py-16">
      <h1 className="font-display text-3xl font-semibold text-navy-900 sm:text-4xl">{t.title}</h1>
      <p className="mt-4">{rich(format(t.body, { email: user.email }))}</p>
    </Container>
  );
}
