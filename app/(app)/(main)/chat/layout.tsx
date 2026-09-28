import type { ReactNode } from "react";
import { getAppDictionary } from "@/i18n/app-locale";
import { SectionShell } from "@/components/app/section-shell";
import { ButtonLink, TextLink } from "@/components/ui";

// The sidebar's shape: new chat, the history, and the questions left with a
// way to buy more. The history and the count come with the chat itself.
export default async function ChatLayout({ children }: { children: ReactNode }) {
  const t = await getAppDictionary();
  return (
    <SectionShell
      title={t.app.chat.nav}
      labels={{ open: t.app.shell.sectionMenu, close: t.app.shell.closeSectionMenu }}
      sidebar={
        <div className="flex flex-1 flex-col gap-6">
          <ButtonLink href="/chat" size="sm" icon="plus">
            {t.app.chat.newChat}
          </ButtonLink>
          <section aria-labelledby="chat-history">
            <h2 id="chat-history" className="px-1 text-sm font-semibold text-slate-500">
              {t.app.chat.history}
            </h2>
            <p className="mt-2 px-1 text-sm text-slate-500">{t.app.chat.noChats}</p>
          </section>
          <div className="mt-auto border-t border-line-200 px-1 pt-4 text-[15px]">
            <TextLink href="/settings/billing">{t.app.chat.buyMore}</TextLink>
          </div>
        </div>
      }
    >
      {children}
    </SectionShell>
  );
}
