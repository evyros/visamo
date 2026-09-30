import { Fragment, type ReactNode } from "react";

// The little Markdown the assistant is asked to write: paragraphs, bullet and
// numbered lists, and **bold**. Anything else shows as plain text. It's
// rendered as React elements, never as HTML, so an answer can't inject markup.

type Block = { kind: "p"; lines: string[] } | { kind: "ul" | "ol"; items: string[] };

const BULLET = /^\s*[-*•]\s+/;
const NUMBER = /^\s*\d+[.)]\s+/;

function blocksOf(text: string): Block[] {
  const blocks: Block[] = [];
  // A blank line ends a paragraph; a list carries on over one to its next item.
  let blank = false;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/^#{1,6}\s+(.*)$/, "**$1**").trimEnd();
    const last = blocks.at(-1);
    const kind = BULLET.test(line) ? "ul" : NUMBER.test(line) ? "ol" : line.trim() ? "p" : null;
    if (!kind) {
      blank = true;
    } else if (kind === "p") {
      if (last?.kind === "p" && !blank) last.lines.push(line);
      else blocks.push({ kind: "p", lines: [line] });
    } else {
      const item = line.replace(kind === "ul" ? BULLET : NUMBER, "");
      if (last?.kind === kind) last.items.push(item);
      else blocks.push({ kind, items: [item] });
    }
    if (kind) blank = false;
  }
  return blocks;
}

function inline(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-navy-900">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {blocksOf(text).map((block, i) => {
        if (block.kind === "p") {
          return (
            <p key={i}>
              {block.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(line)}
                </Fragment>
              ))}
            </p>
          );
        }
        const List = block.kind;
        return (
          <List key={i} className={`space-y-1.5 ps-6 ${List === "ul" ? "list-disc" : "list-decimal"}`}>
            {block.items.map((item, j) => (
              <li key={j}>{inline(item)}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

const RTL_LETTER = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/gu;
const LTR_LETTER = /[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF]/gu;

/**
 * A message's direction, from most of its letters. Not dir="auto", which
 * goes by the first letter: a Hebrew answer that starts with "A/5" or
 * "Visamo" would come out left-to-right.
 */
export function textDirection(text: string): "rtl" | "ltr" {
  const rtl = text.match(RTL_LETTER)?.length ?? 0;
  const ltr = text.match(LTR_LETTER)?.length ?? 0;
  return rtl > ltr ? "rtl" : "ltr";
}
