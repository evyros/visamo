import "server-only";
import { Resend } from "resend";
import { locales, type Locale } from "@/i18n/config";
import { format, loadMessages } from "@/i18n/messages";
import { letterFileName } from "@/lib/letters/text";
import { signupUrl, site } from "@/lib/site";

// Transactional emails, sent through Resend in the recipient's language. They
// share one layout: a heading, a paragraph, a button with the link spelled out
// (when there's a link) or a code to type in (when there's a code), and a note
// for anyone who didn't expect the email.
// Without RESEND_API_KEY (local development), they're printed to the terminal.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM || "Visamo <no-reply@visamo.co.il>";

type Copy = { subject: string; heading: string; body: string; button?: string; ignore: string };
type Attachment = { filename: string; content: Buffer; contentType: string };

/** A message's copy with its `{placeholder}`s filled in. */
function formatCopy<T extends Record<string, string>>(copy: T, values: Record<string, string>) {
  return Object.fromEntries(Object.entries(copy).map(([key, value]) => [key, format(value, values)])) as T;
}

const escape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function sendEmail({
  to,
  url,
  code,
  locale,
  copy,
  replyTo,
  attachments,
}: {
  to: string;
  url?: string;
  code?: string;
  locale: Locale;
  copy: Copy;
  replyTo?: string;
  attachments?: Attachment[];
}) {
  if (!resend) {
    const files = attachments?.map((a) => `\n[attachment] ${a.filename} (${a.content.length} bytes)`).join("") ?? "";
    console.info(`\n[email] ${copy.subject} → ${to}\n${url ?? code ?? copy.body}${files}\n`);
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
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6">${escape(copy.body)}</p>${
          url
            ? `
        <a href="${escape(url)}" style="display:inline-block;padding:12px 24px;background:#2f7f76;color:#ffffff;border-radius:10px;font-weight:bold;text-decoration:none">${escape(copy.button ?? "")}</a>
        <p style="margin:24px 0 4px;font-size:13px;color:#55606e">${escape(t.fallback)}</p>
        <p style="margin:0 0 24px;font-size:13px;word-break:break-all" dir="ltr"><a href="${escape(url)}" style="color:#2f7f76">${escape(url)}</a></p>`
            : ""
        }${
          code
            ? `
        <p style="margin:0 0 24px;font-size:32px;font-weight:bold;letter-spacing:8px;font-family:'Courier New',monospace;text-align:center" dir="ltr">${escape(code)}</p>`
            : ""
        }
        <p style="margin:0;font-size:13px;color:#55606e">${escape(copy.ignore)}</p>
      </td></tr>
    </table>
  </body>
</html>`;
  const text = [copy.heading, copy.body, url, code, copy.ignore].filter(Boolean).join("\n\n");

  const { error } = await resend.emails.send({ from, to, replyTo, subject: copy.subject, html, text, attachments });
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

/** The code that finishes a password login (the two-factor plugin in lib/auth.ts). */
export async function sendLoginCode({ to, code, locale }: { to: string; code: string; locale: Locale }) {
  const copy = (await loadMessages(locale)).app.email.loginCode;
  await sendEmail({ to, code, locale, copy });
}

/** The code that makes a branches survey vote count (lib/branch-reports.ts), and a link that enters it. */
export async function sendSurveyCode({ to, code, url, locale }: { to: string; code: string; url: string; locale: Locale }) {
  const copy = (await loadMessages(locale)).app.email.surveyCode;
  await sendEmail({ to, code, url, locale, copy });
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
  const copy = formatCopy(t, values);
  await sendEmail({ to, url, locale, copy });
}

/** A support-access request (lib/support-access.ts), to one partner of the case. */
export async function sendSupportAccessEmail({ to, url, locale }: { to: string; url: string; locale: Locale }) {
  const copy = (await loadMessages(locale)).app.email.supportAccess;
  await sendEmail({ to, url, locale, copy });
}

/** The admin panel's login link (lib/admin.ts). English only: it goes to the owner. */
export async function sendAdminLoginEmail({ to, url }: { to: string; url: string }) {
  await sendEmail({
    to,
    url,
    locale: "en",
    copy: {
      subject: "Your Visamo admin login link",
      heading: "Log in to the admin panel",
      body: "This link works for 15 minutes, in the browser where you asked for it.",
      button: "Log in",
      ignore: "If you didn't ask for this, someone typed your email on the admin login page. Nobody can use this link but you.",
    },
  });
}

/**
 * A contact-form message (app/[lang]/contact/actions.ts), to the support
 * inbox. Replying goes to the sender. English only: it goes to the team. Not
 * stored anywhere else, so this email is the ticket.
 */
export async function sendSupportTicket({
  ticket,
  fields,
  message,
  replyTo,
  attachments,
}: {
  ticket: string;
  /** Label and value, shown as a table above the message. */
  fields: [string, string][];
  message: string;
  replyTo: string;
  attachments: Attachment[];
}) {
  const subject = `[${ticket}] ${fields.find(([label]) => label === "Topic")?.[1] ?? "Contact form"}`;
  if (!resend) {
    console.info(`\n[email] ${subject} → ${site.supportEmail}\n${fields.map(([l, v]) => `${l}: ${v}`).join("\n")}\n\n${message}\n`);
    return;
  }

  const rows = fields
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#55606e;white-space:nowrap">${escape(label)}</td><td style="padding:4px 0" dir="auto">${escape(value)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f2a44">
    <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table>
    <div dir="auto" style="margin-top:20px;padding:16px;background:#f8f6f1;border-radius:8px;font-size:15px;line-height:1.6;white-space:pre-wrap">${escape(message)}</div>
  </body>
</html>`;
  const text = `${fields.map(([l, v]) => `${l}: ${v}`).join("\n")}\n\n${message}`;

  const { error } = await resend.emails.send({
    from,
    to: site.supportEmail,
    replyTo,
    subject,
    html,
    text,
    attachments,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}

/**
 * Tells the sender we got their contact-form message, with its ticket number.
 * It carries nothing they typed: anyone can enter any address in the form, so
 * this email must not be usable to send someone else a message.
 */
export async function sendTicketConfirmation({ to, ticket, locale }: { to: string; ticket: string; locale: Locale }) {
  const t = (await loadMessages(locale)).app.email.ticket;
  const copy = formatCopy(t, { ticket });
  await sendEmail({ to, locale, copy, replyTo: site.supportEmail });
}

/**
 * A friend's recommendation letter, to the couple who asked for it
 * (app/api/letters/[id]/send), attached. The PDF isn't stored anywhere, and
 * Resend's logs are off, so this email is the only copy.
 */
export async function sendLetterEmail({
  to,
  locale,
  writer,
  pdf,
}: {
  to: string;
  locale: Locale;
  writer: string;
  pdf: Uint8Array;
}) {
  const copy = formatCopy((await loadMessages(locale)).app.email.letter, { writer });
  await sendEmail({
    to,
    url: signupUrl(locale),
    locale,
    copy,
    attachments: [
      {
        filename: letterFileName(writer),
        content: Buffer.from(pdf),
        contentType: "application/pdf",
      },
    ],
  });
}

/**
 * Asks a friend to write a recommendation letter, with the link to write it.
 * In Hebrew: the writers are Israelis. Replies go to the couple. Its text is
 * fixed, with only the couple's names (checked to be names) and the link, so
 * the form can't be used to send anyone a message of its own.
 */
export async function sendLetterInvite({ to, url, names, replyTo }: { to: string; url: string; names: string; replyTo?: string }) {
  const copy = formatCopy((await loadMessages("he")).app.email.letterInvite, { names });
  await sendEmail({ to, url, locale: "he", copy, replyTo });
}
