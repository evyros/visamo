import Link from "next/link";
import type { ReactNode } from "react";
import type { GuideBlock } from "@/content/guides";
import type { Locale } from "@/i18n/config";
import { localePath, newTab, signupUrl } from "@/lib/site";
import { GuideFigure, IconTile } from "./guide-figures";
import { GuideListCard } from "./guide-list-card";
import { GuideProcessCard } from "./guide-process-card";
import { Icon } from "./icons";
import { ButtonLink } from "./ui";

// The guides' text (content/guides): **bold**, and [links](guide:<slug>) to
// another guide or [links](/path) to a page, both kept in the reader's language,
// [links](#id) to a part of the same page, or [links](https://…) to another
// site, opened in a new tab.

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
          <p key={i} className="rounded-xl border-s-4 border-teal-600 bg-teal-100/60 px-5 py-4">
            <GuideText text={block.note} locale={locale} />
          </p>
        );
      })}
    </div>
  );
}
