import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages";

// The preview shown when a page is shared (Facebook, WhatsApp, chats). Every
// page under [lang] uses it unless its own segment has one.

const size = { width: 1200, height: 630 };
const fonts = join(process.cwd(), "assets/fonts");

const ltrRun = /[A-Za-z0-9]+/g;
const onlyLtr = /^[A-Za-z0-9.,:;!?'"&-]+$/;
const mirrored: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[" };

/** A word in display order: its letters and marks reversed, runs of Latin letters and digits kept as they are. */
function visualWord(word: string) {
  const parts: string[] = [];
  let last = 0;
  for (const match of word.matchAll(ltrRun)) {
    parts.push(...word.slice(last, match.index), match[0]);
    last = match.index + match[0].length;
  }
  parts.push(...word.slice(last));
  return parts.reverse().map((part) => mirrored[part] ?? part).join("");
}

/**
 * The image renderer lays text out left to right only. Hebrew is set word by
 * word in a row that runs right to left and wraps, so the first words stay on
 * the first line. Neighbouring Latin words stay together in their own order.
 */
function RtlText({ text }: { text: string }) {
  const words: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const previous = words.at(-1);
    if (previous && onlyLtr.test(previous) && onlyLtr.test(word)) words[words.length - 1] = `${previous} ${word}`;
    else words.push(word);
  }
  return (
    <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", columnGap: "0.28em" }}>
      {words.map((word, i) => (
        <span key={i}>{onlyLtr.test(word) ? word : visualWord(word)}</span>
      ))}
    </div>
  );
}

async function localeFrom(params: Promise<{ lang: string }> | { lang: string }): Promise<Locale> {
  const { lang } = await params;
  return isLocale(lang) ? lang : "en";
}

export async function generateImageMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const t = await loadMessages(await localeFrom(params));
  return [{ id: "default", alt: t.meta.ogImage.alt, size, contentType: "image/png" }];
}

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const locale = await localeFrom(params);
  const t = await loadMessages(locale);
  const hebrew = locales[locale].script === "hebrew";
  const family = hebrew ? "Rubik" : "Inter";
  const [regular, semiBold] = await Promise.all([
    readFile(join(fonts, `${family}-Regular.ttf`)),
    readFile(join(fonts, `${family}-SemiBold.ttf`)),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: hebrew ? "flex-end" : "flex-start",
          padding: "72px 80px",
          background: "#f8f6f1",
          fontFamily: family,
          color: "#0f2a44",
        }}
      >
        <div style={{ display: "flex", flexDirection: hebrew ? "row-reverse" : "row", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#2f7f76" />
            <path
              d="M9 10.5 16 22l7-11.5"
              fill="none"
              stroke="#fff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 600, fontFamily: "Inter" }}>Visamo</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            alignItems: hebrew ? "flex-end" : "flex-start",
            textAlign: hebrew ? "right" : "left",
          }}
        >
          <div style={{ display: "flex", fontSize: 72, fontWeight: 600, lineHeight: 1.1, maxWidth: 1000 }}>
            {hebrew ? <RtlText text={t.meta.ogImage.title} /> : t.meta.ogImage.title}
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 400, lineHeight: 1.35, color: "#334155", maxWidth: 1040 }}>
            {hebrew ? <RtlText text={t.meta.ogImage.subtitle} /> : t.meta.ogImage.subtitle}
          </div>
        </div>
        <div style={{ display: "flex", height: 8, width: 120, borderRadius: 4, background: "#2f7f76" }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: family, data: regular, weight: 400, style: "normal" },
        { name: family, data: semiBold, weight: 600, style: "normal" },
        ...(hebrew
          ? [{ name: "Inter", data: await readFile(join(fonts, "Inter-SemiBold.ttf")), weight: 600 as const, style: "normal" as const }]
          : []),
      ],
    },
  );
}
