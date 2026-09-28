import "server-only";
import { Resend } from "resend";
import { locales, type Locale } from "@/i18n/config";
import { format, loadMessages } from "@/i18n/messages";

// Transactional emails, sent through Resend in the recipient's language. They
// share one layout: a heading, a paragraph, a button, the link spelled out,
// and a note for anyone who didn't expect the email. Without RESEND_API_KEY
// (local development), the link is printed to the terminal.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM || "Visamo <no-reply@visamo.co.il>";

type Copy = { subject: string; heading: string; body: string; button: string; ignore: string };

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function sendEmail({ to, url, locale, copy }: { to: string; url: string; locale: Locale; copy: Copy }) {
  if (!resend) {
    console.info(`\n[email] ${copy.subject} → ${to}\n${url}\n`);
    return;
  }

  const t = (await loadMessages(locale)).app.email;
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
        <p style="margin:24px 0 0;font-size:13px;color:#55606e">${escape(copy.ignore)}</p>
      </td></tr>
    </table>
  </body>
</html>`;
  const text = `${copy.heading}\n\n${copy.body}\n\n${url}\n\n${copy.ignore}`;

  const { error } = await resend.emails.send({ from, to, subject: copy.subject, html, text });
  if (error) throw new Error(`Resend: ${error.message}`);
}

export async function sendAuthEmail({
  kind,
  to,
  url,
  locale,
}: {
  kind: "signup" | "resetPassword" | "googleSignIn";
  to: string;
  url: string;
  locale: Locale;
}) {
  const t = (await loadMessages(locale)).app.email;
  await sendEmail({ to, url, locale, copy: { ...t[kind], ignore: t.ignore } });
}

/** Invites a partner into the file. `inviter` is the inviting partner's name. */
export async function sendInviteEmail({
  to,
  url,
  locale,
  inviter,
}: {
  to: string;
  url: string;
  locale: Locale;
  inviter: string;
}) {
  const t = (await loadMessages(locale)).app.email.invite;
  const values = { name: inviter, email: to };
  const copy = Object.fromEntries(Object.entries(t).map(([key, value]) => [key, format(value, values)])) as Copy;
  await sendEmail({ to, url, locale, copy });
}
