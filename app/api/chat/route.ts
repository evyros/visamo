import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chat, chatMessage } from "@/lib/db/schema";
import { complete, streamCompletion, type ModelMessage } from "@/lib/chat/openrouter";
import { maxMessageLength } from "@/lib/chat/plans";
import { casePrompt, staticPrompt } from "@/lib/chat/prompt";
import { chatBalance, chatMessages, inCase, refundMessage, spendMessage } from "@/lib/chat/store";
import { findUserCase } from "@/lib/session";

// Sends the assistant one message in one of the case's chats (either partner
// can ask in any of them) and streams the answer back as plain text.
// The message costs one from the case's balance, given back if no answer
// comes. The chat is saved as it goes: the user's message before the model is
// called, the answer once it's complete (even if the browser left midway).
// A new chat gets its title, a short summary of the first message, saved as
// soon as it's written.

export const maxDuration = 120;

/** Earlier messages sent along with a new one, so a long chat stays affordable. */
const HISTORY = 20;
const MAX_ANSWER_TOKENS = 1200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type ErrorCode = "unauthorized" | "invalid" | "tooLong" | "notFound" | "noMessages" | "failed";
const fail = (error: ErrorCode, status: number) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const current = await findUserCase();
  if (!current) return fail("unauthorized", 401);
  const { user, caseId } = current;

  const body = (await request.json().catch(() => null)) as { chatId?: unknown; message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const existing = typeof body?.chatId === "string" ? body.chatId : null;
  if (!message || (existing !== null && !UUID.test(existing))) return fail("invalid", 400);

  const { plan } = await chatBalance(caseId);
  if (message.length > maxMessageLength(plan)) return fail("tooLong", 400);
  if (existing && !(await inCase(existing, caseId))) return fail("notFound", 404);

  const messagesLeft = await spendMessage(caseId);
  if (messagesLeft === null) return fail("noMessages", 402);

  const chatId = existing ?? crypto.randomUUID();
  const messageId = crypto.randomUUID();
  const insert = db
    .insert(chatMessage)
    .values({ id: messageId, chatId, role: "user", userId: user.id, content: message });
  if (existing) await insert;
  else await db.batch([db.insert(chat).values({ id: chatId, caseId, createdBy: user.id }), insert]);

  // Nothing came of the message: as if it was never sent.
  const undo = async () => {
    await (existing
      ? db.delete(chatMessage).where(eq(chatMessage.id, messageId))
      : db.delete(chat).where(eq(chat.id, chatId)));
    await refundMessage(caseId);
  };

  // A new chat's title is written alongside the answer, from the message alone.
  const title = existing ? null : summarize(message);

  let answer: AsyncIterator<string>;
  let first: IteratorResult<string>;
  try {
    const [system, file, history] = await Promise.all([
      staticPrompt(),
      casePrompt(caseId, user.id),
      chatMessages(chatId, caseId),
    ]);
    const messages: ModelMessage[] = [
      {
        role: "system",
        content: [
          { type: "text", text: system, cache_control: { type: "ephemeral" } },
          { type: "text", text: file },
        ],
      },
      // Both partners can write in a chat: mark the messages the other one wrote.
      ...(history ?? []).slice(-HISTORY).map(({ role, content, userId, name }) => ({
        role,
        content: role === "user" && userId !== user.id ? `[Asked by ${name ?? "the other partner"}]\n${content}` : content,
      })),
    ];
    answer = streamCompletion(messages, MAX_ANSWER_TOKENS)[Symbol.asyncIterator]();
    first = await answer.next();
    if (first.done) throw new Error("The model's answer was empty");
  } catch (error) {
    console.error("chat: no answer", error);
    await undo();
    return fail("failed", 502);
  }

  // Saved as soon as it's ready, not with the answer, so the sidebar can show
  // it early (the other partner's, or after a reload). summarize never throws.
  const titleSaved = title?.then(async (text) => {
    try {
      await db.update(chat).set({ title: text }).where(eq(chat.id, chatId));
    } catch (error) {
      console.error("chat: title not saved", error);
    }
  });

  // The browser's end of the answer; null once it has left.
  const encoder = new TextEncoder();
  const browser: { out: ReadableStreamDefaultController<Uint8Array> | null } = { out: null };
  const send = (text: string) => {
    try {
      browser.out?.enqueue(encoder.encode(text));
    } catch {
      browser.out = null; // Keep going without it, so the answer is saved.
    }
  };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      browser.out = controller;
    },
    cancel() {
      browser.out = null;
    },
  });

  const finished = (async () => {
    let text = first.value;
    let broken = false;
    send(text);
    try {
      for (let next = await answer.next(); !next.done; next = await answer.next()) {
        text += next.value;
        send(next.value);
      }
    } catch (error) {
      console.error("chat: answer cut off", error);
      broken = true;
    }
    try {
      await db.batch([
        db.insert(chatMessage).values({ id: crypto.randomUUID(), chatId, role: "assistant", content: text }),
        db.update(chat).set({ updatedAt: new Date() }).where(eq(chat.id, chatId)),
      ]);
    } catch (error) {
      console.error("chat: answer not saved", error);
      broken = true;
    }
    // The browser refreshes the sidebar when the answer ends: have the title in by then.
    await titleSaved;
    try {
      if (broken) browser.out?.error(new Error("cut off"));
      else browser.out?.close();
    } catch {
      // Already closed by the browser leaving.
    }
  })();
  after(() => finished);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Chat-Id": chatId,
      "X-Messages-Left": String(messagesLeft),
    },
  });
}

/** A few words that sum up the first message, in its language, for the sidebar. */
async function summarize(message: string) {
  const fallback = message.length > 60 ? `${message.slice(0, 57).trimEnd()}…` : message;
  try {
    const title = await complete(
      [
        {
          role: "system",
          content:
            "You write titles for a chat list. Reply with a title of 2 to 6 words that sums up the user's message, in the same language as the message. No quotes, no final period, nothing else.",
        },
        { role: "user", content: message },
      ],
      30,
    );
    return title.replace(/^["'«“]+|["'»”.]+$/g, "").slice(0, 80) || fallback;
  } catch (error) {
    console.error("chat: no title", error);
    return fallback;
  }
}
