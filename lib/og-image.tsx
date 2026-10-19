import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit, { type Font } from "@pdf-lib/fontkit";
import { ImageResponse } from "next/og";
import { isLocale, locales, type Locale } from "@/i18n/config";

// The preview shown when a page is shared (Facebook, WhatsApp, chats): the
// logo, a title and a line under it. The site's default (app/[lang]/opengraph-image.tsx)
// and the pages with their own (the process guide) all draw it here.

export const ogImageSize = { width: 1200, height: 630 };
const size = ogImageSize;
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

const wordGap = 0.28; // em

/** Fills lines up to `width`, the way a browser wraps. */
function wrap(widths: number[], gap: number, width: number) {
  const lines: number[][] = [];
  let line: number[] = [];
  let used = 0;
  widths.forEach((w, i) => {
    if (line.length && used + gap + w > width) {
      lines.push(line);
      line = [];
      used = 0;
    }
    used += (line.length ? gap : 0) + w;
    line.push(i);
  });
  if (line.length) lines.push(line);
  return lines;
}

/**
 * The image renderer lays text out left to right only. Hebrew is set word by
 * word, each line a row that runs right to left, so the first words stay on
 * the first line. Neighbouring Latin words stay together in their own order.
 * The renderer's balanced wrapping can't reach these rows, so the lines are
 * balanced here: the narrowest width that needs no extra line.
 */
function RtlText({ text, font, size, maxWidth }: { text: string; font: Font; size: number; maxWidth: number }) {
  const words: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const previous = words.at(-1);
    if (previous && onlyLtr.test(previous) && onlyLtr.test(word)) words[words.length - 1] = `${previous} ${word}`;
    else words.push(word);
  }
  const shown = words.map((word) => (onlyLtr.test(word) ? word : visualWord(word)));
  const widths = shown.map((word) => (font.layout(word).advanceWidth / font.unitsPerEm) * size);
  const gap = wordGap * size;
  const count = wrap(widths, gap, maxWidth).length;
  let low = Math.max(...widths);
  let high = maxWidth;
  while (high - low > 1) {
    const mid = (low + high) / 2;
    if (wrap(widths, gap, mid).length > count) low = mid;
    else high = mid;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      {wrap(widths, gap, high).map((line, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "row-reverse", columnGap: `${wordGap}em` }}>
          {line.map((w) => (
            <span key={w}>{shown[w]}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The locale from a share image's route params. */
export async function ogLocale(params: Promise<{ lang: string }> | { lang: string }): Promise<Locale> {
  const { lang } = await params;
  return isLocale(lang) ? lang : "en";
}

export async function renderOgImage(locale: Locale, { title, subtitle }: { title: string; subtitle: string }) {
  const hebrew = locales[locale].script === "hebrew";
  // The site's pairs: English titles in Fraunces over Inter, Hebrew in Rubik.
  // The Fraunces files are static cuts at the site's softness (SOFT 50).
  const heading = hebrew ? "Rubik" : "Fraunces";
  const body = hebrew ? "Rubik" : "Inter";
  const [regular, semiBold, logo] = await Promise.all([
    readFile(join(fonts, `${body}-Regular.ttf`)),
    readFile(join(fonts, `${heading}-SemiBold.ttf`)),
    readFile(join(fonts, "Fraunces-Medium.ttf")),
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
          fontFamily: body,
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
          <div style={{ fontSize: 40, fontWeight: 500, fontFamily: "Visamo Logo", letterSpacing: -1 }}>Visamo</div>
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
          <div
            style={{ display: "flex", fontFamily: heading, fontSize: 72, fontWeight: 600, lineHeight: 1.1, maxWidth: 1000, textWrap: "balance" }}
          >
            {hebrew ? <RtlText text={title} font={fontkit.create(semiBold)} size={72} maxWidth={1000} /> : title}
          </div>
          <div
            style={{ display: "flex", fontSize: 34, fontWeight: 400, lineHeight: 1.35, color: "#334155", maxWidth: 1040, textWrap: "balance" }}
          >
            {hebrew ? <RtlText text={subtitle} font={fontkit.create(regular)} size={34} maxWidth={1040} /> : subtitle}
          </div>
        </div>
        <div style={{ display: "flex", height: 8, width: 120, borderRadius: 4, background: "#2f7f76" }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: body, data: regular, weight: 400, style: "normal" },
        { name: heading, data: semiBold, weight: 600, style: "normal" },
        { name: "Visamo Logo", data: logo, weight: 500, style: "normal" },
      ],
    },
  );
}
