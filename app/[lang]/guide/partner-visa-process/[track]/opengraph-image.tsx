import { notFound } from "next/navigation";
import { answersOf, getProcessTexts } from "@/content/process";
import { ogImageSize, ogLocale, renderOgImage } from "@/lib/og-image";

// Each situation's preview when it's shared: its title, over the guide's line.
// No generateImageMetadata here: under a page with fixed slugs, its id segment
// isn't routed. The page names this image, with its alt, in its own metadata.

export const size = ogImageSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ lang: string; track: string }> }) {
  const { lang, track } = await params;
  const answers = answersOf(track);
  if (!answers) notFound();
  const locale = await ogLocale({ lang });
  const texts = getProcessTexts(locale);
  return renderOgImage(locale, { title: texts.guide.metaTitle(answers), subtitle: texts.share.subtitle });
}
