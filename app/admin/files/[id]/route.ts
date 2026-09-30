import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { caseFile } from "@/lib/db/schema";
import { filePath, thumbnailPath } from "@/lib/files/storage";

// Any case's uploaded file, or with ?thumbnail its thumbnail, for the admin.
// Like app/api/files/[id], but for every case, and removed files too: they're
// kept for reviewing the checks that saw them.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return new NextResponse(null, { status: 401 });
  const { id } = await params;
  const [file] = await db.select().from(caseFile).where(eq(caseFile.id, id)).limit(1);
  if (!file) return new NextResponse(null, { status: 404 });

  const thumbnail = request.nextUrl.searchParams.has("thumbnail");
  if (thumbnail && !file.hasThumbnail) return new NextResponse(null, { status: 404 });
  const result = await get(thumbnail ? thumbnailPath(file.caseId, file.id) : filePath(file.caseId, file.id), {
    access: "private",
  });
  if (result?.statusCode !== 200) return new NextResponse(null, { status: 404 });

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": thumbnail ? "image/jpeg" : file.contentType,
      "Content-Length": String(result.blob.size),
      "X-Content-Type-Options": "nosniff",
      // Identity documents: never kept on disk or in a shared cache.
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    },
  });
}
