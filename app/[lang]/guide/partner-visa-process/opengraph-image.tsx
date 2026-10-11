import { getProcessTexts } from "@/content/process";
import { ogImageSize, ogLocale, renderOgImage } from "@/lib/og-image";

// The landing page's preview when it's shared: its title, over the guide's line.

export async function generateImageMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const texts = getProcessTexts(await ogLocale(params));
  return [{ id: "default", alt: texts.landing.metaTitle, size: ogImageSize, contentType: "image/png" }];
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const locale = await ogLocale(params);
  const texts = getProcessTexts(locale);
  return renderOgImage(locale, { title: texts.landing.metaTitle, subtitle: texts.share.subtitle });
}
