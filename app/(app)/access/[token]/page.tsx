import type { Metadata } from "next";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { formatDateTime } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { getOrClaimCaseId, requireUser } from "@/lib/session";
import { accessStatus, consentCopy, findAccessRequest } from "@/lib/support-access";
import { AccessConsent, AccessMessage } from "@/components/app/access-consent";
import { SignOutButton } from "@/components/app/sign-out-button";
import { ButtonLink } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.access };
}

// A support-access link (lib/support-access.ts): asks either partner for the
// team's OK to look at the file. Answering only records the consent.
export default async function AccessPage({ params }: PageProps<"/access/[token]">) {
  const user = await requireUser();
  const { token } = await params;
  const [request, caseId, locale, dictionary] = await Promise.all([
    findAccessRequest(token),
    getOrClaimCaseId(user),
    getAppLocale(),
    getAppDictionary(),
  ]);
  const t = dictionary.app.access;
  const backToFile = (
    <ButtonLink href="/file" variant="secondary" className="w-full">
      {t.backToFile}
    </ButtonLink>
  );

  if (!request) {
    return <AccessMessage icon="alertCircle" title={t.invalid.title} body={t.invalid.body} />;
  }
  if (request.caseId !== caseId) {
    return (
      <AccessMessage icon="user" title={t.otherAccount.title} body={format(t.otherAccount.body, { email: user.email })}>
        <SignOutButton className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border-[1.5px] border-navy-900 px-6 text-base font-semibold text-navy-900 transition-colors hover:bg-navy-900/5">
          {dictionary.app.shell.signOut}
        </SignOutButton>
      </AccessMessage>
    );
  }

  switch (accessStatus(request)) {
    case "consented": {
      const date = formatDateTime(request.accessEndsAt!, locale);
      const byMe = request.consentedBy === user.id;
      return (
        <AccessMessage
          icon="checkCircle"
          tone="success"
          title={byMe ? t.done.title : t.partnerDone.title}
          body={
            byMe
              ? format(t.done.body, { date })
              : format(t.partnerDone.body, { date, name: request.consentedByName ?? request.consentedByEmail ?? "" })
          }
        >
          {backToFile}
        </AccessMessage>
      );
    }
    case "cancelled":
      return <AccessMessage icon="alertCircle" title={t.invalid.title} body={t.invalid.body}>{backToFile}</AccessMessage>;
    case "expired":
      return <AccessMessage icon="clock" title={t.expired.title} body={t.expired.body}>{backToFile}</AccessMessage>;
    case "pending":
      return (
        <AccessConsent
          token={token}
          copy={consentCopy(t, request)}
          labels={{
            allow: t.allow,
            allowing: t.allowing,
            notNow: t.notNow,
            declinedTitle: t.declined.title,
            declinedBody: format(t.declined.body, { date: formatDateTime(request.linkExpiresAt, locale) }),
            declinedBack: t.declined.back,
            backToFile: t.backToFile,
          }}
        />
      );
  }
}
