import Link from "next/link";
import type { ReactNode } from "react";
import { getGuides, type GuideBlock } from "@/content/guides";
import type { DocTag } from "@/content/guides/types";
import type { Locale } from "@/i18n/config";
import { localePath, newTab, signupUrl } from "@/lib/site";
import { GuideFigure, IconTile } from "./guide-figures";
import { GuideListCard } from "./guide-list-card";
import { GuideProcessCard } from "./guide-process-card";
import { Icon } from "./icons";
import { ButtonLink, TextLink } from "./ui";

// The guides' text (content/guides): **bold**, and [links](guide:<slug>) to
// another guide (guide:<slug>#<section> to a part of it) or [links](/path) to
// a page, both kept in the reader's language, [links](#id) to a part of the
// same page, or [links](https://…) to another site, opened in a new tab.

const linkStyle = "font-semibold text-teal-700 underline underline-offset-4 hover:text-teal-600";

const INLINE = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

export function guideHref(locale: Locale, target: string) {
  return localePath(locale, target.startsWith("guide:") ? `/guide/${target.slice("guide:".length)}` : target);
}

/** Text without its markup, for attributes. */
const plainText = (text: string) => text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export function GuideText({ text, locale }: { text: string; locale: Locale }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    parts.push(text.slice(last, match.index));
    const [, bold, label, target] = match;
    parts.push(
      bold !== undefined ? (
        <strong key={match.index} className="font-semibold text-navy-900">
          {bold}
        </strong>
      ) : /^https?:\/\//.test(target) ? (
        <a key={match.index} href={target} {...newTab} className={linkStyle}>
          {label}
        </a>
      ) : target.startsWith("#") ? (
        <a key={match.index} href={target} className={linkStyle}>
          {label}
        </a>
      ) : (
        <Link key={match.index} href={guideHref(locale, target)} className={linkStyle}>
          {label}
        </Link>
      ),
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

/** A guide's short answer: a paragraph, or numbered lines. */
export function GuideAnswer({ answer, locale }: { answer: string | string[]; locale: Locale }) {
  if (typeof answer === "string") {
    return (
      <p className="mt-2 text-[17px] leading-8">
        <GuideText text={answer} locale={locale} />
      </p>
    );
  }
  return (
    <ol className="mt-3 space-y-3">
      {answer.map((line, i) => (
        <li key={i} className="flex gap-3.5 text-[17px] leading-8">
          <Numeral n={i + 1} className="mt-0.5 size-7 rounded-full bg-navy-900 text-[13px]" />
          <span className="min-w-0">
            <GuideText text={line} locale={locale} />
          </span>
        </li>
      ))}
    </ol>
  );
}

/** A number in a circle, for steps and counted rules. */
export function Numeral({ n, className }: { n: number; className: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center font-sans leading-none font-semibold text-white tabular-nums ${className}`}
    >
      {n}
    </span>
  );
}

/** ✓ for what to do, ✗ for what isn't accepted. */
function VerdictMark({ verdict }: { verdict: "yes" | "no" }) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true" className="pointer-events-none mt-0.5 size-[26px] shrink-0 select-none">
      {verdict === "yes" ? (
        <>
          <circle cx="13" cy="13" r="12" className="fill-teal-100" />
          <path d="m8 13.4 3.4 3.4L18.2 9.6" fill="none" className="stroke-teal-600" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <circle cx="13" cy="13" r="12" className="fill-terracotta-100" />
          <path d="m9.2 9.2 7.6 7.6m0-7.6-7.6 7.6" fill="none" className="stroke-terracotta-600" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/**
 * A section's documents as a list with big bullets, no box: the name, its tags
 * right after it (under it on a phone), and a note under both. The tags' words
 * come from the guides' labels, so a row's tags read the same in every section.
 */
function DocRows({
  docs,
  marker,
  locale,
}: {
  docs: { name: string; tags?: DocTag[]; note?: string }[];
  marker?: "page";
  locale: Locale;
}) {
  const words = getGuides(locale).labels.docTags;
  return (
    <ul className="space-y-4 pt-1">
      {docs.map((doc, j) => {
        const tags = doc.tags ?? [];
        return (
          <li key={j} className="flex gap-3.5">
            {marker === "page" ? (
              <PageMark />
            ) : (
              /* A big bullet, on the name's line: a teal dot in a soft ring. */
              <span aria-hidden="true" className="mt-[6px] grid size-4 shrink-0 place-items-center rounded-full bg-teal-600/15">
                <span className="size-2 rounded-full bg-teal-600" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              {/* The tags follow the name on its line; on a phone they get a line of their own. */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <p className="min-w-0 text-[16.5px] leading-7 font-semibold text-navy-900">
                  <GuideText text={doc.name} locale={locale} />
                </p>
                {tags.length > 0 && (
                  <span className="flex w-full flex-wrap gap-1.5 sm:w-auto">
                    {/* Hidden punctuation, so the row reads as one sentence without its
                        layout (to search engines, AI crawlers and screen readers):
                        "Birth certificate (Apostille required)." */}
                    <span className="sr-only"> (</span>
                    {tags
                      .filter((tag) => tag !== "abroad")
                      .map((tag, k) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[12.5px] leading-5 font-medium text-slate-700 ring-1 ring-line-200 ring-inset"
                        >
                          {k > 0 && <span className="sr-only">, </span>}
                          {words[tag]}
                        </span>
                      ))}
                    {/* The apostille mark: a small seal and a teal tint. */}
                    {tags.includes("abroad") && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2 py-0.5 text-[12.5px] leading-5 font-medium text-teal-700 ring-1 ring-teal-600/25 ring-inset">
                        {tags.length > 1 && <span className="sr-only">, </span>}
                        <SealMark />
                        {words.abroad}
                      </span>
                    )}
                    <span className="sr-only">)</span>
                  </span>
                )}
              </div>
              {doc.note && (
                <p className="text-[15.5px] leading-7 whitespace-pre-line text-slate-500">
                  <span className="sr-only">. </span>
                  <GuideText text={doc.note} locale={locale} />
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** A form's small page, where its row starts: a sheet with a folded corner, lines, and a field to fill. */
function PageMark() {
  return (
    <svg viewBox="0 0 18 22" aria-hidden="true" className="pointer-events-none mt-[3px] h-[22px] w-[18px] shrink-0 select-none">
      <path
        d="M2.5 1h8.8l4.7 4.7V19.5a1.5 1.5 0 0 1-1.5 1.5H2.5A1.5 1.5 0 0 1 1 19.5v-17A1.5 1.5 0 0 1 2.5 1Z"
        className="fill-white stroke-teal-600"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M11.2 1.1v3.4a1.2 1.2 0 0 0 1.2 1.2H16" className="fill-teal-100 stroke-teal-600" strokeWidth="1.3" strokeLinejoin="round" />
      <rect x="4" y="8.2" width="7" height="1.6" rx="0.8" className="fill-navy-900" />
      <rect x="4" y="11.6" width="9.5" height="1.4" rx="0.7" className="fill-slate-300" />
      <rect x="4" y="15" width="9.5" height="3" rx="0.8" className="fill-amber-100 stroke-amber-500" strokeWidth="0.9" />
    </svg>
  );
}

/** The apostille mark's small drawing: a seal on its ribbons. */
function SealMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="pointer-events-none size-3.5 shrink-0 select-none">
      <path d="M5.4 9.6 4.2 14l1.7-.7 1 1.3.7-4.3Z" className="fill-teal-600" />
      <path d="M10.6 9.6 11.8 14l-1.7-.7-1 1.3-.7-4.3Z" className="fill-teal-700" />
      <circle cx="8" cy="6.8" r="4.6" className="fill-amber-500" />
      <path d="m8 4.6.6 1.5 1.6.1-1.2 1 .4 1.6L8 7.9l-1.4.9.4-1.6-1.2-1 1.6-.1Z" className="fill-white" />
    </svg>
  );
}

export function GuideBlocks({ blocks, locale }: { blocks: GuideBlock[]; locale: Locale }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        if (typeof block === "string") {
          return (
            <p key={i}>
              <GuideText text={block} locale={locale} />
            </p>
          );
        }
        // Figures first: some have `steps` of their own.
        if ("figure" in block) {
          return <GuideFigure key={i} figure={block} locale={locale} />;
        }
        if ("signup" in block) {
          return <GuideListCard key={i} texts={block.signup} locale={locale} />;
        }
        if ("heading" in block) {
          return (
            <h3 key={i} className="pt-4 font-display text-xl leading-snug font-semibold text-balance text-navy-900 sm:text-[22px]">
              {block.heading}
            </h3>
          );
        }
        if ("checks" in block) {
          return (
            <div key={i} className="space-y-7 pt-1">
              {block.checks.map((group, j) => (
                <div key={j}>
                  <p className="font-display text-[17px] leading-7 font-semibold text-navy-900">{group.title}</p>
                  <ul className="mt-3 space-y-4">
                    {group.items.map((item, k) => (
                      <li key={k} className="flex gap-3.5">
                        <VerdictMark verdict={group.verdict} />
                        <span className="min-w-0">
                          <GuideText text={item} locale={locale} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        }
        if ("tips" in block && block.rows) {
          return (
            <ul key={i} className="divide-y divide-line-200">
              {block.tips.map((tip, j) => (
                <li key={j} className="flex items-start gap-4 py-4 text-[16px] leading-7 first:pt-1 last:pb-1">
                  <IconTile name={tip.icon} className="size-12" />
                  <span className="min-w-0 pt-2.5">
                    <GuideText text={tip.text} locale={locale} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        if ("docs" in block) {
          return <DocRows key={i} docs={block.docs} marker={block.marker} locale={locale} />;
        }
        if ("tips" in block) {
          return (
            <ul key={i} className="space-y-3">
              {block.tips.map((tip, j) => (
                <li key={j} className="flex items-start gap-4 rounded-2xl border border-line-200 bg-white p-4 text-[16px] leading-7 sm:p-5">
                  <IconTile name={tip.icon} className="size-12" />
                  <span className="min-w-0">
                    <GuideText text={tip.text} locale={locale} />
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        if ("cards" in block) {
          return (
            <ol key={i} className="space-y-6 pt-1">
              {block.cards.map((card, j) => (
                <li key={j} className="flex gap-3.5">
                  <Numeral n={j + 1} className="mt-0.5 size-7 rounded-full bg-teal-600 text-[13px]" />
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-7 font-semibold text-navy-900">{card.title}</p>
                    <p className="mt-1 text-[16px] leading-7">
                      <GuideText text={card.text} locale={locale} />
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          );
        }
        if ("list" in block || "steps" in block) {
          const List = "list" in block ? "ul" : "ol";
          const items = "list" in block ? block.list : block.steps;
          return (
            <List
              key={i}
              className={`space-y-3 ps-6 marker:text-teal-600 ${List === "ul" ? "list-disc" : "list-decimal marker:font-semibold"}`}
            >
              {items.map((item, j) => (
                <li key={j} className="ps-1">
                  <GuideText text={item} locale={locale} />
                </li>
              ))}
            </List>
          );
        }
        if ("table" in block) {
          // A table from sm up. On a phone each row is a card: the row's name on
          // top, then each cell with its column's name, from data-label.
          return (
            <table
              key={i}
              className="w-full border-collapse text-start text-[15px] leading-6 max-sm:block sm:overflow-hidden sm:rounded-xl sm:border sm:border-line-200 sm:bg-white"
            >
              <thead className="bg-sand-50 max-sm:sr-only">
                <tr>
                  {block.table.head.map((cell, j) => (
                    <th key={j} scope="col" className="border-b border-line-200 px-4 py-3 text-start font-semibold text-navy-900">
                      <GuideText text={cell} locale={locale} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="max-sm:block max-sm:space-y-3">
                {block.table.rows.map((row, j) => (
                  <tr
                    key={j}
                    className="border-b border-line-200 last:border-b-0 max-sm:block max-sm:rounded-xl max-sm:border max-sm:last:border-b max-sm:bg-white max-sm:p-4"
                  >
                    {row.map((cell, k) =>
                      k === 0 ? (
                        <th
                          key={k}
                          scope="row"
                          className="px-4 py-3 text-start align-top font-semibold text-navy-900 max-sm:block max-sm:p-0 max-sm:pb-2"
                        >
                          <GuideText text={cell} locale={locale} />
                        </th>
                      ) : (
                        <td
                          key={k}
                          data-label={plainText(block.table.head[k])}
                          className="px-4 py-3 align-top max-sm:grid max-sm:grid-cols-[minmax(5.5rem,38%)_1fr] max-sm:gap-3 max-sm:border-t max-sm:border-line-200 max-sm:px-0 max-sm:py-2 max-sm:before:text-slate-500 max-sm:before:content-[attr(data-label)]"
                        >
                          <span>
                            <GuideText text={cell} locale={locale} />
                          </span>
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        if ("process" in block) {
          return <GuideProcessCard key={i} texts={block.process} locale={locale} />;
        }
        if ("button" in block) {
          return (
            <ButtonLink
              key={i}
              href={block.to === "signup" ? signupUrl(locale) : localePath(locale, block.to)}
              size="sm"
              className="w-full sm:w-auto"
            >
              {block.button}
              <Icon name="arrow" className="size-4" />
            </ButtonLink>
          );
        }
        return (
          <div
            key={i}
            className={`rounded-xl border-s-4 px-5 py-4 ${block.warning ? "border-amber-500 bg-amber-100/70" : "border-teal-600 bg-teal-100/60"}`}
          >
            <p>
              <GuideText text={block.note} locale={locale} />
            </p>
            {block.link && (
              <TextLink href={guideHref(locale, block.link.to)} className="mt-1">
                {block.link.label}
              </TextLink>
            )}
          </div>
        );
      })}
    </div>
  );
}
