import type { Metadata } from "next";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { formatDate } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { rich } from "@/i18n/rich";
import { otherMembers, pendingInvite, unlinkedPerson } from "@/lib/case";
import { contactUrl, newTab } from "@/lib/site";
import { requireCase } from "@/lib/session";
import { InviteForm, PendingInvite } from "@/components/app/invite-partner";
import { SettingsCard, SettingsPage } from "@/components/app/settings-ui";
import { TextLink } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.partner };
}

// Three states: the partner has joined, an invite is out, or neither (the
// invite form).
export default async function PartnerPage() {
  const { user, caseId } = await requireCase();
  const locale = await getAppLocale();
  const messages = await getAppDictionary();
  const t = messages.app.settings.partnerPage;
  const title = messages.app.settings.partner;

  const [partner] = await otherMembers(caseId, user.id);
  if (partner) {
    return (
      <SettingsPage title={title}>
        <SettingsCard title={title}>
          <p>{rich(format(t.joined, { name: partner.name ?? partner.email, email: partner.email }))}</p>
          <p className="mt-4 text-slate-700">{t.remove}</p>
          <TextLink href={contactUrl(locale)} {...newTab} className="mt-2">
            {t.support}
          </TextLink>
        </SettingsCard>
      </SettingsPage>
    );
  }

  const [invite, person] = await Promise.all([pendingInvite(caseId), unlinkedPerson(caseId)]);
  const name = person?.name || t.yourPartner;

  return (
    <SettingsPage title={title} intro={format(t.intro, { name })}>
      <SettingsCard title={title}>
        {invite ? (
          <PendingInvite
            t={t}
            auth={messages.app.auth}
            title={format(t.sentTitle, { email: invite.email })}
            body={format(t.sentBody, { date: formatDate(invite.sentAt, locale), name })}
          />
        ) : (
          <InviteForm t={t} auth={messages.app.auth} />
        )}
      </SettingsCard>
    </SettingsPage>
  );
}
