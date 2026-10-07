import Link from "next/link";
import type { ReactNode } from "react";
import type { GuideBlock } from "@/content/guides";
import type { Locale } from "@/i18n/config";
import { localePath, newTab } from "@/lib/site";

// The guides' text (content/guides): **bold**, and [links](guide:<slug>) to
// another guide or [links](/path) to a page, both kept in the reader's language,
// or [links](https://…) to another site, opened in a new tab.

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
        return (
          <p key={i} className="rounded-xl border-s-4 border-teal-600 bg-teal-100/60 px-5 py-4">
            <GuideText text={block.note} locale={locale} />
          </p>
        );
      })}
    </div>
  );
}
