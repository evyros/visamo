import { defaultLocale, isLocale } from "@/i18n/config";
import { sendLetterEmail } from "@/lib/email";
import { recordLetterEvent, visitFrom } from "@/lib/letters/events";
import { readLetterForm } from "@/lib/letters/form";
import { buildLetterPdf } from "@/lib/letters/pdf";
import { findLetterRequest, release, reserve } from "@/lib/letters/requests";
import { passedTurnstile } from "@/lib/turnstile";

// The friend's "Send to the couple" (components/letters/letter-writer.tsx):
// builds the letter and emails it to the address the couple gave. The letter
// isn't stored: the request's count goes up, and the stats get the writer's
// details and when. Turnstile and the
// per-request cap keep the link from being used to flood their inbox.
export async function POST(request: Request, ctx: RouteContext<"/api/letters/[id]/send">) {
  const { id } = await ctx.params;
  const letterRequest = await findLetterRequest(id);
  if (!letterRequest) return Response.json({ error: "notFound" }, { status: 404 });
  // A couple who gave no email gets no letters by email: their friends download them.
  const to = letterRequest.email;
  if (!to) return Response.json({ error: "invalid" }, { status: 400 });

  const data = await request.formData().catch(() => null);
  if (!data) return Response.json({ error: "invalid" }, { status: 400 });
  const form = await readLetterForm(data, letterRequest);
  if (!form.ok) return Response.json({ error: form.error }, { status: 400 });

  const token = data.get("cf-turnstile-response");
  if (!(await passedTurnstile(typeof token === "string" ? token : ""))) {
    return Response.json({ error: "verify" }, { status: 400 });
  }
  if (!(await reserve(id, "letter"))) return Response.json({ error: "limit" }, { status: 429 });

  try {
    const pdf = await buildLetterPdf(form.input);
    await sendLetterEmail({
      to,
      locale: isLocale(letterRequest.locale) ? letterRequest.locale : defaultLocale,
      writer: form.input.writer.name,
      pdf,
    });
  } catch (error) {
    // The error only: never the letter or what the friend typed.
    console.error("letters/send:", error instanceof Error ? error.message : "failed");
    await release(id, "letter");
    return Response.json({ error: "failed" }, { status: 500 });
  }
  await recordLetterEvent(
    id,
    { type: "letter.sent", data: form.input.writer },
    visitFrom(data.get("visitor"), data.get("via")),
  );
  return Response.json({ ok: true });
}
