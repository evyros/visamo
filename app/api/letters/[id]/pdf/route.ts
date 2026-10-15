import { recordLetterEvent, visitFrom } from "@/lib/letters/events";
import { readLetterForm } from "@/lib/letters/form";
import { buildLetterPdf } from "@/lib/letters/pdf";
import { findLetterRequest } from "@/lib/letters/requests";
import { letterFileName } from "@/lib/letters/text";

// The friend's "Download PDF" (components/letters/letter-writer.tsx): builds
// the letter from what they posted and returns it. The letter exists only in
// this response; the stats get the writer's details and when.
export async function POST(request: Request, ctx: RouteContext<"/api/letters/[id]/pdf">) {
  const { id } = await ctx.params;
  const letterRequest = await findLetterRequest(id);
  if (!letterRequest) return Response.json({ error: "notFound" }, { status: 404 });

  const data = await request.formData().catch(() => null);
  if (!data) return Response.json({ error: "invalid" }, { status: 400 });
  const form = await readLetterForm(data, letterRequest);
  if (!form.ok) return Response.json({ error: form.error }, { status: 400 });

  const pdf = await buildLetterPdf(form.input);
  const name = letterFileName(form.input.writer.name);
  await recordLetterEvent(
    id,
    { type: "letter.downloaded", data: form.input.writer },
    visitFrom(data.get("visitor"), data.get("via")),
  );
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="recommendation-letter.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "no-store",
    },
  });
}
