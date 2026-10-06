import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppDictionary, getAppLocale } from "@/i18n/app-locale";
import { todayInIsrael } from "@/i18n/format";
import { format } from "@/i18n/messages";
import { awaitingDecision, type Stage } from "@/lib/stages";
import { caseDetails, caseFiles, listOf } from "@/lib/case-documents";
import { suggestionsFor } from "@/lib/chat/suggestions";
import { caseChecks } from "@/lib/checks/store";
import { uploadedKeys } from "@/lib/documents/progress";
import { documentTitle } from "@/lib/documents/titles";
import { maxMessageLength } from "@/lib/products";
import { chatBalance, chatMessages } from "@/lib/chat/store";
import { requireCase } from "@/lib/session";
import { localePath, site } from "@/lib/site";
import { ChatView } from "@/components/app/chat-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getAppDictionary()).app.meta.chat };
}

// /chat is a new chat; /chat/<id> is one of the case's chats. A new chat from
// a document's card (/chat?about=<document key>) starts with a question about
// it in the box, in the app's language, for the user to finish and send. A
// new chat suggests three questions from where the case is (lib/chat/suggestions.ts).
export default async function ChatPage({ params, searchParams }: PageProps<"/chat/[[...id]]">) {
  const [{ id: segments }, { about }] = await Promise.all([params, searchParams]);
  if (segments && segments.length > 1) notFound();
  const chatId = segments?.[0] ?? null;

  const { user, caseId } = await requireCase();
  const [t, locale, { paid }, messages] = await Promise.all([
    getAppDictionary(),
    getAppLocale(),
    chatBalance(caseId),
    chatId ? chatMessages(chatId, caseId) : [],
  ]);
  if (!messages) notFound();
  const aboutTitle = !chatId && typeof about === "string" ? documentTitle(about, t.app.documents, locale) : null;

  let suggestions: string[] = [];
  if (messages.length === 0) {
    const [{ row, people, details }, files, checks] = await Promise.all([
      caseDetails(caseId),
      caseFiles(caseId),
      caseChecks(caseId),
    ]);
    const name = (israeli: boolean) => people.find((p) => p.isIsraeli === israeli)?.name ?? "";
    const names = { israeli: name(true), foreign: name(false) };
    const toFix = new Set(
      [...checks]
        .filter(([, c]) => c.fresh && (c.result?.rating === "needsFixing" || c.result?.rating === "unreadable"))
        .map(([key]) => key),
    );
    suggestions = suggestionsFor(
      {
        stage: row.stage as Stage,
        awaitingDecision: awaitingDecision(row.stage as Stage, row.stageDates, todayInIsrael()),
        items: listOf(details),
        uploaded: uploadedKeys(files),
        toFix,
      },
      t.app.chat.suggestions,
      (key) => documentTitle(key, t.app.documents, locale, names) ?? key,
    );
  }

  return (
    <ChatView
      chatId={chatId}
      initialMessages={messages.map(({ id, role, content, userId, name }) => ({
        id,
        role,
        content,
        // Both partners write in the case's chats: name the other one's messages.
        author: role === "user" && userId !== user.id ? (name ?? t.app.chat.partner) : null,
      }))}
      draft={aboutTitle ? format(t.app.chat.aboutDocument, { document: aboutTitle }) : ""}
      suggestions={suggestions}
      maxLength={maxMessageLength({ paid })}
      termsUrl={new URL(localePath(locale, "/legal/terms"), site.url).toString()}
      t={t.app.chat}
    />
  );
}
