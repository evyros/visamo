import "server-only";
import { Resend } from "resend";
import { locales, type Locale } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages";

// Auth emails, sent through Resend in the user's language. Without
// RESEND_API_KEY (local development), the link is printed to the terminal.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM || "Visamo <no-reply@visamo.co.il>";

type Kind = "signup" | "resetPassword";

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendAuthEmail({
  kind,
  to,
  url,
  locale,
}: {
  kind: Kind;
  to: string;
  url: string;
  locale: Locale;
}) {
  const t = (await loadMessages(locale)).app.email;
  const copy = t[kind];

  if (!resend) {
    console.info(`\n[email] ${copy.subject} → ${to}\n${url}\n`);
    return;
  }

  const { dir } = locales[locale];
  const align = dir === "rtl" ? "right" : "left";
  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
  <body style="margin:0;padding:24px;background:#f8f6f1;font-family:Arial,Helvetica,sans-serif;color:#0f2a44">
    <table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:32px;text-align:${align}" dir="${dir}">
        <p style="margin:0 0 24px;font-size:22px;font-weight:bold">Visamo</p>
        <h1 style="margin:0 0 12px;font-size:20px">${escape(copy.heading)}</h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6">${escape(copy.body)}</p>
        <a href="${escape(url)}" style="display:inline-block;padding:12px 24px;background:#2f7f76;color:#ffffff;border-radius:10px;font-weight:bold;text-decoration:none">${escape(copy.button)}</a>
        <p style="margin:24px 0 4px;font-size:13px;color:#55606e">${escape(t.fallback)}</p>
        <p style="margin:0;font-size:13px;word-break:break-all" dir="ltr"><a href="${escape(url)}" style="color:#2f7f76">${escape(url)}</a></p>
        <p style="margin:24px 0 0;font-size:13px;color:#55606e">${escape(t.ignore)}</p>
      </td></tr>
    </table>
  </body>
</html>`;
  const text = `${copy.heading}\n\n${copy.body}\n\n${url}\n\n${t.ignore}`;

  const { error } = await resend.emails.send({ from, to, subject: copy.subject, html, text });
  if (error) throw new Error(`Resend: ${error.message}`);
}
