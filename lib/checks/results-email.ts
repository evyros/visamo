import "server-only";
import { send } from "@vercel/queue";
import { and, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/config";
import { format, loadMessages } from "@/i18n/messages";
import { db } from "@/lib/db";
import { caseMember, casePerson, cases, documentCheck, user } from "@/lib/db/schema";
import { caseFiles } from "@/lib/case-documents";
import { documentTitle } from "@/lib/documents/titles";
import { sendCheckResultsEmail } from "@/lib/email";
import { buyUrl } from "@/lib/buy-paths";
import { site } from "@/lib/site";
import { activeResult, type FindingKind } from "./dismissals";
import { findingText, type CheckFinding, type CheckRating } from "./result";
import { renderResultsEmail, severity, worstRating, type EmailDocument } from "./results-email-html";
import { caseChecks, isLocked } from "./store";

// The couple's email about free check results the admin approved
// (lib/checks/free.ts). An approval opens an hour (cases.results_email_due_at)
// unless one is open already, and everything approved in that hour goes in one
// email when it ends: approving a few documents in a row doesn't send a few
// emails. The hour doesn't start over with each approval, so the email is
// never more than an hour behind the first. An approval after it's sent
// opens a new hour.
//
// The hour is a message on Vercel Queues, delayed by it, which calls
// app/api/queues/check-results-email. Off Vercel (local development) there's
// no queue: the email is sent right away.
//
// The email (lib/checks/results-email-html.ts) has a card for each document:
// its rating, how many findings, and for the one shown in full, their titles
// in their colors. A locked one has only its rating and counts, never its
// findings' text: it must not reach the couple, and an email can't be taken
// back. Under the cards, how many other uploaded documents weren't checked, so
// the ones it lists don't read as the only ones with something to fix. The
// subject and heading follow the worst result in it.

export const CHECK_RESULTS_EMAIL_TOPIC = "check-results-email";

/** How long after the first approval the email goes out. */
const DELAY_SECONDS = 60 * 60;

export type CheckResultsEmailMessage = { caseId: string };

/**
 * Opens the case's hour, unless one is open: the email then goes out when it
 * ends. Never throws: approving is done either way.
 */
export async function queueResultsEmail(caseId: string) {
  try {
    await openWindow(caseId);
  } catch (error) {
    console.error("queueResultsEmail failed", caseId, error);
  }
}

async function openWindow(caseId: string) {
  // updated_at stays: this isn't a change the couple made.
  const [opened] = await db
    .update(cases)
    .set({ resultsEmailDueAt: sql`now() + make_interval(secs => ${DELAY_SECONDS})`, updatedAt: sql`${cases.updatedAt}` })
    .where(
      and(
        eq(cases.id, caseId),
        // An hour long past its end lost its email (the queue gave up): this approval opens a new one.
        or(isNull(cases.resultsEmailDueAt), lt(cases.resultsEmailDueAt, sql`now() - interval '1 hour'`)),
      ),
    )
    .returning({ dueAt: cases.resultsEmailDueAt });
  if (!opened) return;
  try {
    if (!process.env.VERCEL) {
      await deliverResultsEmail(caseId);
      return;
    }
    const message: CheckResultsEmailMessage = { caseId };
    await send(CHECK_RESULTS_EMAIL_TOPIC, message, {
      delaySeconds: DELAY_SECONDS,
      idempotencyKey: `check-results-email/${caseId}/${opened.dueAt?.getTime()}`,
    });
  } catch (error) {
    console.error("queueResultsEmail failed", caseId, error);
    // Closed again, so the next approval can open one: otherwise none would ever be sent.
    await db
      .update(cases)
      .set({ resultsEmailDueAt: null, updatedAt: sql`${cases.updatedAt}` })
      .where(eq(cases.id, caseId));
  }
}

/**
 * Sends the email for the case's open hour: every approved result not
 * emailed yet, the latest for each document, to both partners. Closing the
 * hour is the claim: a second delivery of the message finds it closed and
 * sends nothing, and a result approved while this sends opens a new hour.
 * Throws when sending fails, after opening the hour again, so the queue
 * retries.
 */
export async function deliverResultsEmail(caseId: string) {
  const [claimed] = await db
    .update(cases)
    .set({ resultsEmailDueAt: null, updatedAt: sql`${cases.updatedAt}` })
    .where(and(eq(cases.id, caseId), isNotNull(cases.resultsEmailDueAt)))
    .returning({ id: cases.id });
  if (!claimed) return;

  try {
    const runs = await db
      .select({
        id: documentCheck.id,
        documentKey: documentCheck.documentKey,
        rating: documentCheck.rating,
        issues: documentCheck.issues,
        recommendations: documentCheck.recommendations,
        hidden: documentCheck.hidden,
      })
      .from(documentCheck)
      .where(
        and(
          eq(documentCheck.caseId, caseId),
          eq(documentCheck.approval, "approved"),
          eq(documentCheck.state, "done"),
          isNull(documentCheck.replacedBy),
          isNull(documentCheck.emailedAt),
        ),
      )
      .orderBy(desc(documentCheck.startedAt));
    if (!runs.length) return;
    // Checked again and approved again within the hour: the latest says it.
    const latest = runs.filter((run, i) => runs.findIndex((r) => r.documentKey === run.documentKey) === i);

    const [members, people, [caseRow], files, checks] = await Promise.all([
      db
        .select({ id: user.id, email: user.email, locale: user.locale })
        .from(caseMember)
        .innerJoin(user, eq(user.id, caseMember.userId))
        .where(eq(caseMember.caseId, caseId)),
      db.select({ name: casePerson.name, isIsraeli: casePerson.isIsraeli }).from(casePerson).where(eq(casePerson.caseId, caseId)),
      db.select({ fileCheck: cases.fileCheck, freeFullKey: cases.freeFullKey }).from(cases).where(eq(cases.id, caseId)),
      caseFiles(caseId),
      caseChecks(caseId),
    ]);
    if (!caseRow) return;
    const names = {
      israeli: people.find((p) => p.isIsraeli)?.name ?? "",
      foreign: people.find((p) => !p.isIsraeli)?.name ?? "",
    };
    // The uploaded documents the couple has no current result for, as on their page: the email says
    // they weren't checked, so the ones it lists don't read as the only ones with something to fix.
    const uploaded = new Set(files.map((f) => f.documentKey));
    const unchecked = [...checks].filter(
      ([key, check]) => check.checkable && uploaded.has(key) && !(check.result && check.fresh),
    ).length;
    const key = latest
      .map((r) => r.id)
      .sort()
      .join(",");
    for (const member of members) {
      const locale = isLocale(member.locale) ? member.locale : defaultLocale;
      await sendCheckResultsEmail({
        to: member.email,
        email: await resultsEmail(latest, locale, names, caseRow, unchecked),
        // A retry after a send that went through doesn't send it twice.
        idempotencyKey: `check-results/${member.id}/${hash(key)}`,
      });
    }
    await db
      .update(documentCheck)
      .set({ emailedAt: new Date() })
      .where(inArray(documentCheck.id, runs.map((r) => r.id)));
  } catch (error) {
    await db
      .update(cases)
      .set({ resultsEmailDueAt: sql`now()`, updatedAt: sql`${cases.updatedAt}` })
      .where(and(eq(cases.id, caseId), isNull(cases.resultsEmailDueAt)));
    throw error;
  }
}

/** An approved result, as stored. */
type ApprovedRun = {
  documentKey: string;
  rating: CheckRating | null;
  issues: CheckFinding[] | null;
  recommendations: CheckFinding[] | null;
  hidden: { kind: FindingKind; index: number }[] | null;
};

/** The longest finding title the email shows; longer ones are cut. */
const MAX_TITLE = 120;

/**
 * The email for these results, in the couple's language, as they'd see each
 * on the documents page: without what the admin hid, its rating worked out
 * again, and a locked one with only how many findings it has (never their
 * text). The one shown in full comes first, then the rest, worst first.
 */
export async function resultsEmail(
  runs: ApprovedRun[],
  locale: Locale,
  names: { israeli: string; foreign: string },
  caseRow: { fileCheck: boolean; freeFullKey: string | null },
  /** How many uploaded documents have no current result: a line under the results says so. */
  unchecked = 0,
) {
  const t = await loadMessages(locale);
  const c = t.app.documentsPage.check;
  const e = t.app.email.checkResults;
  const plural = new Intl.PluralRules(locales[locale].intlLocale);
  const forms = (f: { one: string; other: string }, n: number) =>
    format(plural.select(n) === "one" ? f.one : f.other, { count: n });
  const title = (f: CheckFinding) => {
    const { title, detail } = findingText(f, locale);
    const text = title || detail;
    return text.length > MAX_TITLE ? `${text.slice(0, MAX_TITLE - 1).trimEnd()}…` : text;
  };

  const documents: (EmailDocument & { full: boolean })[] = runs.flatMap((run) => {
    if (!run.rating) return [];
    const active = activeResult(
      { rating: run.rating, issues: run.issues ?? [], recommendations: run.recommendations ?? [] },
      run.hidden ?? [],
    );
    const locked = active.rating !== "unreadable" && isLocked("approved", run.documentKey, caseRow);
    const counts =
      active.rating === "unreadable"
        ? ""
        : [
            active.issues.length && forms(c.counts.fix, active.issues.length),
            active.recommendations.length && forms(c.counts.tip, active.recommendations.length),
          ]
            .filter(Boolean)
            .join(", ");
    return [
      {
        title: documentTitle(run.documentKey, t.app.documents, locale, names) ?? run.documentKey,
        rating: active.rating,
        locked,
        // Never a locked result's findings: only its counts go out.
        issues: locked || active.rating === "unreadable" ? [] : active.issues.map(title),
        tips: locked || active.rating === "unreadable" ? [] : active.recommendations.map(title),
        counts,
        full: !locked,
      },
    ];
  });
  documents.sort((a, b) => Number(b.full) - Number(a.full) || severity[b.rating] - severity[a.rating]);

  const worst = worstRating(documents);
  return renderResultsEmail({
    dir: locales[locale].dir,
    lang: locale,
    documents,
    resultsUrl: new URL("/file/documents", site.appUrl).toString(),
    buyUrl: new URL(buyUrl("/file/documents"), site.appUrl).toString(),
    siteUrl: site.url,
    copy: {
      subject: e.subject[worst],
      heading: e.heading[worst],
      preheader: documents.map((d) => `${d.title}: ${c.ratings[d.rating]}`).join(" · "),
      intro: forms(e.intro, documents.length),
      ratings: c.ratings,
      more: (n) => forms(e.more, n),
      nothingToFix: e.nothingToFix,
      // Not with Full file check: they can check those themselves.
      unchecked: unchecked > 0 && !caseRow.fileCheck ? forms(e.unchecked, unchecked) : "",
      unreadable: e.unreadable,
      locked: c.locked,
      unlock: c.upgrade,
      button: e.button,
      disclaimer: c.disclaimer,
      ignore: e.ignore,
    },
  });
}

/** A short, stable hash of a string, for an idempotency key. */
function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
