import { loadMessages } from "@/i18n/messages";
import { ogImageSize, ogLocale, renderOgImage } from "@/lib/og-image";

// The preview shown when a page is shared (Facebook, WhatsApp, chats). Every
// page under [lang] uses it unless its own segment has one.

export async function generateImageMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const t = await loadMessages(await ogLocale(params));
  return [{ id: "default", alt: t.meta.ogImage.alt, size: ogImageSize, contentType: "image/png" }];
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const locale = await ogLocale(params);
  const t = await loadMessages(locale);
  return renderOgImage(locale, { title: t.meta.ogImage.title, subtitle: t.meta.ogImage.subtitle });
}
