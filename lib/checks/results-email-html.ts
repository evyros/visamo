import type { CheckRating } from "./result";

// The couple's check results email (lib/checks/results-email.ts), as HTML and
// text. Pure: it gets every string ready, in the couple's language.
//
// Built for email clients, not browsers: tables for layout, every style
// inline (Gmail drops <style> and the <html>/<body> attributes), the
// direction on each block, and a button made of a table cell so Outlook
// draws it. Colors are the app's (app/globals.css), so a result looks the
// way it does on the documents page.

/** One document in the email, as the couple sees its result. */
export type EmailDocument = {
  title: string;
  rating: CheckRating;
  /** Shown in full: its findings' titles. Locked: only how many (the text never leaves the server). */
  locked: boolean;
  /** The titles of what to fix and of the tips: empty when locked. */
  issues: string[];
  tips: string[];
  /** "2 to fix, 1 tip", or empty. */
  counts: string;
};

export type ResultsEmailCopy = {
  subject: string;
  heading: string;
  preheader: string;
  intro: string;
  ratings: Record<CheckRating, string>;
  /** "and {count} more", for each list cut short. */
  more: (count: number) => string;
  nothingToFix: string;
  /** "2 other uploaded documents are unchecked.", under the results; empty to leave it out. */
  unchecked: string;
  unreadable: string;
  locked: string;
  unlock: string;
  button: string;
  disclaimer: string;
  ignore: string;
};

/** The worst result decides the subject and the heading. */
export const severity: Record<CheckRating, number> = { needsFixing: 3, unreadable: 2, canImprove: 1, looksGood: 0 };

export function worstRating(documents: { rating: CheckRating }[]): CheckRating {
  return documents.reduce<CheckRating>((worst, d) => (severity[d.rating] > severity[worst] ? d.rating : worst), "looksGood");
}

const color = {
  navy: "#0f2a44",
  text: "#334155",
  muted: "#5b6b80",
  line: "#e2e0da",
  sand: "#f8f6f1",
  teal: "#2f7f76",
  tealDark: "#25665f",
  tealLight: "#e3f0ed",
  crimson: "#b42c3f",
  crimsonLight: "#f8e4e7",
  blue: "#4a7bab",
  blueLight: "#eaf1f8",
  slateLight: "#eef1f5",
};

/** Each rating's pill, as the app colors it. */
const ratingStyle: Record<CheckRating, { fg: string; bg: string }> = {
  looksGood: { fg: color.tealDark, bg: color.tealLight },
  canImprove: { fg: color.blue, bg: color.blueLight },
  needsFixing: { fg: color.crimson, bg: color.crimsonLight },
  unreadable: { fg: color.muted, bg: color.slateLight },
};

/** How many of each list are named; the rest are "and N more". */
const SHOWN = 4;

const FONT = "Arial,Helvetica,sans-serif";

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderResultsEmail({
  dir,
  lang,
  copy,
  documents,
  resultsUrl,
  buyUrl,
  siteUrl,
}: {
  dir: "ltr" | "rtl";
  lang: string;
  copy: ResultsEmailCopy;
  documents: EmailDocument[];
  resultsUrl: string;
  buyUrl: string;
  siteUrl: string;
}) {
  const start = dir === "rtl" ? "right" : "left";

  /** A finding's title in its kind's box: red for what to fix, blue for a tip. */
  const finding = (title: string, kind: "issue" | "tip") => {
    const tone = kind === "issue" ? { edge: color.crimson, bg: color.crimsonLight } : { edge: color.blue, bg: color.blueLight };
    return `
              <tr><td style="padding:0 0 6px">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate">
                  <tr><td dir="${dir}" style="background:${tone.bg};border-${start}:4px solid ${tone.edge};border-radius:8px;padding:10px 14px;font-family:${FONT};font-size:15px;line-height:1.45;font-weight:bold;color:${color.navy};text-align:${start}">${escape(title)}</td></tr>
                </table>
              </td></tr>`;
  };
  const list = (titles: string[], kind: "issue" | "tip") =>
    titles.slice(0, SHOWN).map((t) => finding(t, kind)).join("") +
    (titles.length > SHOWN
      ? `
              <tr><td dir="${dir}" style="padding:0 0 6px;font-family:${FONT};font-size:14px;color:${color.muted};text-align:${start}">${escape(copy.more(titles.length - SHOWN))}</td></tr>`
      : "");

  /** What a document's card says under its title. */
  const body = (d: EmailDocument) => {
    if (d.rating === "unreadable") return note(copy.unreadable, color.slateLight, color.text);
    if (d.locked) {
      return `
              <tr><td style="padding:4px 0 0">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate">
                  <tr><td dir="${dir}" style="background:${color.sand};border:1px dashed ${color.line};border-radius:8px;padding:12px 14px;font-family:${FONT};font-size:15px;line-height:1.5;color:${color.navy};text-align:${start}">
                    &#128274;&nbsp; ${escape(copy.locked)}<br>
                    <a href="${escape(buyUrl)}" style="color:${color.teal};font-weight:bold;text-decoration:none">${escape(copy.unlock)} ${dir === "rtl" ? "&larr;" : "&rarr;"}</a>
                  </td></tr>
                </table>
              </td></tr>`;
    }
    if (!d.issues.length && !d.tips.length) return note(copy.nothingToFix, color.tealLight, color.tealDark);
    return list(d.issues, "issue") + list(d.tips, "tip");
  };
  const note = (text: string, bg: string, fg: string) => `
              <tr><td style="padding:4px 0 0">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate">
                  <tr><td dir="${dir}" style="background:${bg};border-radius:8px;padding:10px 14px;font-family:${FONT};font-size:15px;line-height:1.5;color:${fg};text-align:${start}">${escape(text)}</td></tr>
                </table>
              </td></tr>`;

  const card = (d: EmailDocument) => {
    const pill = ratingStyle[d.rating];
    return `
        <tr><td style="padding:0 0 14px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1px solid ${color.line};border-radius:12px">
            <tr><td style="padding:18px 18px 12px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td dir="${dir}" style="font-family:${FONT};font-size:17px;line-height:1.35;font-weight:bold;color:${color.navy};text-align:${start};padding:0 0 4px">${escape(d.title)}</td>
                </tr>
                <tr>
                  <td dir="${dir}" style="font-family:${FONT};font-size:14px;line-height:1.4;color:${color.muted};text-align:${start};padding:0 0 12px">
                    <span style="display:inline-block;background:${pill.bg};color:${pill.fg};font-weight:bold;font-size:13px;border-radius:999px;padding:3px 10px">${escape(copy.ratings[d.rating])}</span>${d.counts ? `&nbsp; ${escape(d.counts)}` : ""}
                  </td>
                </tr>${body(d)}
              </table>
            </td></tr>
          </table>
        </td></tr>`;
  };

  const html = `<!doctype html>
<html lang="${lang}" dir="${dir}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light only">
    <title>${escape(copy.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${color.sand}">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escape(copy.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${color.sand}">
      <tr><td align="center" style="padding:24px 12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border-collapse:separate">
          <tr><td dir="${dir}" style="padding:28px 28px 0;font-family:${FONT};font-size:22px;font-weight:bold;color:${color.navy};text-align:${start}">Visamo</td></tr>
          <tr><td dir="${dir}" style="padding:20px 28px 0;font-family:${FONT};font-size:24px;line-height:1.3;font-weight:bold;color:${color.navy};text-align:${start}">${escape(copy.heading)}</td></tr>
          <tr><td dir="${dir}" style="padding:10px 28px 22px;font-family:${FONT};font-size:16px;line-height:1.6;color:${color.text};text-align:${start}">${escape(copy.intro)}</td></tr>
          <tr><td style="padding:0 28px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${documents.map(card).join("")}
            </table>
          </td></tr>${
            copy.unchecked
              ? `
          <tr><td dir="${dir}" style="padding:0 28px 14px;font-family:${FONT};font-size:15px;line-height:1.5;color:${color.text};text-align:${start}">${escape(copy.unchecked)}</td></tr>`
              : ""
          }
          <tr><td style="padding:10px 28px 8px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate">
              <tr><td align="center" bgcolor="${color.teal}" style="border-radius:12px;background:${color.teal}">
                <a href="${escape(resultsUrl)}" style="display:block;padding:17px 24px;font-family:${FONT};font-size:18px;font-weight:bold;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:12px">${escape(copy.button)}</a>
              </td></tr>
            </table>
          </td></tr>
          <tr><td dir="${dir}" style="padding:22px 28px 0;font-family:${FONT};font-size:13px;line-height:1.5;color:${color.muted};text-align:${start};border-top:0">${escape(copy.disclaimer)}</td></tr>
          <tr><td dir="${dir}" style="padding:6px 28px 28px;font-family:${FONT};font-size:13px;line-height:1.5;color:${color.muted};text-align:${start}">${escape(copy.ignore)}</td></tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
          <tr><td align="center" style="padding:16px 12px 0;font-family:${FONT};font-size:13px"><a href="${escape(siteUrl)}" dir="ltr" style="color:${color.muted};text-decoration:none">${escape(siteUrl.replace(/^https?:\/\//, ""))}</a></td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    copy.heading,
    copy.intro,
    ...documents.map((d) =>
      [
        `${d.title}: ${copy.ratings[d.rating]}${d.counts ? ` · ${d.counts}` : ""}`,
        ...(d.rating === "unreadable"
          ? [copy.unreadable]
          : d.locked
            ? [`${copy.locked} ${buyUrl}`]
            : [...d.issues.map((t) => `- ${t}`), ...d.tips.map((t) => `- ${t}`)]),
      ].join("\n"),
    ),
    ...(copy.unchecked ? [copy.unchecked] : []),
    `${copy.button}: ${resultsUrl}`,
    copy.disclaimer,
    copy.ignore,
  ].join("\n\n");

  return { subject: copy.subject, html, text };
}
