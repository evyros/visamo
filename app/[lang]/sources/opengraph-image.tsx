import { loadMessages } from "@/i18n/messages";
import { ogImageSize, ogLocale, renderOgImage } from "@/lib/og-image";

// The sources page's preview when it's shared: its title, over its list's.

export async function generateImageMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const t = await loadMessages(await ogLocale(params));
  return [{ id: "default", alt: t.sources.hero.title, size: ogImageSize, contentType: "image/png" }];
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const t = await loadMessages(await ogLocale(params));
  return renderOgImage(await ogLocale(params), { title: t.sources.hero.title, subtitle: t.sources.list.title });
}
