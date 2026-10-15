import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { findLetterRequest } from "@/lib/letters/requests";
import { maskEmail } from "@/lib/letters/rules";
import { LetterWriter } from "@/components/letters/letter-writer";
import { Container } from "@/components/ui";

// Where a couple's friend writes their recommendation letter: the link from
// the tool (app/[lang]/tools/recommendation-letter). Private to whoever has
// the link, so it's kept out of search. FullStory doesn't record it
// (components/fullstory.tsx): the page shows the letter and the ID card.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.meta.letterPage.title,
    description: t.meta.letterPage.description,
    robots: { index: false, follow: false },
  };
}

export default async function LetterPage({ params }: PageProps<"/[lang]/letter/[token]">) {
  const { token } = await params;
  const request = await findLetterRequest(token);
  if (!request) notFound();
  const locale = await getLocale();
  const t = await getDictionary();

  return (
    <section className="py-10 sm:py-16">
      <Container>
        <LetterWriter
          id={request.id}
          names={[request.names[0], request.names[1]]}
          email={request.email && maskEmail(request.email)}
          labels={t.letters.writer}
          lang={locale}
        />
      </Container>
    </section>
  );
}
