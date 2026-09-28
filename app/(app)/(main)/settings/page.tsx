import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { getAppDictionary } from "@/i18n/app-locale";
import { format } from "@/i18n/messages";
import { otherMembers } from "@/lib/case";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { requireCase } from "@/lib/session";
import { AppLanguageSwitch } from "@/components/app/app-language-switch";
import { ChangePasswordForm } from "@/components/app/change-password-form";
import { DeleteAccount } from "@/components/app/delete-account";
import { SettingsCard, SettingsPage } from "@/components/app/settings-ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.account };
}

export default async function AccountPage() {
  const { user, caseId } = await requireCase();
  const messages = await getAppDictionary();
  const t = messages.app.settings.accountPage;

  const [providers, others] = await Promise.all([
    db.select({ id: account.providerId }).from(account).where(eq(account.userId, user.id)),
    otherMembers(caseId, user.id),
  ]);
  const hasPassword = providers.some((p) => p.id === "credential");
  const hasGoogle = providers.some((p) => p.id === "google");
  const partner = others[0];

  return (
    <SettingsPage title={messages.app.settings.account}>
      <SettingsCard title={t.loginTitle}>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-semibold text-slate-500">{t.email}</dt>
            <dd dir="ltr" className="text-start text-navy-900">
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-slate-500">{t.methods}</dt>
            <dd className="text-navy-900">
              {[hasPassword && t.password, hasGoogle && t.google].filter(Boolean).join(", ")}
            </dd>
          </div>
        </dl>
      </SettingsCard>

      <SettingsCard title={t.passwordTitle}>
        {hasPassword ? <ChangePasswordForm t={t} auth={messages.app.auth} /> : <p>{t.googleOnly}</p>}
      </SettingsCard>

      <SettingsCard title={t.languageTitle}>
        <p className="mb-4">{t.languageBody}</p>
        <AppLanguageSwitch />
      </SettingsCard>

      <SettingsCard title={t.deleteTitle} tone="danger">
        <DeleteAccount
          t={t}
          consequence={
            partner ? format(t.deleteShared, { name: partner.name ?? partner.email }) : t.deleteAlone
          }
        />
      </SettingsCard>
    </SettingsPage>
  );
}
